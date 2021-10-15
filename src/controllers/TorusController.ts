import { Connection, Message, Transaction } from "@solana/web3.js";
import {
  BaseConfig,
  BaseController,
  BaseEmbedController,
  BaseEmbedControllerState,
  BROADCAST_CHANNELS,
  COMMUNICATION_NOTIFICATIONS,
  CommunicationWindowManager,
  createLoggerMiddleware,
  createOriginMiddleware,
  DEFAULT_PREFERENCES,
  ICommunicationProviderHandlers,
  PopupWithBcHandler,
  PROVIDER_NOTIFICATIONS,
  providerAsMiddleware,
  ProviderConfig,
  SafeEventEmitterProvider,
  TransactionState,
  TX_EVENTS,
  UserInfo,
} from "@toruslabs/base-controllers";
import { LOGIN_PROVIDER_TYPE } from "@toruslabs/openlogin";
import {
  createEngineStream,
  JRPCEngine,
  JRPCEngineEndCallback,
  JRPCEngineNextCallback,
  JRPCRequest,
  JRPCResponse,
  setupMultiplex,
  Stream,
  Substream,
} from "@toruslabs/openlogin-jrpc";
import { randomId } from "@toruslabs/openlogin-utils";
import {
  AccountTrackerController,
  CurrencyController,
  ExtendedAddressPreferences,
  IProviderHandlers,
  KeyringController,
  NetworkController,
  PreferencesController,
  SUPPORTED_NETWORKS,
  TransactionController,
} from "@toruslabs/solana-controllers";
import BigNumber from "bignumber.js";
import bs58 from "bs58";
import { cloneDeep } from "lodash";
import log from "loglevel";
import pump from "pump";
import { Duplex } from "readable-stream";

import OpenLoginHandler from "@/auth/OpenLoginHandler";
import config from "@/config";
import { BUTTON_POSITION, OpenLoginPopupResponse, TorusControllerConfig, TorusControllerState } from "@/utils/enums";

// import { debounce, DebouncedFunc } from "lodash";
import { PKG } from "../const";
const TARGET_NETWORK = "testnet";

export const DEFAULT_CONFIG = {
  CurrencyControllerConfig: { api: config.api, pollInterval: 600_000 },
  NetworkControllerConfig: { providerConfig: SUPPORTED_NETWORKS[TARGET_NETWORK] },
  PreferencesControllerConfig: { pollInterval: 180_000, api: config.api, signInPrefix: "Solana Signin" },
  TransactionControllerConfig: { txHistoryLimit: 40 },
};
export const DEFAULT_STATE = {
  AccountTrackerState: { accounts: {} },
  KeyringControllerState: { wallets: [], keyrings: [] },
  CurrencyControllerState: {
    conversionDate: Date.now().toString(),
    conversionRate: 0,
    currentCurrency: "usd",
    nativeCurrency: "sol",
    ticker: "sol",
  },
  NetworkControllerState: {
    chainId: SUPPORTED_NETWORKS[TARGET_NETWORK]?.chainId,
    properties: {},
    providerConfig: SUPPORTED_NETWORKS[TARGET_NETWORK],
  },
  PreferencesControllerState: {
    identities: {},
    selectedAddress: "",
    api: "",
    signInPrefix: "Solana Signin",
  },
  TransactionControllerState: {
    transactions: {},
    unapprovedTxs: {},
    currentNetworkTxsList: [],
  },
  EmbedControllerState: {
    buttonPosition: BUTTON_POSITION.BOTTOM_RIGHT,
    isIFrameFullScreen: false,
    apiKey: "torus-default",
    oauthModalVisibility: false,
    loginInProgress: false,
    dappMetadata: {
      name: "",
      icon: "",
    },
  },
};

export default class TorusController extends BaseController<TorusControllerConfig, TorusControllerState> {
  private networkController!: NetworkController;
  private currencyController!: CurrencyController;
  private accountTracker!: AccountTrackerController;
  private keyringController!: KeyringController;
  private preferencesController!: PreferencesController;
  private txController!: TransactionController;
  private communicationEngine?: JRPCEngine;
  private embedController!: BaseEmbedController<BaseConfig, BaseEmbedControllerState>;
  private engine?: JRPCEngine;

  public communicationManager = new CommunicationWindowManager();
  //   private sendUpdate: DebouncedFunc<() => void>;

  constructor({ config, state }: { config: Partial<TorusControllerConfig>; state: Partial<TorusControllerState> }) {
    super({ config, state });
  }
  /**
   * Always call init function before using this controller
   */
  public init({ config, state }: { config: Partial<TorusControllerConfig>; state: Partial<TorusControllerState> }): void {
    log.info(config, state, "restoring config & state");
    this.initialize();
    this.configure(config, true, true);
    this.update(state, true);
    this.networkController = new NetworkController({ config: this.config.NetworkControllerConfig, state: this.state.NetworkControllerState });
    this.initializeProvider();
    this.embedController = new BaseEmbedController({ config: {}, state: this.state.EmbedControllerState });
    this.initializeCommunicationProvider();

    this.currencyController = new CurrencyController({
      config: this.config.CurrencyControllerConfig,
      state: this.state.CurrencyControllerState,
    });
    this.currencyController.updateConversionRate();
    this.currencyController.scheduleConversionInterval();

    // key mgmt
    this.keyringController = new KeyringController({
      config: this.config.KeyringControllerConfig,
      state: this.state.KeyringControllerState,
    });

    this.preferencesController = new PreferencesController({
      state: this.state.PreferencesControllerState,
      config: this.config.PreferencesControllerConfig,
      provider: this.networkController._providerProxy,
      signAuthMessage: this.keyringController.signAuthMessage.bind(this.keyringController),
      getProviderConfig: this.networkController.getProviderConfig.bind(this.networkController),
      getNativeCurrency: this.currencyController.getNativeCurrency.bind(this.currencyController),
      getCurrentCurrency: this.currencyController.getCurrentCurrency.bind(this.currencyController),
      getConversionRate: this.currencyController.getConversionRate.bind(this.currencyController),
    });

    this.accountTracker = new AccountTrackerController({
      provider: this.networkController._providerProxy,
      state: this.state.AccountTrackerState,
      config: this.config.AccountTrackerConfig,
      // blockTracker: this.networkController._blockTrackerProxy,
      getIdentities: () => this.preferencesController.state.identities,
      onPreferencesStateChange: (listener) => this.preferencesController.on("store", listener),
      // onNetworkChange: (listener) => this.networkController.on("store", listener),
    });

    this.txController = new TransactionController({
      config: this.config.TransactionControllerConfig,
      state: this.state.TransactionControllerState,
      blockTracker: this.networkController._blockTrackerProxy,
      provider: this.networkController._providerProxy,
      getCurrentChainId: this.networkController.getNetworkIdentifier.bind(this.networkController),
      signTransaction: this.keyringController.signTransaction.bind(this.keyringController),
    });

    this.txController.on(TX_EVENTS.TX_UNAPPROVED, ({ txMeta, req }) => {
      console.log(req);
      this.emit(TX_EVENTS.TX_UNAPPROVED, { txMeta, req });
    });

    this.networkController._blockTrackerProxy.on("latest", () => {
      if (this.preferencesController.state.selectedAddress) {
        this.preferencesController.sync(this.preferencesController.state.selectedAddress);
      }
    });

    // ensure accountTracker updates balances after network change
    this.networkController.on("networkDidChange", () => {
      console.log("network changed");
    });

    this.networkController.lookupNetwork();

    // Listen to controller changes
    this.preferencesController.on("store", (state) => {
      this.update({ PreferencesControllerState: state });
    });

    this.currencyController.on("store", (state) => {
      this.update({ CurrencyControllerState: state });
    });

    this.networkController.on("store", (state) => {
      this.update({ NetworkControllerState: state });
    });

    this.accountTracker.on("store", (state) => {
      this.update({ AccountTrackerState: state });
    });

    this.keyringController.on("store", (state) => {
      this.update({ KeyringControllerState: state });
    });

    this.txController.on("store", (state: TransactionState<Transaction>) => {
      this.update({ TransactionControllerState: state });
      // Object.keys(state.transactions).forEach((txId) => {
      //   this.preferencesController.patchNewTx(state.transactions[txId], this.preferencesController.state.selectedAddress).catch((err) => {
      //     log.error("error while patching a new tx", err);
      //   });
      // });
    });

    this.embedController.on("store", (state) => {
      this.update({ EmbedControllerState: state });
    });

    // this.prefsController.poll(40000);
    // ensure isClientOpenAndUnlocked is updated when memState updates
    // this.subscribeEvent("update", (torusControllerState: unknown) => this._onStateUpdate(torusControllerState));

    // this.subscribe(this.sendUpdate.bind(this));

    // if (typeof options.rehydrate === "function") {
    //   setTimeout(() => {
    //     options.rehydrate();
    //   }, 50);
    // }
    // this.sendUpdate = debounce(this.privateSendUpdate.bind(this), 200);
  }

  get origin(): string {
    return this.preferencesController.iframeOrigin;
  }

  setOrigin(origin: string): void {
    this.preferencesController.setIframeOrigin(origin);
  }

  get userSOLBalance(): string {
    const balance = this.accountTracker.state.accounts[this.selectedAddress]?.balance || "0x0";
    const value = new BigNumber(balance).div(new BigNumber(10 ** 9));
    return value.toString();
  }

  private initializeProvider() {
    const providerHandlers: IProviderHandlers = {
      version: PKG.version,
      requestAccounts: this.requestAccounts.bind(this),

      getAccounts: async () =>
        // Expose no accounts if this origin has not been approved, preventing
        // account-requiring RPC methods from completing successfully
        // only show address if account is unlocked
        this.preferencesController.state.selectedAddress ? [this.preferencesController.state.selectedAddress] : [],
      // tx signing
      signMessage: async (req) => {
        console.log(req.method);
        return {} as unknown;
      },
      signTransaction: async (req) => {
        const message = req.params?.message;
        if (!message) {
          throw new Error("empty error message");
        }

        const data = Buffer.from(message, "hex");
        const tx = Transaction.populate(Message.from(data));
        const txRes = await this.txController.addSignTransaction(tx, req);
        const result = await txRes.result;
        console.log(result);
        return txRes.transactionMeta.transaction.serialize().toString("hex");
      },
      signAllTransactions: async (req) => {
        console.log(req.method);
        return {} as unknown;
      },
      sendTransaction: async (req) => {
        const message = req.params?.message;
        if (!message) {
          throw new Error("empty error message");
        }

        console.log(req);
        const data = Buffer.from(message, "hex");
        const tx = Transaction.populate(Message.from(data), []);
        const res = await this.txController.addTransaction(tx, req);
        const resp = await res.result;
        return resp;
      },
      getProviderState: (req, res, _, end) => {
        res.result = {
          accounts: this.keyringController.getPublicKeys(),
          chainId: this.networkController.state.chainId,
          isUnlocked: !!this.selectedAddress,
        };
        end();
      },
    };
    const providerProxy = this.networkController.initializeProvider(providerHandlers);
    return providerProxy;
  }

  async approveSignTransaction(txId: string): Promise<void> {
    const res = await this.txController.approveSignTransaction(txId, this.state.PreferencesControllerState.selectedAddress);
    console.log(res);
    return;
  }
  async approveTransaction(txId: string): Promise<void> {
    await this.txController.approveTransaction(txId, this.state.PreferencesControllerState.selectedAddress);
    return;
  }

  async addSignTransaction(txParams: Transaction, origin?: string): Promise<{ signature: string }> {
    const txRes = await this.txController.addSignTransaction(txParams);
    console.log(txRes);
    const signature = await txRes.result;
    return { signature: signature };
  }

  async signAndTransfer(tx: Transaction): Promise<string> {
    const conn = new Connection(this.state.NetworkControllerState.providerConfig.rpcTarget);
    // ControllersModule.torus.signTransaction(tf);
    const res = await this.addSignTransaction(tx, location.origin);
    console.log(res);
    const resp = await conn.sendRawTransaction(tx.serialize());
    console.log(resp);
    console.log("confirm");
    return resp;
  }
  async transfer(tx: Transaction): Promise<string> {
    // ControllersModule.torus.signTransaction(tf);
    console.log(tx);
    const res = await this.txController.addTransaction(tx);
    const resp = await res.result;
    return resp;
  }

  async providertransfer(tx: Transaction, origin?: string): Promise<string> {
    const provider = await this.networkController.getProvider();
    const res = await provider.sendAsync({
      jsonrpc: "2.0",
      id: randomId(),
      method: "send_transaction",
      params: {
        message: bs58.encode(tx.serializeMessage()),
      },
    });
    console.log(res);
    return res as string;
  }
  async signtransfer(tx: Transaction): Promise<string> {
    const provider = await this.networkController.getProvider();
    const res = await provider.sendAsync({
      jsonrpc: "2.0",
      id: randomId(),
      method: "sign_transaction",
      params: {
        message: tx.serializeMessage().toString("hex"),
      },
    });
    console.log(res);
    return res as string;
  }
  //   private isUnlocked(): boolean {
  //     return !!this.prefsController.state.selectedAddress;
  //   }
  /**
   * A method for emitting the full torus controller state to all registered listeners.
   * @private
   */
  //   private privateSendUpdate(): void {
  //     this.notifyEvent("update", this.state);
  //   }

  /**
   * Handle memory state updates.
   * - Ensure isClientOpenAndUnlocked is updated
   * - Notifies all connections with the new provider network state
   *   - The external providers handle diffing the state
   */
  //   private _onStateUpdate() {
  //     this.notifyAllConnections({
  //       method: NOTIFICATION_NAMES.chainChanged,
  //       params: this.getProviderNetworkState(newState),
  //     });
  //   }

  /**
   * Causes the RPC engines associated with all connections to emit a
   * notification event with the given payload.
   *
   * The caller is responsible for ensuring that only permitted notifications
   * are sent.
   *
   * @param {any} payload - The event payload, or payload getter function.
   */
  //   private notifyAllConnections(payload: unknown) {
  //     const getPayload = () => payload;
  //     if (this.engine) {
  //       this.engine.emit("notification", getPayload());
  //     }
  //   }

  async addAccount(privKey: string, userInfo: UserInfo): Promise<string> {
    const paddedKey = privKey.padStart(64, "0");
    const address = this.keyringController.importAccount(paddedKey);
    await this.preferencesController.initPreferences({
      address,
      calledFromEmbed: false,
      userInfo,
      rehydrate: true,
      jwtToken: "bypass init for now",
    });
    return address;
  }

  setSelectedAccount(address: string): void {
    this.preferencesController.setSelectedAddress(address);
    this.preferencesController.sync(address);
  }

  async setCurrentCurrency(currency: string): Promise<void> {
    const { ticker } = this.networkController.getProviderConfig();
    // This is CSPR
    this.currencyController.setNativeCurrency(ticker);
    // This is USD
    this.currencyController.setCurrentCurrency(currency);
    await this.currencyController.updateConversionRate();
    // TODO: store this in prefsController
  }

  setNetwork(providerConfig: ProviderConfig): void {
    this.networkController.setProviderConfig(providerConfig);
  }

  getAccountPreferences(address: string): ExtendedAddressPreferences | undefined {
    return this.preferencesController && this.preferencesController.getAddressState(address);
  }

  signTransaction(transaction: Transaction): Transaction {
    return this.keyringController.signTransaction(transaction, this.state.PreferencesControllerState.selectedAddress);
  }

  // signAllTransaction( transactions : Transaction[]) :Transaction[] {
  //   return this.keyringController.signTransaction(transactions, this.state.PreferencesControllerState.selectedAddress);
  // }

  get selectedAddress(): string {
    return this.preferencesController.state.selectedAddress;
  }

  get userInfo(): UserInfo {
    return this.preferencesController.state.identities[this.selectedAddress]?.userInfo || cloneDeep(DEFAULT_PREFERENCES.userInfo);
  }

  get communicationProvider(): SafeEventEmitterProvider {
    return this.embedController._communicationProviderProxy;
  }

  get provider(): SafeEventEmitterProvider {
    return this.networkController._providerProxy as unknown as SafeEventEmitterProvider;
  }

  private async requestAccounts(req: JRPCRequest<unknown>): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const [requestedLoginProvider, login_hint] = req.params as string[];
      const currentLoginProvider = this.getAccountPreferences(this.selectedAddress)?.userInfo.typeOfLogin;
      console.log(currentLoginProvider);
      if (requestedLoginProvider) {
        if (requestedLoginProvider === currentLoginProvider && this.selectedAddress) {
          resolve([this.selectedAddress]);
        } else {
          // To login with the requested provider
          // On Embed, we have a window waiting... we need to tell it to login
          this.embedController.update({ loginInProgress: true, oauthModalVisibility: false });
          this.triggerLogin({ loginProvider: requestedLoginProvider as LOGIN_PROVIDER_TYPE, login_hint });
          this.once("LOGIN_RESPONSE", (error: string, address: string) => {
            this.embedController.update({ loginInProgress: false, oauthModalVisibility: false });
            if (error) reject(new Error(error));
            else resolve([address]);
          });
        }
      } else {
        if (this.selectedAddress) resolve([this.selectedAddress]);
        else {
          // We show the modal to login
          this.embedController.update({ loginInProgress: true, oauthModalVisibility: true });
          this.once("LOGIN_RESPONSE", (error: string, address: string) => {
            console.log("enter update embeded");
            this.embedController.update({ loginInProgress: false, oauthModalVisibility: false });
            if (error) reject(new Error(error));
            else resolve([address]);
          });
        }
      }
    });
  }

  setIFrameStatus(req: JRPCRequest<{ isIFrameFullScreen: boolean }>): void {
    const { isIFrameFullScreen = false } = req.params || {};
    this.embedController.update({
      isIFrameFullScreen,
    });
  }

  logout(req: JRPCRequest<[]>, res: JRPCResponse<boolean>, _: JRPCEngineNextCallback, end: JRPCEngineEndCallback): void {
    this.emit("logout");
    this.engine?.emit("notification", {
      method: PROVIDER_NOTIFICATIONS.ACCOUNTS_CHANGED,
      params: [],
    });
    this.engine?.emit("notification", {
      method: PROVIDER_NOTIFICATIONS.UNLOCK_STATE_CHANGED,
      params: {
        accounts: [],
        isUnlocked: false,
      },
    });
    this.communicationEngine?.emit("notification", {
      method: COMMUNICATION_NOTIFICATIONS.USER_LOGGED_OUT,
    });
    res.result = true;
    end();
  }

  toggleIframeFullScreen(id?: string): void {
    const newState = !this.embedController.state.isIFrameFullScreen;
    this.communicationEngine?.emit("notification", {
      method: COMMUNICATION_NOTIFICATIONS.IFRAME_STATUS,
      params: {
        isFullScreen: newState,
        rid: id,
      },
    });
  }

  public loginFromWidgetButton(): void {
    const id = randomId();
    this.toggleIframeFullScreen(id);
    this.once(id, () => {
      this.embedController.update({
        loginInProgress: true,
        oauthModalVisibility: true,
      });
    });
    this.once("LOGIN_RESPONSE", (error: string, publicKey: string) => {
      const id2 = randomId();
      this.embedController.update({ oauthModalVisibility: false });
      setTimeout(() => {
        this.toggleIframeFullScreen(id2);
      }, 100);
      this.once(id2, () => {
        this.embedController.update({ loginInProgress: false });
      });
      if (error) {
        log.error(error);
      } else if (publicKey) {
        this.engine?.emit("notification", {
          method: PROVIDER_NOTIFICATIONS.UNLOCK_STATE_CHANGED,
          params: {
            accounts: [publicKey],
            isUnlocked: true,
          },
        });
        this.communicationEngine?.emit("notification", {
          method: COMMUNICATION_NOTIFICATIONS.USER_LOGGED_IN,
          params: { currentLoginProvider: this.getAccountPreferences(this.selectedAddress)?.userInfo.typeOfLogin || "" },
        });
      }
    });
  }

  public hideOAuthModal(): void {
    this.embedController.update({ oauthModalVisibility: false });
  }

  private initializeCommunicationProvider() {
    const commProviderHandlers: ICommunicationProviderHandlers = {
      setIFrameStatus: this.setIFrameStatus.bind(this),
      changeProvider: this.changeProvider.bind(this),
      logout: () => {
        return;
      },
      getUserInfo: () => {
        return {} as unknown as UserInfo;
      },
      getWalletInstanceId: () => {
        return "";
      },
      topup: async () => {
        return false;
      },
      handleWindowRpc: this.communicationManager.handleWindowRpc,
      getProviderState: (req, res, _, end) => {
        res.result = {
          currentLoginProvider: this.getAccountPreferences(this.selectedAddress)?.userInfo.typeOfLogin || "",
          isLoggedIn: !!this.selectedAddress,
        };
        end();
      },
    };
    this.embedController.initializeProvider(commProviderHandlers);
  }

  /**
   * Used to create a multiplexed stream for connecting to an untrusted context
   * like a Dapp or other extension.
   */
  setupUnTrustedCommunication(connectionStream: Duplex, originDomain: string): void {
    // connect features && for test cases
    const torusMux = setupMultiplex(connectionStream);
    // We create the mux so that we can handle phishing stream here
    const providerStream = torusMux.getStream("provider");
    this.setupProviderConnection(providerStream as Substream, originDomain);
  }

  /**
   * A method for serving our ethereum provider over a given stream.
   */
  setupProviderConnection(providerStream: Substream, sender: string): void {
    // break violently
    const senderUrl = new URL(sender);

    const engine = this.setupProviderEngine({ origin: senderUrl.origin });
    log.info("initializing preferences controller with hostname", sender, senderUrl.origin);

    this.preferencesController.setIframeOrigin(senderUrl.origin);
    this.engine = engine;

    // setup connection
    const engineStream = createEngineStream({ engine });

    pump(providerStream as unknown as Stream, engineStream as unknown as Stream, providerStream as unknown as Stream, (error: Error | undefined) => {
      if (error) {
        // cleanup filter polyfill middleware
        this.engine = undefined;
        log.error(error);
      }
    });
  }

  /**
   * A method for creating a provider that is safely restricted for the requesting domain.
   * */
  setupProviderEngine({ origin }: { origin: string }): JRPCEngine {
    // setup json rpc engine stack
    const engine = new JRPCEngine();
    const { _providerProxy } = this.networkController;

    // create subscription polyfill middleware
    // const subscriptionManager = createSubscriptionManager({ provider, blockTracker });
    // subscriptionManager.events.on("notification", (message) => engine.emit("notification", message));

    // metadata
    engine.push(createOriginMiddleware({ origin }));
    engine.push(createLoggerMiddleware({ origin }));

    // TODO
    // engine.push(
    //   createMethodMiddleware({
    //     origin,
    //     getProviderState: this.getProviderState.bind(this),
    //     getCurrentChainId: this.networkController.getCurrentChainId.bind(this.networkController),
    //   })
    // );

    // filter and subscription polyfills
    // engine.push(subscriptionManager.middleware);
    // forward to metamask primary provider
    engine.push(providerAsMiddleware(_providerProxy));
    return engine;
  }

  setupCommunicationChannel(connectionStream: Duplex, originDomain: string): void {
    // connect features && for test cases
    const torusMux = setupMultiplex(connectionStream);
    // We create the mux so that we can handle phishing stream here
    const providerStream = torusMux.getStream("provider");
    this.setupCommunicationProviderConnection(providerStream as Substream, originDomain);
  }

  /**
   * A method for serving our ethereum provider over a given stream.
   */
  setupCommunicationProviderConnection(providerStream: Substream, sender: string): void {
    // break violently
    const senderUrl = new URL(sender);

    const engine = this.setupCommunicationProviderEngine({ origin: senderUrl.origin });
    this.communicationEngine = engine;
    // setup connection
    const engineStream = createEngineStream({ engine });

    pump(providerStream as unknown as Stream, engineStream as unknown as Stream, providerStream as unknown as Stream, (error: Error | undefined) => {
      if (error) {
        // cleanup filter polyfill middleware
        this.communicationEngine = undefined;
        log.error(error);
      }
    });
  }

  /**
   * A method for creating a provider that is safely restricted for the requesting domain.
   * */
  setupCommunicationProviderEngine({ origin }: { origin: string }): JRPCEngine {
    const { _communicationProviderProxy } = this.embedController;
    // setup json rpc engine stack
    const engine = new JRPCEngine();
    // const { _providerProxy } = this.networkController;

    // create subscription polyfill middleware
    // const subscriptionManager = createSubscriptionManager({ provider, blockTracker });
    // subscriptionManager.events.on("notification", (message) => engine.emit("notification", message));

    // metadata
    engine.push(createOriginMiddleware({ origin }));
    engine.push(createLoggerMiddleware({ origin }));
    engine.push(providerAsMiddleware(_communicationProviderProxy));

    // TODO
    // engine.push(
    //   createMethodMiddleware({
    //     origin,
    //     getProviderState: this.getProviderState.bind(this),
    //     getCurrentChainId: this.networkController.getCurrentChainId.bind(this.networkController),
    //   })
    // );

    // filter and subscription polyfills
    // engine.push(subscriptionManager.middleware);
    // forward to metamask primary provider
    // engine.push(providerAsMiddleware(_providerProxy));
    return engine;
  }

  async changeProvider<T>(req: JRPCRequest<T>): Promise<boolean> {
    const { windowId } = req.params as unknown as ProviderConfig & { windowId: string };
    const channelName = `${BROADCAST_CHANNELS.PROVIDER_CHANGE_CHANNEL}_${windowId}`;
    const finalUrl = new URL(`${config.baseRoute}providerchange?integrity=true&instanceId=${windowId}`);
    const providerChangeWindow = new PopupWithBcHandler({
      state: {
        url: finalUrl,
        windowId,
      },
      config: {
        dappStorageKey: config.dappStorageKey || undefined,
        communicationEngine: this.communicationEngine as JRPCEngine,
        communicationWindowManager: this.communicationManager,
        target: "_blank",
      },
      instanceId: channelName,
    });
    const result = (await providerChangeWindow.handleWithHandshake({
      origin: this.preferencesController.iframeOrigin,
      network: req.params,
      currentNetwork: this.networkController.state.providerConfig.displayName,
    })) as { approve: boolean };
    const { approve = false } = result;
    if (approve) {
      this.networkController.setProviderConfig(req.params as unknown as ProviderConfig);
      return true;
    } else {
      throw new Error("user denied provider change request");
    }
  }
  async handleTransactionPopup(txId: string, req: JRPCRequest<{ message: string }> & { origin: string; windowId: string }): Promise<void> {
    try {
      const windowId = req.windowId;
      console.log(windowId);
      const channelName = `${BROADCAST_CHANNELS.TRANSACTION_CHANNEL}_${windowId}`;
      const finalUrl = new URL(`${config.baseRoute}confirm?instanceId=${windowId}&integrity=true&id=${windowId}`);
      console.log(req);
      // debugger;

      const popupPayload: any = {
        type: req.method,
        message: req.params?.message || "",
        // txParams: JSON.parse(JSON.stringify(this.txController.getTransaction(txId))),
        origin: this.preferencesController.iframeOrigin,
        balance: this.userSOLBalance,
        selectedCurrency: this.currencyController.state.currentCurrency,
        currencyRate: this.currencyController.state.conversionRate?.toString(),
        jwtToken: this.getAccountPreferences(this.selectedAddress)?.jwtToken || "",
        network: this.networkController.state.providerConfig.displayName,
        networkDetails: { providerConfig: JSON.parse(JSON.stringify(this.networkController.state.providerConfig)) },
      };
      const txApproveWindow = new PopupWithBcHandler({
        state: {
          url: finalUrl,
          windowId,
        },
        config: {
          dappStorageKey: config.dappStorageKey || undefined,
          communicationEngine: this.communicationEngine,
          communicationWindowManager: this.communicationManager,
          target: "_blank",
        },
        instanceId: channelName,
      });
      const result = (await txApproveWindow.handleWithHandshake(popupPayload)) as { approve: boolean };
      const { approve = false } = result;
      if (approve) {
        this.txController.approveTransaction(txId, this.selectedAddress); // approve and publish
      } else {
        this.txController.setTxStatusRejected(txId);
      }
    } catch (error) {
      log.error(error);
      this.txController.setTxStatusRejected(txId);
    }
  }

  public async triggerLogin({
    loginProvider,
    login_hint,
  }: {
    loginProvider: LOGIN_PROVIDER_TYPE;
    login_hint?: string;
  }): Promise<OpenLoginPopupResponse> {
    try {
      const handler = new OpenLoginHandler({
        loginProvider,
        extraLoginOptions: login_hint ? { login_hint: login_hint } : {},
      });
      const result = await handler.handleLoginWindow({
        communicationEngine: this.communicationEngine,
        communicationWindowManager: this.communicationManager,
      });
      const { privKey, userInfo } = result;
      // const address = await this.addAccount(privKey.padStart(64, "0"), userInfo);
      const address = await this.addAccount(privKey, userInfo);
      this.setSelectedAccount(address);
      this.emit("LOGIN_RESPONSE", null, address);
      return result;
    } catch (error) {
      this.emit("LOGIN_RESPONSE", (error as Error)?.message);
      log.error(error);
      throw error;
    }
  }
}

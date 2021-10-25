import { Connection, LAMPORTS_PER_SOL, Message, Transaction } from "@solana/web3.js";
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
  Ihandler,
  IProviderHandlers,
  KeyringController,
  NetworkController,
  PreferencesController,
  TokensTrackerController,
  TransactionController,
} from "@toruslabs/solana-controllers";
import BigNumber from "bignumber.js";
import { cloneDeep } from "lodash";
import log from "loglevel";
import pump from "pump";
import { Duplex } from "readable-stream";

import OpenLoginHandler from "@/auth/OpenLoginHandler";
import config from "@/config";
import { WALLET_SUPPORTED_NETWORKS } from "@/utils/const";
import {
  BUTTON_POSITION,
  OpenLoginPopupResponse,
  SignMessageChannelDataType,
  TorusControllerConfig,
  TorusControllerState,
  TransactionChannelDataType,
} from "@/utils/enums";
import { getRelaySigned } from "@/utils/helpers";

import { PKG } from "../const";
const TARGET_NETWORK = "mainnet";

export const DEFAULT_CONFIG = {
  CurrencyControllerConfig: { api: config.api, pollInterval: 600_000 },
  NetworkControllerConfig: { providerConfig: WALLET_SUPPORTED_NETWORKS[TARGET_NETWORK] },
  PreferencesControllerConfig: { pollInterval: 180_000, api: config.api, signInPrefix: "Solana Signin" },
  TransactionControllerConfig: { txHistoryLimit: 40 },
  RelayHost: {
    usdc: "https://solana-relayer.tor.us/relayer",
    local: "http://localhost:4422/relayer",
  },
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
    chainId: WALLET_SUPPORTED_NETWORKS[TARGET_NETWORK]?.chainId,
    properties: {},
    providerConfig: WALLET_SUPPORTED_NETWORKS[TARGET_NETWORK],
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
  TokensTrackerState: { tokens: undefined },
  RelayMap: {},
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
  private tokensTracker!: TokensTrackerController;
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

    this.tokensTracker = new TokensTrackerController({
      provider: this.networkController._providerProxy,
      state: this.state.TokensTrackerState,
      config: this.config.TokensTrackerConfig,
      getIdentities: () => this.preferencesController.state.identities,
      onPreferencesStateChange: (listener) => this.preferencesController.on("store", listener),
    });

    this.txController.on(TX_EVENTS.TX_UNAPPROVED, ({ txMeta, req }) => {
      log.info(req);
      this.emit(TX_EVENTS.TX_UNAPPROVED, { txMeta, req });
    });

    this.networkController._blockTrackerProxy.on("latest", () => {
      if (this.preferencesController.state.selectedAddress) {
        this.preferencesController.sync(this.preferencesController.state.selectedAddress);
      }
    });

    // ensure accountTracker updates balances after network change
    this.networkController.on("networkDidChange", () => {
      log.info("network changed");
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

    this.tokensTracker.on("store", (state) => {
      this.update({ TokensTrackerState: state });
    });

    this.keyringController.on("store", (state) => {
      this.update({ KeyringControllerState: state });
    });

    this.txController.on("store", (state: TransactionState<Transaction>) => {
      this.update({ TransactionControllerState: state });
    });

    this.embedController.on("store", (state) => {
      this.update({ EmbedControllerState: state });
    });

    this.updateRelayMap();
  }

  updateRelayMap = async (): Promise<void> => {
    // for (const k in this.config.RelayHost) {
    //   keyfetch.push(fetch(`${this.config.RelayHost[k]}/publickey`)) ;
    // }
    // const relaykey = this.config.RelayHost(element => {
    // });
    const res = await fetch(`${this.config.RelayHost["usdc"]}/public_key`);
    const res_json = await res.json();
    this.update({
      RelayMap: {
        ...this.state.RelayMap,
        ["usdc"]: res_json.key,
      },
    });
    log.info(res_json.key);
    // get all relay public address map
    // this.update({
    //   relayMap: {
    //     usdc: "",
    //   },
    // });
  };

  get origin(): string {
    return this.preferencesController.iframeOrigin;
  }

  setOrigin(origin: string): void {
    this.preferencesController.setIframeOrigin(origin);
  }

  get userSOLBalance(): string {
    const balance = this.accountTracker.state.accounts[this.selectedAddress]?.balance || "0x0";
    const value = new BigNumber(balance).div(new BigNumber(LAMPORTS_PER_SOL));
    return value.toString();
  }

  async calculateTxFee(): Promise<{ b_hash: string; fee: number }> {
    const conn = new Connection(this.state.NetworkControllerState.providerConfig.rpcTarget);
    const b_hash = (await conn.getRecentBlockhash("finalized")).blockhash;
    const fee = (await conn.getFeeCalculatorForBlockhash(b_hash)).value?.lamportsPerSignature || 0;
    return { b_hash, fee };
  }

  private initializeProvider() {
    const providerHandlers: IProviderHandlers = {
      version: PKG.version,
      requestAccounts: async (req) => {
        const accounts = await this.requestAccounts(req);
        this.engine?.emit("notification", {
          method: PROVIDER_NOTIFICATIONS.UNLOCK_STATE_CHANGED,
          params: {
            accounts: accounts,
            isUnlocked: accounts.length > 0,
          },
        });
        this.communicationEngine?.emit("notification", {
          method: COMMUNICATION_NOTIFICATIONS.USER_LOGGED_IN,
          params: { currentLoginProvider: this.getAccountPreferences(this.selectedAddress)?.userInfo.typeOfLogin || "" },
        });
        return accounts;
      },

      // Expose no accounts if this origin has not been approved, preventing
      // account-requiring RPC methods from completing successfully
      // only show address if account is unlocked
      getAccounts: async () => (this.preferencesController.state.selectedAddress ? [this.preferencesController.state.selectedAddress] : []),
      signMessage: async (
        req: JRPCRequest<{
          data: Uint8Array;
          display: string;
          message?: string;
        }> & {
          origin?: string | undefined;
          windowId?: string | undefined;
        }
      ) => {
        if (!this.selectedAddress) throw new Error("Not logged in");
        const approve = await this.handleSignMessagePopup(req);
        if (approve) {
          // const msg = Buffer.from(req.params?.message || "", "hex");
          const data = req.params?.data as Uint8Array;
          const signed_message = this.keyringController.signMessage(data, this.selectedAddress);
          return signed_message;
        } else throw new Error("User Rejected");
      },
      signTransaction: async (req) => {
        if (!this.selectedAddress) throw new Error("Not logged in");
        const message = req.params?.message;
        if (!message) throw new Error("empty error message");

        const data = Buffer.from(message, "hex");
        const tx = Transaction.populate(Message.from(data));
        const ret_signed = await this.txController.addSignTransaction(tx, req);
        const result = await ret_signed.result;
        let signed_tx = ret_signed.transactionMeta.transaction.serialize({ requireAllSignatures: false }).toString("hex");
        const gaslessHost = this.getGaslessHost(tx.feePayer?.toBase58() || "");
        console.log(gaslessHost);
        if (gaslessHost) {
          signed_tx = await getRelaySigned(gaslessHost, signed_tx, tx.recentBlockhash || "");
        }
        log.info(result);
        return signed_tx;
      },
      signAllTransactions: async (req) => {
        if (!this.selectedAddress) throw new Error("Not logged in");
        log.info(req.method);
        return {} as unknown;
      },
      sendTransaction: async (req) => {
        if (!this.selectedAddress) throw new Error("Not logged in");
        const message = req.params?.message;
        if (!message) throw new Error("empty error message");
        const data = Buffer.from(message, "hex");
        const tx = Transaction.populate(Message.from(data), []);
        const resp = this.transfer(tx, req);
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
      getGaslessPublicKey: async (req) => {
        if (!req.params) throw new Error("Invalid Relay");
        const relayPublicKey = this.state.RelayMap[req.params.relay];
        if (!relayPublicKey) throw new Error("Invalid Relay");
        return relayPublicKey;
      },
    };
    const providerProxy = this.networkController.initializeProvider(providerHandlers);
    return providerProxy;
  }

  async approveSignTransaction(txId: string): Promise<void> {
    await this.txController.approveSignTransaction(txId, this.state.PreferencesControllerState.selectedAddress);
  }
  async approveTransaction(txId: string): Promise<void> {
    await this.txController.approveTransaction(txId, this.state.PreferencesControllerState.selectedAddress);
  }

  async transfer(tx: Transaction, req?: Ihandler<{ message: string }>): Promise<string> {
    const conn = new Connection(this.networkController.state.providerConfig.rpcTarget);
    const ret_signed = await this.txController.addSignTransaction(tx, req);
    await ret_signed.result;
    let signed_tx = ret_signed.transactionMeta.transaction.serialize({ requireAllSignatures: false }).toString("hex");
    const gaslessHost = this.getGaslessHost(tx.feePayer?.toBase58() || "");
    if (gaslessHost) {
      signed_tx = await getRelaySigned(gaslessHost, signed_tx, tx.recentBlockhash || "");
    }
    const signature = await conn.sendRawTransaction(Buffer.from(signed_tx, "hex"));
    ret_signed.transactionMeta.transactionHash = signature;
    this.txController.setTxStatusSubmitted(ret_signed.transactionMeta.id);
    return signature;
  }

  getGaslessHost(feePayer: string): string | undefined {
    if (!feePayer) return "";
    if (feePayer !== this.selectedAddress) {
      // TODO : to fix, check if feepayer in relayMap
      // use feepayer address get the key of the relay
      // then get the relay Host url
      const relayHost = this.config.RelayHost["usdc"];
      if (relayHost) {
        return `${relayHost}/partial_sign`;
      } else {
        throw new Error("Invalid Relay");
      }
    } else {
      return undefined;
    }
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
      log.info(currentLoginProvider);
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
            log.info("enter update embeded");
            this.embedController.update({ loginInProgress: false, oauthModalVisibility: false });
            if (error) reject(new Error(error));
            else resolve([address]);
          });
        }
      }
    });
  }

  setIFrameStatus(req: JRPCRequest<{ isIFrameFullScreen: boolean; rid?: string }>): void {
    const { isIFrameFullScreen = false, rid } = req.params || {};
    this.embedController.update({
      isIFrameFullScreen,
    });

    if (rid) this.emit(rid);
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
      logout: this.logout.bind(this),
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
      log.info(windowId);
      const channelName = `${BROADCAST_CHANNELS.TRANSACTION_CHANNEL}_${windowId}`;
      const finalUrl = new URL(`${config.baseRoute}confirm?instanceId=${windowId}&integrity=true&id=${windowId}`);
      log.info(req);
      // debugger;

      const popupPayload: TransactionChannelDataType = {
        type: req.method,
        message: req.params?.message || "",
        signer: this.selectedAddress,
        // txParams: JSON.parse(JSON.stringify(this.txController.getTransaction(txId))),
        origin: this.preferencesController.iframeOrigin,
        balance: this.userSOLBalance,
        selectedCurrency: this.currencyController.state.currentCurrency,
        currencyRate: this.currencyController.state.conversionRate?.toString(),
        jwtToken: this.getAccountPreferences(this.selectedAddress)?.jwtToken || "",
        network: this.networkController.state.providerConfig.displayName,
        networkDetails: JSON.parse(JSON.stringify(this.networkController.state.providerConfig)),
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
        this.approveSignTransaction(txId);
      } else {
        this.txController.setTxStatusRejected(txId);
      }
    } catch (error) {
      log.error(error);
      this.txController.setTxStatusRejected(txId);
    }
  }
  async handleSignMessagePopup(
    req: JRPCRequest<{ data: Uint8Array; display?: string; message?: string }> & { origin?: string; windowId?: string }
  ): Promise<boolean> {
    try {
      const windowId = req.windowId;
      log.info(windowId);
      const channelName = `${BROADCAST_CHANNELS.TRANSACTION_CHANNEL}_${windowId}`;
      const finalUrl = new URL(`${config.baseRoute}confirm_message?instanceId=${windowId}&integrity=true&id=${windowId}`);
      log.info(req);
      // debugger;

      const popupPayload: SignMessageChannelDataType = {
        type: req.method,
        data: req.params?.data,
        display: req.params?.display,
        message: Buffer.from(req.params?.data || []).toString(),
        signer: this.selectedAddress,
        // txParams: JSON.parse(JSON.stringify(this.txController.getTransaction(txId))),
        origin: this.preferencesController.iframeOrigin,
        balance: this.userSOLBalance,
        selectedCurrency: this.currencyController.state.currentCurrency,
        currencyRate: this.currencyController.state.conversionRate?.toString(),
        jwtToken: this.getAccountPreferences(this.selectedAddress)?.jwtToken || "",
        network: this.networkController.state.providerConfig.displayName,
        networkDetails: JSON.parse(JSON.stringify(this.networkController.state.providerConfig)),
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
        return true;
      }
      return false;
    } catch (error) {
      log.error(error);
      return false;
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

  async setDefaultCurrency(currency: string): Promise<void> {
    const { ticker } = this.networkController.getProviderConfig();
    this.currencyController.setNativeCurrency(ticker);
    this.currencyController.setCurrentCurrency(currency);
    await this.currencyController.updateConversionRate();
    // TODO uncomment below to make the selected currency persistent in future sessions.
    // return this.preferencesController.setSelectedCurrency({ selectedCurrency: currency });
  }
}

import { Connection, Message, Transaction } from "@solana/web3.js";
import {
  BaseController,
  createLoggerMiddleware,
  createOriginMiddleware,
  providerAsMiddleware,
  ProviderConfig,
  // SafeEventEmitterProvider,
  TX_EVENTS,
} from "@toruslabs/base-controllers";
import { getED25519Key } from "@toruslabs/openlogin-ed25519";
import { createEngineStream, JRPCEngine, JRPCRequest, Substream } from "@toruslabs/openlogin-jrpc";
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
import bs58 from "bs58";
// import { GetDeployResult } from "casper-js-sdk";
import log from "loglevel";

import config from "@/config";
import { TorusControllerConfig, TorusControllerState } from "@/utils/enums";

// import { debounce, DebouncedFunc } from "lodash";
import { PKG } from "../const";
const TARGET_NETWORK = "testnet";

export const DEFAULT_CONFIG = {
  CurrencyControllerConfig: { api: config.api, pollInterval: 600_000 },
  NetworkControllerConfig: { providerConfig: SUPPORTED_NETWORKS[TARGET_NETWORK] },
  PreferencesControllerConfig: { pollInterval: 180_000, api: config.api, signInPrefix: "Solana Signin" },
  TransactionControllerConfig: { txHistoryLimit: 40 },
};
console.log(SUPPORTED_NETWORKS);
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
};

export default class TorusController extends BaseController<TorusControllerConfig, TorusControllerState> {
  private networkController!: NetworkController;
  private currencyController!: CurrencyController;
  private accountTracker!: AccountTrackerController;
  private keyringController!: KeyringController;
  private prefsController!: PreferencesController;
  private txController!: TransactionController;

  private engine?: JRPCEngine;

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

    this.prefsController = new PreferencesController({
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
      getIdentities: () => this.prefsController.state.identities,
      onPreferencesStateChange: (listener) => this.prefsController.on("store", listener),
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

    this.txController.on(TX_EVENTS.TX_UNAPPROVED, (txMeta) => {
      this.emit(TX_EVENTS.TX_UNAPPROVED, txMeta);
    });

    this.networkController._blockTrackerProxy.on("latest", () => {
      this.prefsController.sync(this.prefsController.state.selectedAddress);
    });

    // ensure accountTracker updates balances after network change
    this.networkController.on("networkDidChange", () => {
      console.log("network changed");
      this.prefsController.sync(this.prefsController.state.selectedAddress);
    });

    this.networkController.lookupNetwork();

    // Listen to controller changes
    this.prefsController.on("store", (state) => {
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

  private initializeProvider() {
    const providerHandlers: IProviderHandlers = {
      version: PKG.version,
      // account mgmt
      // TODO: once embed structure is defined
      requestAccounts: async () => (this.prefsController.state.selectedAddress ? [this.prefsController.state.selectedAddress] : []),

      getAccounts: async () =>
        // Expose no accounts if this origin has not been approved, preventing
        // account-requiring RPC methods from completing successfully
        // only show address if account is unlocked
        this.prefsController.state.selectedAddress ? [this.prefsController.state.selectedAddress] : [],
      // tx signing
      processDeploy: async () => {
        return { deploy_hash: "" };
      }, // todo: add handler for tx processing
      getPendingDeployByHash: async () => {
        return {} as unknown;
        // as GetDeployResult;
      },
      signMessage: async (req) => {
        console.log(req.method);
        return {} as unknown;
      },
      signTransaction: async (req) => {
        const data = bs58.decode(req.params?.message || "");
        const msg = Message.from(data);
        const tx = Transaction.populate(msg);
        return await this.addSignTransaction(tx, req.origin);
      },
      signAllTransactions: async (req) => {
        console.log(req.method);
        return {} as unknown;
      },
      sendTransaction: async (req) => {
        const data = bs58.decode(req.params?.message || "");
        const msg = Message.from(data);
        const tx = Transaction.populate(msg);
        return await this.transfer(tx, req.origin);
      },
    };
    const providerProxy = this.networkController.initializeProvider(providerHandlers);
    return providerProxy;
  }

  async approveSignTransaction(txId: string): Promise<void> {
    await this.txController.approveSignTransaction(txId, this.state.PreferencesControllerState.selectedAddress);
    return;
  }
  async approveTransaction(txId: string): Promise<void> {
    await this.txController.approveTransaction(txId, this.state.PreferencesControllerState.selectedAddress);
    return;
  }

  async addSignTransaction(txParams: Transaction, origin?: string): Promise<{ signature: string }> {
    const txRes = await this.txController.addSignTransaction(txParams, origin);
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
  async transfer(tx: Transaction, origin?: string): Promise<string> {
    // ControllersModule.torus.signTransaction(tf);
    try {
      const res = await this.txController.addTransaction(tx, origin);
      const resp = await res.result;
      console.log(resp);
      return resp;
    } catch (e) {
      console.log(e);
      return "none";
    }
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

  async addAccount(privKey: string): Promise<string> {
    const address = this.keyringController.importAccount(privKey);

    await this.prefsController.sync(address);
    this.prefsController.setSelectedAddress(address);
    return address;
  }

  setSelectedAccount(address: string): void {
    this.prefsController.setSelectedAddress(address);
    this.prefsController.sync(address);
  }

  /**
   * Used to create a multiplexed stream for connecting to an untrusted context
   * like a Dapp or other extension.
   */
  setupUntrustedCommunication(connectionStream: Substream, originDomain: string): void {
    // connect features && for test cases
    this.setupProviderConnection(connectionStream, originDomain);
  }

  /**
   * A method for serving our ethereum provider over a given stream.
   */
  setupProviderConnection(outStream: Substream, sender: string): void {
    // break violently
    const senderUrl = new URL(sender);

    const engine = this.setupProviderEngine({ origin: senderUrl.hostname });
    this.engine = engine;

    // setup connection
    const providerStream = createEngineStream({ engine });

    outStream
      .pipe(providerStream)
      .pipe(outStream)
      .on("error", (error: Error) => {
        // cleanup filter polyfill middleware
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        engine._middleware.forEach((mid) => {
          if (mid.destroy && typeof mid.destroy === "function") {
            mid.destroy();
          }
        });
        this.engine = undefined;
        if (error) log.error(error);
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
    return this.prefsController && this.prefsController.getAddressState(address);
  }

  signTransaction(transaction: Transaction): Transaction {
    return this.keyringController.signTransaction(transaction, this.state.PreferencesControllerState.selectedAddress);
  }

  // signAllTransaction( transactions : Transaction[]) :Transaction[] {
  //   return this.keyringController.signTransaction(transactions, this.state.PreferencesControllerState.selectedAddress);
  // }
}

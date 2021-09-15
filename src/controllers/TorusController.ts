import {
  AccountTrackerConfig,
  AccountTrackerState,
  BaseConfig,
  BaseController,
  BaseCurrencyControllerConfig,
  BaseCurrencyControllerState,
  BaseState,
  KeyringControllerState,
  NetworkConfig,
  NetworkState,
  PreferencesConfig,
  PreferencesState,
  // SafeEventEmitterProvider,
} from "@toruslabs/base-controllers";
import {
  AccountTrackerController,
  CasperBlock,
  CurrencyController,
  IProviderHandlers,
  KeyringController,
  NetworkController,
  PreferencesController,
} from "@toruslabs/casper-controllers";
import { JRPCEngine } from "@toruslabs/openlogin-jrpc";
import { GetDeployResult } from "casper-js-sdk";

// import { debounce, DebouncedFunc } from "lodash";
import { version } from "../../package.json";

interface TorusControllerState extends BaseState {
  NetworkControllerState: NetworkState;
  CurrencyControllerState: BaseCurrencyControllerState;
  PreferencesControllerState: PreferencesState;
  AccountTrackerState: AccountTrackerState;
  KeyringControllerState: KeyringControllerState;
}

interface TorusControllerConfig extends BaseConfig {
  NetworkControllerConfig: NetworkConfig;
  CurrencyControllerConfig: BaseCurrencyControllerConfig;
  PreferencesControllerConfig: PreferencesConfig;
  AccountTrackerConfig: AccountTrackerConfig<CasperBlock>;
  KeyringControllerConfig: BaseConfig;
}
export class TorusController extends BaseController<TorusControllerConfig, TorusControllerState> {
  private networkController: NetworkController;
  private activeControllerConnections: number;
  private currencyController: CurrencyController;
  private accountTracker: AccountTrackerController;
  private keyringController: KeyringController;
  private prefsController: PreferencesController;
  private engine?: JRPCEngine;

  //   private sendUpdate: DebouncedFunc<() => void>;

  constructor({ config, state }: { config: Partial<TorusControllerConfig>; state: Partial<TorusControllerState> }) {
    super({ config, state });
    // this.sendUpdate = debounce(this.privateSendUpdate.bind(this), 200);
    this.initialize();
    this.networkController = new NetworkController({ config: this.config.NetworkControllerConfig, state: this.state.NetworkControllerState });

    // this keeps track of how many "controllerStream" connections are open
    // the only thing that uses controller connections are open metamask UI instances
    this.activeControllerConnections = 0;

    this.initializeProvider();

    this.currencyController = new CurrencyController({
      config: this.config.CurrencyControllerConfig,
      state: this.state.CurrencyControllerState,
    });
    this.currencyController.updateConversionRate();
    // todo: add currency rate polling in currency controller.
    // this.currencyController.scheduleConversionInterval();

    // key mgmt
    this.keyringController = new KeyringController({
      config: this.config.KeyringControllerConfig,
      state: this.state.KeyringControllerState,
    });

    this.prefsController = new PreferencesController({
      state: this.state.PreferencesControllerState,
      config: this.config.PreferencesControllerConfig,
    });

    this.accountTracker = new AccountTrackerController({
      provider: this.networkController._providerProxy,
      state: this.state.AccountTrackerState,
      config: this.config.AccountTrackerConfig,
      blockTracker: this.networkController._blockTrackerProxy,
      getIdentities: () => this.prefsController.state.identities,
      onPreferencesStateChange: (listener) => this.prefsController.subscribe(listener),
      onNetworkChange: (listener) => this.networkController.subscribe(listener),
    });

    // ensure accountTracker updates balances after network change
    this.networkController.subscribeEvent("networkDidChange", () => {
      this.accountTracker.refresh();
    });

    this.networkController.lookupNetwork();

    this.update({
      PreferencesControllerState: this.prefsController.state,
      CurrencyControllerState: this.currencyController.state,
      NetworkControllerState: this.networkController.state,
      AccountTrackerState: this.accountTracker.state,
    });

    // ensure isClientOpenAndUnlocked is updated when memState updates
    // this.subscribeEvent("update", (torusControllerState: unknown) => this._onStateUpdate(torusControllerState));

    // this.subscribe(this.sendUpdate.bind(this));

    // if (typeof options.rehydrate === "function") {
    //   setTimeout(() => {
    //     options.rehydrate();
    //   }, 50);
    // }
  }

  private initializeProvider() {
    const providerOptions: IProviderHandlers = {
      version,
      // account mgmt
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
        return {} as unknown as GetDeployResult;
      },
    };
    const providerProxy = this.networkController.initializeProvider(providerOptions);
    return providerProxy;
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
}

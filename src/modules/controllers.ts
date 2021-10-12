import { DEFAULT_PREFERENCES, TX_EVENTS } from "@toruslabs/base-controllers";
import { LOGIN_PROVIDER_TYPE, OpenloginUserInfo } from "@toruslabs/openlogin";
import { PostMessageStream } from "@toruslabs/openlogin-jrpc";
import { CHAIN_ID_NETWORK_MAP, ExtendedAddressPreferences, NetworkController, SUPPORTED_NETWORKS } from "@toruslabs/solana-controllers";
import { SolanaTransactionActivity } from "@toruslabs/solana-controllers/types/src/Transaction/ITransaction";
import BigNumber from "bignumber.js";
import { cloneDeep, merge, omit } from "lodash";
import log from "loglevel";
import { Action, getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";

import OpenLoginHandler from "@/auth/OpenLoginHandler";
import config from "@/config";
import TorusController, { DEFAULT_CONFIG, DEFAULT_STATE } from "@/controllers/TorusController";
import installStorePlugin from "@/plugins/persistPlugin";
import { CONTROLLER_MODULE_KEY, DEFAULT_USER_INFO, LOCAL_STORAGE_KEY, SESSION_STORAGE_KEY, TorusControllerState } from "@/utils/enums";
import { isMain } from "@/utils/helpers";

import store from "../store";

@Module({
  name: CONTROLLER_MODULE_KEY,
  namespaced: true,
  dynamic: true,
  store,
})
class ControllerModule extends VuexModule {
  public torus = new TorusController({ config: DEFAULT_CONFIG, state: DEFAULT_STATE });

  public torusState: TorusControllerState = cloneDeep(DEFAULT_STATE);

  @Mutation
  public updateTorusState(state: TorusControllerState): void {
    this.torusState = { ...state };
  }

  @Mutation
  public resetTorusController(): void {
    this.torus = new TorusController({ config: DEFAULT_CONFIG, state: DEFAULT_STATE });
  }

  get userBalance(): string {
    const pricePerToken = this.torusState.CurrencyControllerState.conversionRate;
    // console.log(this.torusState.AccountTrackerState.accounts);
    // console.log(this.torusState.PreferencesControllerState.identities);
    const balance = this.torusState.AccountTrackerState.accounts[this.torusState.PreferencesControllerState.selectedAddress]?.balance || "0x0";
    const value = new BigNumber(balance).div(new BigNumber(10 ** 9)).times(new BigNumber(pricePerToken));
    return value.toFixed(2).toString();
  }

  /**
   * Call once on refresh
   */
  @Action
  public init(state?: Partial<TorusControllerState>): void {
    this.torus.init({ config: DEFAULT_CONFIG, state: merge(this.torusState, state) });
    this.torus.on("store", (state: TorusControllerState) => {
      this.updateTorusState(state);
    });
    // this.torus.setupUntrustedCommunication();
    // Good
    this.torus.on(TX_EVENTS.TX_UNAPPROVED, (txMeta, sign) => {
      if (isMain) {
        console.log("approve sign");
        if (sign) {
          this.torus.approveSignTransaction(txMeta.id);
        } else {
          this.torus.approveTransaction(txMeta.id);
        }
      } else {
        console.log("FIXME :auto approve for now sign");
        if (sign) {
          this.torus.approveSignTransaction(txMeta.id);
        } else {
          this.torus.approveTransaction(txMeta.id);
        }
      }
    });
  }

  @Action
  public setupCommunication(origin: string): void {
    log.info("setting up communication with", origin);
    const torusStream = new PostMessageStream({
      name: "iframe_torus",
      target: "embed_torus",
      targetWindow: window.parent,
    });

    const communicationStream = new PostMessageStream({
      name: "iframe_communication",
      target: "embed_communication",
      targetWindow: window.parent,
    });
    this.torus.setupUnTrustedCommunication(torusStream, origin);
    this.torus.setupCommunicationChannel(communicationStream, origin);
  }

  @Action
  async triggerLogin({ loginProvider, login_hint }: { loginProvider: LOGIN_PROVIDER_TYPE; login_hint?: string }): Promise<void> {
    await this.torus.triggerLogin({ loginProvider, login_hint });
  }

  @Action
  logout(): void {
    // this.update(DEFAULT_USER_INFO);
    this.updateTorusState(cloneDeep(DEFAULT_STATE));
    this.resetTorusController();
  }

  @Action
  setNetwork(chainId: string): void {
    const providerConfig = Object.values(SUPPORTED_NETWORKS).find((x) => x.chainId === chainId);
    if (!providerConfig) throw new Error(`Unsupported network: ${chainId}`);
    this.torus.setNetwork(providerConfig);
  }

  get network(): string {
    return "testnet";
  }

  isDarkMode(): boolean {
    return this.selectedAccountPreferences.theme === "dark";
  }

  selectedNetworkDisplayName(): string {
    const network = this.torusState.NetworkControllerState.providerConfig.displayName;
    return network;
  }

  get selectedAddress(): string {
    return this.torusState.PreferencesControllerState?.selectedAddress || "";
  }

  get selectedAccountPreferences(): ExtendedAddressPreferences {
    const preferences = this.torus.getAccountPreferences(this.selectedAddress);
    return (
      preferences || {
        ...DEFAULT_PREFERENCES,
        formattedPastTransactions: [],
        fetchedPastTx: [],
        currentNetworkTxsList: [],
        network_selected: "testnet",
      }
    );
  }
  get selectedNetworkTransactions(): SolanaTransactionActivity[] {
    const txns = this.selectedAccountPreferences.currentNetworkTxsList;
    return txns ? txns : [];
  }
}

const module = getModule(ControllerModule);

installStorePlugin({
  key: CONTROLLER_MODULE_KEY,
  storage: config.dappStorageKey ? LOCAL_STORAGE_KEY : SESSION_STORAGE_KEY,
  saveState: (key: string, state: Record<string, unknown>, storage?: Storage) => {
    const requiredState = omit(state, [`${CONTROLLER_MODULE_KEY}.torus`]);
    storage?.setItem(key, JSON.stringify(requiredState));
  },
  restoreState: (key: string, storage?: Storage) => {
    const value = storage?.getItem(key);
    if (typeof value === "string") {
      // If string, parse, or else, just return
      const parsedValue = JSON.parse(value || "{}");
      return {
        [CONTROLLER_MODULE_KEY]: {
          torus: new TorusController({ config: DEFAULT_CONFIG, state: DEFAULT_STATE }),
          ...(parsedValue[CONTROLLER_MODULE_KEY] || {}),
        },
      };
    } else {
      return value || {};
    }
  },
});

export default module;

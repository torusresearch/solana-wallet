/* eslint-disable class-methods-use-this */
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  AccountImportedChannelData,
  BasePopupChannelData,
  BillboardEvent,
  BROADCAST_CHANNELS,
  BROADCAST_CHANNELS_MSGS,
  broadcastChannelOptions,
  Contact,
  ContactPayload,
  DEFAULT_PREFERENCES,
  NetworkChangeChannelData,
  PopupData,
  PopupStoreChannel,
  ProviderConfig,
  SelectedAddresssChangeChannelData,
  THEME,
  TX_EVENTS,
} from "@toruslabs/base-controllers";
import { LOGIN_PROVIDER_TYPE, storageAvailable } from "@toruslabs/openlogin";
import { BasePostMessageStream } from "@toruslabs/openlogin-jrpc";
import { randomId } from "@toruslabs/openlogin-utils";
import { ExtendedAddressPreferences, SolanaToken, SolanaTransactionActivity } from "@toruslabs/solana-controllers";
import { BigNumber } from "bignumber.js";
import { BroadcastChannel } from "broadcast-channel";
import { cloneDeep, merge, omit } from "lodash-es";
import log from "loglevel";
import { Action, getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";

import config from "@/config";
import TorusController, { DEFAULT_CONFIG, DEFAULT_STATE } from "@/controllers/TorusController";
import installStorePlugin from "@/plugins/persistPlugin";
import { WALLET_SUPPORTED_NETWORKS } from "@/utils/const";
import { CONTROLLER_MODULE_KEY, LOCAL_STORAGE_KEY, SESSION_STORAGE_KEY, TorusControllerState } from "@/utils/enums";
import { isMain } from "@/utils/helpers";
import { NAVBAR_MESSAGES } from "@/utils/messages";

import store from "../store";
import { addToast } from "./app";

@Module({
  name: CONTROLLER_MODULE_KEY,
  namespaced: true,
  dynamic: true,
  store,
})
class ControllerModule extends VuexModule {
  public torus = new TorusController({ _config: DEFAULT_CONFIG, _state: DEFAULT_STATE });

  public torusState: TorusControllerState = cloneDeep(DEFAULT_STATE);

  public instanceId = "";

  get selectedAddress(): string {
    return this.torusState.PreferencesControllerState?.selectedAddress || "";
  }

  get selectedAccountPreferences(): ExtendedAddressPreferences {
    const preferences = this.torus.getAccountPreferences(this.selectedAddress);
    return (
      preferences || {
        ...DEFAULT_PREFERENCES,
        incomingBackendTransactions: [],
        displayActivities: {},
        network_selected: "testnet",
        theme: "dark",
      }
    );
  }

  get crashReport(): boolean {
    return this.selectedAccountPreferences.crashReport || false;
  }

  get selectedNetworkTransactions(): SolanaTransactionActivity[] {
    const txns = Object.values(this.selectedAccountPreferences.displayActivities || {});
    return txns.map((item) => {
      if (item.mintAddress) {
        if (item.decimal === 0) {
          const nftInfo = this.torusState.TokenInfoState.metaplexMetaMap[item.mintAddress];
          if (nftInfo) {
            return { ...item, logoURI: nftInfo.offChainMetaData?.image, cryptoCurrency: nftInfo.symbol };
          }
        } else {
          const tokenInfo = this.torusState.TokenInfoState.tokenInfoMap[item.mintAddress];
          if (tokenInfo) {
            return { ...item, logoURI: tokenInfo.logoURI, cryptoCurrency: tokenInfo.symbol };
          }
        }
      }
      return item;
    });
  }

  get solBalance(): BigNumber {
    const lamports = new BigNumber(
      this.torusState.AccountTrackerState.accounts[this.torusState.PreferencesControllerState.selectedAddress]?.balance || 0
    );
    return lamports.div(LAMPORTS_PER_SOL);
  }

  get userBalance(): string {
    const pricePerToken = this.torusState.CurrencyControllerState.conversionRate;
    const selectedCurrency = this.torusState.CurrencyControllerState.currentCurrency;
    const value = this.solBalance.times(new BigNumber(pricePerToken));
    return value.toFixed(selectedCurrency.toLowerCase() === "sol" ? 4 : 2).toString(); // SOL should be 4 decimal places
  }

  // get selectedBalance(): string {}

  get selectedNetworkDisplayName(): string {
    return this.torusState.NetworkControllerState.providerConfig.displayName;
  }

  get contacts(): Contact[] {
    return [...this.selectedAccountPreferences.contacts];
  }

  get isDarkMode(): boolean {
    return this.selectedAccountPreferences.theme === "dark";
  }

  get userTokens(): SolanaToken[] {
    return this.torus.state.TokensTrackerState.tokens ? this.torus.state.TokensTrackerState.tokens[this.selectedAddress] : [];
  }

  get nonFungibleTokens(): SolanaToken[] {
    const nfts =
      this.userTokens.filter((v) => {
        if (!(v.balance?.decimals === 0) || !(v.balance.uiAmount > 0)) return false;
        // fetching in progress, return false unless it got metadata
        if (this.torusState.TokenInfoState.fetchedMetaInfo.loading && !this.torusState.TokenInfoState.metaplexMetaMap[v.mintAddress]) {
          return false;
        }
        return true;
      }) || [];
    return nfts
      .map((item) => {
        return {
          ...item,
          // put a default nft data if the metaplex data is still undefined (fetchind is done / error)
          metaplexData: this.torusState.TokenInfoState.metaplexMetaMap[item.mintAddress] || this.torus.config.TokensInfoConfig.defaultUnknownNFT, // {} Default unknown metadata
        };
      })
      .sort((a, b) => a.tokenAddress.localeCompare(b.tokenAddress));
  }

  get didFetchNFTs(): boolean {
    return this.torusState.TokenInfoState.fetchedMetaInfo.loaded;
  }

  get didFetchFungibleTokenData(): boolean {
    return this.torusState.TokenInfoState.fetchedPriceInfo.loaded && this.torusState.TokenInfoState.fetchedTokenInfo.loaded;
  }

  get fungibleTokens(): SolanaToken[] {
    const tokens = this.userTokens.filter((v) => v.balance?.decimals !== 0);
    // only show recognized tokens
    return tokens
      .filter(
        (item) => this.torusState.TokenInfoState.tokenInfoMap[item.mintAddress] && this.torusState.TokenInfoState.tokenPriceMap[item.mintAddress]
      )
      .map((item) => {
        return {
          ...item,
          data: this.torusState.TokenInfoState.tokenInfoMap[item.mintAddress],
          price: this.torusState.TokenInfoState.tokenPriceMap[item.mintAddress] || {},
        };
      });
  }

  @Mutation
  public setInstanceId(instanceId: string) {
    this.instanceId = instanceId;
  }

  @Mutation
  public updateTorusState(state: TorusControllerState): void {
    this.torusState = { ...state };
  }

  @Mutation
  public resetTorusController(): void {
    this.torus = new TorusController({ _config: DEFAULT_CONFIG, _state: DEFAULT_STATE });
  }

  @Action
  handleError(error: string): void {
    addToast({ type: "error", message: error });
  }

  @Action
  handleSuccess(message: string): void {
    addToast({ type: "success", message: message || "" });
  }

  @Action
  public async setCrashReport(status: boolean): Promise<void> {
    const isSet = await this.torus.setCrashReport(status);
    if (isSet) {
      if (storageAvailable("localStorage")) {
        localStorage.setItem("torus-enable-crash-reporter", String(status));
      }
      this.handleSuccess(NAVBAR_MESSAGES.success.CRASH_REPORT_SUCCESS);
    } else {
      this.handleError(NAVBAR_MESSAGES.error.CRASH_REPORT_FAILED);
    }
  }

  @Action
  public async addContact(contactPayload: ContactPayload): Promise<void> {
    const isDeleted = await this.torus.addContact(contactPayload);
    if (isDeleted) {
      this.handleSuccess(NAVBAR_MESSAGES.success.ADD_CONTACT_SUCCESS);
    } else {
      this.handleError(NAVBAR_MESSAGES.error.ADD_CONTACT_FAILED);
    }
  }

  @Action
  public async deleteContact(contactId: number): Promise<void> {
    const isDeleted = await this.torus.deleteContact(contactId);
    if (isDeleted) {
      this.handleSuccess(NAVBAR_MESSAGES.success.DELETE_CONTACT_SUCCESS);
    } else {
      this.handleError(NAVBAR_MESSAGES.error.DELETE_CONTACT_FAILED);
    }
  }

  @Action
  public async setTheme(theme: THEME): Promise<void> {
    await this.torus.setTheme(theme);
  }

  @Action
  public async setCurrency(currency: string): Promise<void> {
    const isSet = await this.torus.setDefaultCurrency(currency);
    if (isSet) {
      this.handleSuccess(NAVBAR_MESSAGES.success.SET_CURRENCY_SUCCESS);
    } else {
      this.handleError(NAVBAR_MESSAGES.error.SET_CURRENCY_FAILED);
    }
  }

  @Action
  public async setLocale(locale: string): Promise<void> {
    const isSet = await this.torus.setLocale(locale);
    if (isSet) {
      this.handleSuccess(NAVBAR_MESSAGES.success.SET_LOCALE_SUCCESS);
    } else {
      this.handleError(NAVBAR_MESSAGES.error.SET_LOCALE_FAILED);
    }
  }

  @Action
  public async getBillBoardData(): Promise<BillboardEvent[]> {
    return this.torus.getBillboardData();
  }

  @Action
  public toggleIframeFullScreen(): void {
    this.torus.toggleIframeFullScreen();
  }

  @Action
  public closeIframeFullScreen(): void {
    this.torus.closeIframeFullScreen();
  }

  /**
   * Call once on refresh
   */
  @Action
  public init({ state, origin }: { state?: Partial<TorusControllerState>; origin: string }): void {
    this.torus.init({ _config: DEFAULT_CONFIG, _state: merge(this.torusState, state) });
    this.torus.setOrigin(origin);
    this.torus.on("store", (_state: TorusControllerState) => {
      this.updateTorusState(_state);
    });
    // this.torus.setupUntrustedCommunication();
    // Good
    this.torus.on(TX_EVENTS.TX_UNAPPROVED, async ({ txMeta, req }) => {
      if (isMain) {
        this.torus.approveSignTransaction(txMeta.id);
      } else {
        log.info(txMeta);
        log.info(req);
        await this.torus.handleTransactionPopup(txMeta.id, req);
      }
    });

    this.torus.on("logout", () => {
      this.logout();
    });
    this.setInstanceId(randomId());
    if (!isMain) {
      const popupStoreChannel = new PopupStoreChannel({
        instanceId: this.instanceId,
        handleLogout: this.handleLogoutChannelMsg.bind(this),
        handleAccountImport: this.importAccount.bind(this),
        handleNetworkChange: (providerConfig: ProviderConfig) => this.setNetwork(providerConfig.chainId),
        handleSelectedAddressChange: this.setSelectedAccount.bind(this),
      });
      popupStoreChannel.setupStoreChannels();
    }
  }

  @Action
  public setupCommunication(origin: string): void {
    log.info("setting up communication with", origin);
    const torusStream = new BasePostMessageStream({
      name: "iframe_torus",
      target: "embed_torus",
      targetWindow: window.parent,
      targetOrigin: origin,
    });

    const communicationStream = new BasePostMessageStream({
      name: "iframe_communication",
      target: "embed_communication",
      targetWindow: window.parent,
      targetOrigin: origin,
    });
    this.torus.setupUnTrustedCommunication(torusStream, origin);
    this.torus.setupCommunicationChannel(communicationStream, origin);
  }

  @Action
  async triggerLogin({ loginProvider, login_hint }: { loginProvider: LOGIN_PROVIDER_TYPE; login_hint?: string }): Promise<void> {
    await this.torus.triggerLogin({ loginProvider, login_hint });
  }

  @Action
  handleLogoutChannelMsg(): void {
    this.torus.handleLogout();
  }

  @Action
  logout(): void {
    this.updateTorusState(cloneDeep(DEFAULT_STATE));
    const { origin } = this.torus;
    this.torus.init({ _config: DEFAULT_CONFIG, _state: DEFAULT_STATE });
    this.torus.setOrigin(origin);
    const instanceId = new URLSearchParams(window.location.search).get("instanceId");
    if (instanceId) {
      const logoutChannel = new BroadcastChannel<PopupData<BasePopupChannelData>>(
        `${BROADCAST_CHANNELS.WALLET_LOGOUT_CHANNEL}_${instanceId}`,
        broadcastChannelOptions
      );
      logoutChannel.postMessage({
        data: {
          type: BROADCAST_CHANNELS_MSGS.LOGOUT,
        },
      });
      logoutChannel.close();
    }
  }

  @Action
  setNetwork(chainId: string): void {
    const providerConfig = Object.values(WALLET_SUPPORTED_NETWORKS).find((x) => x.chainId === chainId);
    if (!providerConfig) throw new Error(`Unsupported network: ${chainId}`);
    this.torus.setNetwork(providerConfig);
    const instanceId = new URLSearchParams(window.location.search).get("instanceId");
    if (instanceId) {
      const networkChangeChannel = new BroadcastChannel<PopupData<NetworkChangeChannelData>>(
        `${BROADCAST_CHANNELS.WALLET_NETWORK_CHANGE_CHANNEL}_${instanceId}`,
        broadcastChannelOptions
      );
      networkChangeChannel.postMessage({
        data: {
          type: BROADCAST_CHANNELS_MSGS.NETWORK_CHANGE,
          network: providerConfig,
        },
      });
      networkChangeChannel.close();
    }
  }

  @Action
  async importAccount(privKey: string): Promise<void> {
    const address = await this.torus.addAccount(privKey.padStart(64, "0"), this.torus.userInfo);
    this.torus.setSelectedAccount(address);
    const instanceId = new URLSearchParams(window.location.search).get("instanceId");
    if (instanceId) {
      const accountImportChannel = new BroadcastChannel<PopupData<AccountImportedChannelData>>(
        `${BROADCAST_CHANNELS.WALLET_ACCOUNT_IMPORT_CHANNEL}_${instanceId}`,
        broadcastChannelOptions
      );
      accountImportChannel.postMessage({
        data: {
          type: BROADCAST_CHANNELS_MSGS.ACCOUNT_IMPORTED,
          privKey,
        },
      });
      accountImportChannel.close();
    }
  }

  @Action
  async setSelectedAccount(address: string) {
    this.torus.setSelectedAccount(address);
    const instanceId = new URLSearchParams(window.location.search).get("instanceId");
    if (instanceId) {
      const selectedAddressChannel = new BroadcastChannel<PopupData<SelectedAddresssChangeChannelData>>(
        `${BROADCAST_CHANNELS.WALLET_SELECTED_ADDRESS_CHANNEL}_${instanceId}`,
        broadcastChannelOptions
      );
      selectedAddressChannel.postMessage({
        data: {
          type: BROADCAST_CHANNELS_MSGS.SELECTED_ADDRESS_CHANGE,
          selectedAddress: address,
        },
      });
      selectedAddressChannel.close();
    }
  }

  @Action
  openWalletPopup(path: string) {
    this.torus.showWalletPopup(path, this.instanceId);
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
          torus: new TorusController({ _config: DEFAULT_CONFIG, _state: DEFAULT_STATE }),
          ...(parsedValue[CONTROLLER_MODULE_KEY] || {}),
        },
      };
    }
    return value || {};
  },
});

export default module;

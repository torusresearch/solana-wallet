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
import nacl from "@toruslabs/tweetnacl-js";
import axios from "axios";
import { BigNumber } from "bignumber.js";
import { BroadcastChannel } from "broadcast-channel";
import base58 from "bs58";
import { cloneDeep, merge } from "lodash-es";
import log from "loglevel";
import { Action, getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";

import OpenLoginFactory from "@/auth/OpenLogin";
import config from "@/config";
import TorusController, { DEFAULT_CONFIG, DEFAULT_STATE } from "@/controllers/TorusController";
import i18nPlugin from "@/plugins/i18nPlugin";
import installStorePlugin from "@/plugins/persistPlugin";
import { WALLET_SUPPORTED_NETWORKS } from "@/utils/const";
import { CONTROLLER_MODULE_KEY, KeyState, LOCAL_STORAGE_KEY, TorusControllerState } from "@/utils/enums";
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
  public torus = new TorusController({ _config: DEFAULT_CONFIG, _state: cloneDeep(DEFAULT_STATE) });

  public torusState: TorusControllerState = cloneDeep(DEFAULT_STATE);

  public instanceId = "";

  get selectedAddress(): string {
    return this.torusState.PreferencesControllerState?.selectedAddress || "";
  }

  get allAddresses(): string[] {
    return this.torusState.KeyringControllerState.wallets.map((x) => x.publicKey);
  }

  get allBalances() {
    return this.torusState.AccountTrackerState.accounts;
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

  get conversionRate(): number {
    return this.torus.conversionRate;
  }

  get currentCurrency(): string {
    return this.torus.currentCurrency;
  }

  // user balance in equivalent selected currency
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
    if (this.userTokens)
      return this.userTokens
        .reduce((acc: SolanaToken[], current: SolanaToken) => {
          if (
            !(current.balance?.decimals === 0) ||
            !(current.balance.uiAmount > 0) ||
            !this.torusState.TokenInfoState.metaplexMetaMap[current.mintAddress]?.uri
          ) {
            return acc;
          }
          return [...acc, { ...current, metaplexData: this.torusState.TokenInfoState.metaplexMetaMap[current.mintAddress] }];
        }, [])
        .sort((a: SolanaToken, b: SolanaToken) => a.tokenAddress.localeCompare(b.tokenAddress));
    return [];
  }

  get fungibleTokens(): SolanaToken[] {
    if (this.userTokens)
      return this.userTokens
        .reduce((acc: SolanaToken[], current: SolanaToken) => {
          const data = this.torusState.TokenInfoState.tokenInfoMap[current.mintAddress];
          if (current.balance?.decimals !== 0 && current.balance?.uiAmount && data) {
            return [
              ...acc,
              {
                ...current,
                data,
                price: this.torusState.TokenInfoState.tokenPriceMap[current.mintAddress] || {},
              },
            ];
          }
          return acc;
        }, [])
        .sort((a: SolanaToken, b: SolanaToken) => a.tokenAddress.localeCompare(b.tokenAddress));
    return [];
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
    this.torus = new TorusController({ _config: DEFAULT_CONFIG, _state: cloneDeep(DEFAULT_STATE) });
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
    const { t } = i18nPlugin.global;
    const isSet = await this.torus.setCrashReport(status);
    if (isSet) {
      if (storageAvailable("localStorage")) {
        localStorage.setItem("torus-enable-crash-reporter", String(status));
      }
      this.handleSuccess(t(NAVBAR_MESSAGES.success.CRASH_REPORT_SUCCESS));
    } else {
      this.handleError(t(NAVBAR_MESSAGES.error.CRASH_REPORT_FAILED));
    }
  }

  @Action
  public async getSNSAddress({ type, address }: { type: string; address: string }): Promise<string | null> {
    let filtered_address;
    switch (type) {
      case "sns":
        filtered_address = address.replace(/\.sol$/, "");
        break;
      case "twitter":
        filtered_address = address.replace(/^@/, "");
        break;
      default:
        filtered_address = "";
    }
    let data;
    try {
      data = await this.torus.getSNSAccount(type, filtered_address);
      return data ? data.owner.toBase58() : null;
    } catch (e) {
      return null;
    }
  }

  @Action
  public async addContact(contactPayload: ContactPayload): Promise<void> {
    const { t } = i18nPlugin.global;
    const isDeleted = await this.torus.addContact(contactPayload);
    if (isDeleted) {
      this.handleSuccess(t(NAVBAR_MESSAGES.success.ADD_CONTACT_SUCCESS));
    } else {
      this.handleError(t(NAVBAR_MESSAGES.error.ADD_CONTACT_FAILED));
    }
  }

  @Action
  public async deleteContact(contactId: number): Promise<void> {
    const { t } = i18nPlugin.global;
    const isDeleted = await this.torus.deleteContact(contactId);
    if (isDeleted) {
      this.handleSuccess(t(NAVBAR_MESSAGES.success.DELETE_CONTACT_SUCCESS));
    } else {
      this.handleError(t(NAVBAR_MESSAGES.error.DELETE_CONTACT_FAILED));
    }
  }

  @Action
  public async setTheme(theme: THEME): Promise<void> {
    await this.torus.setTheme(theme);
  }

  @Action
  public async setCurrency(currency: string): Promise<void> {
    const { t } = i18nPlugin.global;
    const isSet = await this.torus.setDefaultCurrency(currency);
    if (isSet) {
      this.handleSuccess(t(NAVBAR_MESSAGES.success.SET_CURRENCY_SUCCESS));
    } else {
      this.handleError(t(NAVBAR_MESSAGES.error.SET_CURRENCY_FAILED));
    }
  }

  @Action
  public async setLocale(locale: string): Promise<void> {
    const { t } = i18nPlugin.global;
    const isSet = await this.torus.setLocale(locale);
    if (isSet) {
      this.handleSuccess(t(NAVBAR_MESSAGES.success.SET_LOCALE_SUCCESS));
    } else {
      this.handleError(t(NAVBAR_MESSAGES.error.SET_LOCALE_FAILED));
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
    this.torus.init({
      _config: DEFAULT_CONFIG,
      _state: merge(this.torusState, state),
    });
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
        handleAccountImport: this.importExternalAccount.bind(this),
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
    });

    const communicationStream = new BasePostMessageStream({
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
  handleLogoutChannelMsg(): void {
    this.torus.handleLogout();
  }

  @Action
  async logout(): Promise<void> {
    if (isMain && this.selectedAddress) {
      try {
        const openLoginInstance = await OpenLoginFactory.getInstance();
        if (openLoginInstance.state.support3PC) {
          // eslint-disable-next-line no-underscore-dangle
          openLoginInstance._syncState(await openLoginInstance._getData());
          await openLoginInstance.logout({ clientId: config.openLoginClientId });
        }
      } catch (error) {
        log.warn(error, "unable to logout with openlogin");
        window.location.href = "/";
      }
    }
    const initialState = { ...cloneDeep(DEFAULT_STATE), NetworkControllerState: cloneDeep(this.torus.state.NetworkControllerState) };
    this.updateTorusState(initialState);

    const { origin } = this.torus;
    this.torus.init({ _config: cloneDeep(DEFAULT_CONFIG), _state: initialState });
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
  async importExternalAccount(privKey: string): Promise<void> {
    const paddedKey = privKey.padStart(64, "0");
    const address = await this.torus.importExternalAccount(paddedKey, this.torus.userInfo);
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
          privKey: paddedKey,
        },
      });
      accountImportChannel.close();
    }
  }

  @Action
  async resolveKey({ key, strategy }: { key: string; strategy: string }): Promise<string> {
    switch (strategy) {
      case "PrivateKey":
        if (!key) throw new Error("Private Key Cannot Be Empty");
        return key;
      default:
        throw new Error("Invalid Import Strategy");
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
const nonce = Buffer.from(
  new Uint8Array([81, 34, 197, 12, 58, 79, 212, 21, 96, 213, 253, 138, 195, 155, 247, 207, 111, 204, 237, 135, 229, 162, 32, 164])
).toString("hex"); //  nacl.randomBytes(24)

installStorePlugin({
  key: CONTROLLER_MODULE_KEY,
  storage: LOCAL_STORAGE_KEY,
  saveState: async (key: string, state: Record<string, unknown>, storage?: Storage) => {
    const value = storage?.getItem(key);
    const currentKeyState =
      typeof value === "string"
        ? JSON.parse(value)
        : {
            p_key: "",
            s_key: "",
            nonce,
          };

    const selectedWallet = (state?.controllerModule as any)?.controllerModule?.torusState?.KeyringControllerState?.wallets?.find(
      (wallet: { publicKey: string; privateKey: string; address: string }) =>
        wallet.publicKey === (state?.controllerModule as any)?.controllerModule?.torusState?.PreferencesControllerState?.selectedAddress
    );

    const keyState: KeyState = {
      p_key: currentKeyState?.p_key || selectedWallet?.publicKey || "",
      s_key: currentKeyState?.s_key || selectedWallet?.privateKey || "",
      nonce,
    };
    storage?.setItem(key, JSON.stringify(keyState));
    keyState.nonce = new Uint8Array(Buffer.from(keyState.nonce as string, "hex"));
    try {
      if (selectedWallet?.publicKey && selectedWallet?.privateKey) {
        const enc = new TextEncoder();
        const stateString = JSON.stringify((state?.controllerModule as any)?.controllerModule?.torusState); // string
        const stateByteArray = enc.encode(stateString); // Uint8Array
        const privKey = new Uint8Array(base58.decode(keyState.s_key)); // Uint8Array

        const encryptedState = nacl.secretbox(stateByteArray, keyState.nonce, privKey.slice(0, 32)); // Uint8Array
        const timestamp = parseInt(`${Date.now() / 1000}`, 10); // integer
        const setData = { data: Buffer.from(encryptedState).toString("hex"), timestamp }; // {data: hexString, timestamp: integer}

        const signature = nacl.sign.detached(enc.encode(JSON.stringify(setData)), privKey); // Uint8Array
        const signatureString = Buffer.from(signature).toString("hex"); // hexString

        await axios.post("http://localhost:4021/set", { pub_key: keyState.p_key, signature: signatureString, set_data: setData });
      }
    } catch (error) {
      log.error("Error saving state!", error);
    }
  },
  restoreState: async (key: string, storage?: Storage) => {
    const value = storage?.getItem(key);
    const keyState =
      typeof value === "string"
        ? JSON.parse(value)
        : {
            p_key: "",
            s_key: "",
            nonce,
          };
    keyState.nonce = new Uint8Array(Buffer.from(keyState.nonce as string, "hex"));
    try {
      const encryptedState = (await axios.post("http://localhost:4021/get", { pub_key: keyState.p_key })).data.message;
      const privKey = new Uint8Array(base58.decode(keyState.s_key));
      const encryptedStateArray = new Uint8Array(Buffer.from(encryptedState, "hex"));
      log.info(encryptedStateArray, typeof encryptedStateArray, keyState.nonce, typeof keyState.nonce, privKey, typeof privKey);
      const decryptedStateArray = nacl.secretbox.open(encryptedStateArray, keyState.nonce, privKey.slice(0, 32));
      const dec = new TextDecoder();
      const decryptedStateString = dec.decode(decryptedStateArray as Uint8Array);
      const decryptedState = JSON.parse(decryptedStateString);
      log.info("Decrypted State = ", decryptedState);
      return {
        [CONTROLLER_MODULE_KEY]: keyState,
        state: decryptedState,
      };
    } catch (error) {
      log.error("Error restoring state!", error);
    }
    return {
      [CONTROLLER_MODULE_KEY]: keyState,
      state: {},
    };
  },
});

export default module;

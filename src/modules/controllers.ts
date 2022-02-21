/* eslint-disable class-methods-use-this */
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
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
  UserInfo,
} from "@toruslabs/base-controllers";
import { LOGIN_PROVIDER_TYPE, storageAvailable } from "@toruslabs/openlogin";
import { getED25519Key } from "@toruslabs/openlogin-ed25519";
import { BasePostMessageStream } from "@toruslabs/openlogin-jrpc";
import { randomId } from "@toruslabs/openlogin-utils";
import { ExtendedAddressPreferences, NFTInfo, SolanaToken, SolanaTransactionActivity } from "@toruslabs/solana-controllers";
import nacl from "@toruslabs/tweetnacl-js";
import axios from "axios";
import { BigNumber } from "bignumber.js";
import { BroadcastChannel } from "broadcast-channel";
import base58 from "bs58";
import { cloneDeep, merge, omit } from "lodash-es";
import log from "loglevel";
import stringify from "safe-stable-stringify";
import { Action, getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";

import OpenLoginFactory from "@/auth/OpenLogin";
import config from "@/config";
import TorusController, { DEFAULT_CONFIG, DEFAULT_STATE } from "@/controllers/TorusController";
import { i18n } from "@/plugins/i18nPlugin";
import { WALLET_SUPPORTED_NETWORKS } from "@/utils/const";
import { CONTROLLER_MODULE_KEY, KeyState, TorusControllerState } from "@/utils/enums";
import { backendStatePromise, delay, isMain, normalizeJson } from "@/utils/helpers";
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
  public torus = new TorusController({
    _config: DEFAULT_CONFIG,
    _state: cloneDeep(DEFAULT_STATE),
  });

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
            return {
              ...item,
              logoURI: nftInfo.offChainMetaData?.image,
              cryptoCurrency: nftInfo.symbol,
            };
          }
        } else {
          const tokenInfo = this.torusState.TokenInfoState.tokenInfoMap[item.mintAddress];
          if (tokenInfo) {
            return {
              ...item,
              logoURI: tokenInfo.logoURI,
              cryptoCurrency: tokenInfo.symbol,
            };
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

  get lastTokenRefreshDate(): Date {
    return this.torus.lastTokenRefreshDate;
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
          return [
            ...acc,
            {
              ...current,
              metaplexData: this.torusState.TokenInfoState.metaplexMetaMap[current.mintAddress],
            },
          ];
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

  get connection() {
    return this.torus.connection;
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
    this.torus = new TorusController({
      _config: DEFAULT_CONFIG,
      _state: cloneDeep(DEFAULT_STATE),
    });
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
    const { t } = i18n.global;
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
  public async refreshUserTokens() {
    await this.torus.refreshUserTokens();
  }

  @Action
  public async getNFTmetadata(mint_address: string): Promise<NFTInfo | undefined> {
    try {
      const pda = await Metadata.getPDA(mint_address);
      const { connection } = this;
      const pdaInfo = await connection.getAccountInfo(pda);
      if (pdaInfo) {
        const metadata = new Metadata(pda, pdaInfo);
        const response = await axios.get(metadata.data.data.uri);
        return {
          ...metadata.data.data,
          offChainMetaData: response.data,
        };
      }
      throw new Error();
    } catch (error) {
      return undefined;
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
    const { t } = i18n.global;
    const isDeleted = await this.torus.addContact(contactPayload);
    if (isDeleted) {
      this.handleSuccess(t(NAVBAR_MESSAGES.success.ADD_CONTACT_SUCCESS));
    } else {
      this.handleError(t(NAVBAR_MESSAGES.error.ADD_CONTACT_FAILED));
    }
  }

  @Action
  public async deleteContact(contactId: number): Promise<void> {
    const { t } = i18n.global;
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
    const { t } = i18n.global;
    const isSet = await this.torus.setDefaultCurrency(currency);
    if (isSet) {
      this.handleSuccess(t(NAVBAR_MESSAGES.success.SET_CURRENCY_SUCCESS));
    } else {
      this.handleError(t(NAVBAR_MESSAGES.error.SET_CURRENCY_FAILED));
    }
  }

  @Action
  public async setLocale(locale: string): Promise<void> {
    const { t } = i18n.global;
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
        await this.torus.handleTransactionPopup(txMeta.id, req);
      }
    });

    this.torus.on("logout", () => {
      this.logout();
    });
    this.setInstanceId(randomId());
    this.restoreFromBackend();

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
    const res = await this.torus.triggerLogin({ loginProvider, login_hint });
    this.saveToBackend({ private_key: res.privKey, saveState: res.userInfo });
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
          await openLoginInstance.logout({
            clientId: config.openLoginClientId,
          });
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
    window.localStorage?.removeItem(CONTROLLER_MODULE_KEY);
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
  async handleRedirectFlow({ method, params, resolveRoute }: { method: string; params: { [keyof: string]: any }; resolveRoute: string }) {
    let res;
    switch (method) {
      case "topup":
        await this.torus.handleTopup(
          params.provider,
          params.params ? params.params : { selectedAddress: this.selectedAddress },
          undefined,
          true,
          resolveRoute as string
        );
        break;
      case "wallet_instance_id":
        res = { wallet_instance_id: "" };
        break;
      case "get_provider_state":
        res = {
          currentLoginProvider: this.torus.getAccountPreferences(this.selectedAddress)?.userInfo.typeOfLogin || "",
          isLoggedIn: !!this.selectedAddress,
        };
        break;
      case "wallet_get_provider_state":
        res = {
          accounts: this.torus.state.KeyringControllerState.wallets.map((e) => e.publicKey),
          chainId: this.torus.state.NetworkControllerState.chainId,
          isUnlocked: !!this.selectedAddress,
        };
        break;
      case "user_info":
        res = normalizeJson<UserInfo>(this.torus.userInfo);
        break;
      case "get_gasless_public_key":
        res = { pubkey: await this.torus.getGaslessPublicKey() };
        break;
      case "get_accounts":
        res = this.selectedAddress ? Object.keys(this.torus.state.PreferencesControllerState.identities) : [];
        break;
      case "solana_request_accounts":
        res = this.selectedAddress ? Object.keys(this.torus.state.PreferencesControllerState.identities) : [];
        break;
      case "nft_list":
        await delay(15000);
        res =
          this.nonFungibleTokens?.map((token: SolanaToken) => {
            return { balance: token.balance, mint: token.mintAddress, name: token.metaplexData?.name, uri: token.metaplexData?.uri };
          }) || [];
        break;
      default:
    }
    return res;
  }

  @Action
  openWalletPopup(path: string) {
    this.torus.showWalletPopup(path, this.instanceId);
  }

  @Action
  async saveToBackend({ private_key = "", saveState = {} }) {
    const tempKey = new Keypair().secretKey.slice(32, 64);
    const { pk: publicKey, sk: secretKey } = getED25519Key(private_key.padStart(64, "0"));
    // (ephemeral private key, user public key)
    const keyState: KeyState = {
      priv_key: base58.encode(tempKey),
      pub_key: base58.encode(publicKey),
    };
    window.localStorage?.setItem(CONTROLLER_MODULE_KEY, stringify(keyState));
    try {
      const nonce = nacl.randomBytes(24); // random nonce is required for encryption as per spec
      const stateString = stringify({ ...saveState, private_key: base58.encode(secretKey) });
      const stateByteArray = Buffer.from(stateString, "utf-8");
      const encryptedState = nacl.secretbox(stateByteArray, nonce, tempKey.slice(0, 32)); // encrypt state with tempKey

      const timestamp = Date.now();
      const setData = { data: Buffer.from(encryptedState).toString("hex"), timestamp, nonce: Buffer.from(nonce).toString("hex") }; // tkey metadata structure
      const dataHash = nacl.hash(Buffer.from(stringify(setData), "utf-8"));
      const signature = nacl.sign.detached(dataHash, secretKey);
      const signatureString = Buffer.from(signature).toString("hex");

      await axios.post(`${config.openloginStateAPI}/set`, { pub_key: keyState.pub_key, signature: signatureString, set_data: setData });
    } catch (error) {
      log.error("Error saving state!", error);
    }
  }

  @Action
  async restoreFromBackend() {
    const value = window.localStorage?.getItem(CONTROLLER_MODULE_KEY);
    const keyState: KeyState =
      typeof value === "string"
        ? JSON.parse(value)
        : {
            priv_key: "",
            pub_key: "",
          };
    try {
      if (keyState.priv_key && keyState.pub_key) {
        const pubKey = keyState.pub_key;
        let res;
        try {
          res = (await axios.post(`${config.openloginStateAPI}/get`, { pub_key: pubKey })).data;
        } catch (e) {
          window.localStorage?.removeItem(CONTROLLER_MODULE_KEY);
          throw e;
        }
        if (Object.keys(res).length && res.state && res.nonce) {
          const encryptedState = res.state;
          const nonce = Buffer.from(res.nonce, "hex");
          const ephermalPrivateKey = base58.decode(keyState.priv_key);

          const decryptedStateArray = nacl.secretbox.open(Buffer.from(encryptedState, "hex"), nonce, ephermalPrivateKey.slice(0, 32));
          if (decryptedStateArray === null) throw new Error("Couldn't decrypt state from backend");
          const decryptedStateString = Buffer.from(decryptedStateArray).toString("utf-8");
          const decryptedState = JSON.parse(decryptedStateString);

          if (!decryptedState.private_key) {
            throw new Error("Private key not found in state");
          }

          // assume valid private key
          const address = await this.torus.addAccount(
            base58.decode(decryptedState.private_key).toString("hex").slice(0, 64),
            omit(decryptedState, "private_key") as UserInfo
          );
          this.torus.setSelectedAccount(address); // TODO: check what happens in case of multiple accounts
        }
      }
    } catch (error) {
      log.error("Error restoring state!", error);
    } finally {
      if (backendStatePromise.resolve) backendStatePromise.resolve("");
    }
  }
}

const module = getModule(ControllerModule);

export default module;

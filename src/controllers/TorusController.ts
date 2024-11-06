/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
import { getHashedName, getNameAccountKey, getTwitterRegistry, NameRegistryState } from "@solana/spl-name-service";
import { Connection, LAMPORTS_PER_SOL, PublicKey, VersionedMessage, VersionedTransaction } from "@solana/web3.js";
import {
  ACCOUNT_CATEGORY,
  BaseConfig,
  BaseController,
  BaseEmbedController,
  BaseEmbedControllerState,
  BillboardEvent,
  BROADCAST_CHANNELS,
  COMMUNICATION_NOTIFICATIONS,
  CommunicationWindowManager,
  CONFIRMATION_STRATEGY,
  ContactPayload,
  createLoggerMiddleware,
  createOriginMiddleware,
  DEFAULT_PREFERENCES,
  DiscoverDapp,
  FEATURES_CONFIRM_WINDOW,
  FEATURES_DEFAULT_WALLET_WINDOW,
  FEATURES_PROVIDER_CHANGE_WINDOW,
  getPopupFeatures,
  ICommunicationProviderHandlers,
  Ihandler,
  LoginWithPrivateKeyParams,
  PaymentParams,
  PopupHandler,
  PopupWithBcHandler,
  PROVIDER_NOTIFICATIONS,
  ProviderConfig,
  randomId,
  THEME,
  TopupInput,
  TransactionState,
  TransactionStatus,
  TX_EVENTS,
  UserInfo,
} from "@toruslabs/base-controllers";
import { OpenloginSessionManager } from "@toruslabs/openlogin-session-manager";
import { LOGIN_PROVIDER_TYPE } from "@toruslabs/openlogin-utils";
import {
  AccountTrackerController,
  CurrencyController,
  CustomTokenInfo,
  ExtendedAddressPreferences,
  IProviderHandlers,
  KeyringController,
  LoadingState,
  NetworkController,
  PreferencesController,
  SendTransactionParams,
  SignAllTransactionParams,
  SignTransactionParams,
  SolanaCurrencyControllerConfig,
  SolanaToken,
  TokenInfoController,
  TokensTrackerController,
  TransactionController,
} from "@toruslabs/solana-controllers";
import {
  createEngineStream,
  JRPCEngine,
  JRPCEngineEndCallback,
  JRPCEngineNextCallback,
  JRPCRequest,
  JRPCResponse,
  providerAsMiddleware,
  SafeEventEmitter,
  SafeEventEmitterProvider,
  setupMultiplex,
  Stream,
  Substream,
  WEB3AUTH_NETWORK,
} from "@web3auth/auth";
import { BaseControllerEvents } from "@toruslabs/base-controllers";
import { BigNumber } from "bignumber.js";
import base58 from "bs58";
import { ethErrors } from "eth-rpc-errors";
import { cloneDeep, omit } from "lodash-es";
import log from "loglevel";
import pump from "pump";
import { Duplex } from "readable-stream";

import OpenLoginFactory, { createSession, updateSession } from "@/auth/OpenLogin";
import OpenLoginHandler from "@/auth/OpenLoginHandler";
import config from "@/config";
import { topupPlugin } from "@/plugins/Topup";
import { bonfidaResolve } from "@/utils/bonfida";
import { WALLET_SUPPORTED_NETWORKS } from "@/utils/const";
import {
  BUTTON_POSITION,
  CONTROLLER_MODULE_KEY,
  OpenLoginPopupResponse,
  SignMessageChannelDataType,
  TorusControllerConfig,
  TorusControllerState,
  TransactionChannelDataType,
} from "@/utils/enums";
import { getRandomWindowId, getUserLanguage, isMain, normalizeJson } from "@/utils/helpers";
import { constructTokenData } from "@/utils/instructionDecoder";
import { burnAndCloseAccount } from "@/utils/solanaHelpers";
import TorusStorageLayer from "@/utils/tkey/storageLayer";
import { TOPUP } from "@/utils/topup";

import { PKG } from "../const";

const TARGET_NETWORK = "mainnet";
const SOL_TLD_AUTHORITY = new PublicKey("58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9JPkx");

export const DEFAULT_CONFIG = {
  CurrencyControllerConfig: {
    api: config.api,
    pollInterval: 600_000,
    supportedCurrencies: config.supportedCurrencies,
  } as SolanaCurrencyControllerConfig,
  NetworkControllerConfig: {
    providerConfig: WALLET_SUPPORTED_NETWORKS[TARGET_NETWORK],
  },
  PreferencesControllerConfig: {
    pollInterval: 180_000,
    api: config.api,
    signInPrefix: "Solana Signin",
    commonApiHost: config.commonApiHost,
  },
  TransactionControllerConfig: { txHistoryLimit: 40 },
  RelayHost: {
    // torus: "https://solana-relayer.tor.us/relayer",
    // local: "http://localhost:4422/relayer",
  },
  TokensTrackerConfig: { supportedCurrencies: config.supportedCurrencies },
  TokensInfoConfig: {
    supportedCurrencies: config.supportedCurrencies,
    api: config.api,
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
    tokenPriceMap: {},
    loadState: LoadingState.FULL_RELOAD,
  },
  NetworkControllerState: {
    chainId: "loading",
    properties: {},
    providerConfig: WALLET_SUPPORTED_NETWORKS[TARGET_NETWORK],
    network: "loading",
    isCustomNetwork: false,
  },
  PreferencesControllerState: {
    identities: {},
    selectedAddress: "",
    fallback: false,
  },
  TransactionControllerState: {
    transactions: {},
    unapprovedTxs: {},
    // currentNetworkTxsList: [],
  },
  EmbedControllerState: {
    buttonPosition: BUTTON_POSITION.BOTTOM_RIGHT,
    isIFrameFullScreen: false,
    apiKey: "torus-default",
    oauthModalVisibility: false,
    loginInProgress: false,
    web3AuthClientId: "",
    chainConfig: WALLET_SUPPORTED_NETWORKS[TARGET_NETWORK],
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
    confirmationStrategy: CONFIRMATION_STRATEGY.POPUP,
    dappMetadata: {
      name: "",
      icon: "",
    },
  },
  TokensTrackerState: { tokens: undefined },
  TokenInfoState: {
    tokenInfoMap: {},
    userTokenInfoMap: {},
    metaplexMetaMap: {},
    tokenPriceMap: {},
    unknownSPLTokenInfo: [],
    unknownNFTs: [],
    metaplexLoadingState: LoadingState.FULL_RELOAD,
    tokenInfoLoadingState: LoadingState.FULL_RELOAD,
  },
  RelayMap: {},
  RelayKeyHostMap: {},
  UserDapp: new Map(),
};

export interface EventMap {
  store: (state: TorusControllerState) => void;
  networkDidChange: (network: string) => void;
  newBlock: (block: any) => void;
  logout: () => void;
  LOGIN_RESPONSE: (error: string, publicKey: string) => void;
}

export const EPHERMAL_KEY = `${CONTROLLER_MODULE_KEY}-ephemeral`;

export default class TorusController extends BaseController<TorusControllerConfig, TorusControllerState, EventMap> {
  public communicationManager = new CommunicationWindowManager();

  private tokenInfoController!: TokenInfoController;

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

  private storageLayer?: TorusStorageLayer;

  private lastTokenRefresh: Date = new Date();

  private instanceId = "";

  constructor({ _config, _state }: { _config: Partial<TorusControllerConfig>; _state: Partial<TorusControllerState> }) {
    super({ config: _config, state: _state });
  }

  get origin(): string {
    return this.preferencesController.iframeOrigin;
  }

  get userSOLBalance(): string {
    const balance = this.accountTracker.state.accounts[this.selectedAddress]?.balance || "0x0";
    const value = new BigNumber(balance).div(new BigNumber(LAMPORTS_PER_SOL));
    return value.toString();
  }

  get selectedAddress(): string {
    return this.preferencesController?.state.selectedAddress;
  }

  get existingTokenAddress(): string[] {
    const tokenList = this.tokenInfoController?.state?.tokenInfoMap || {};
    return Object.keys(tokenList);
  }

  get tokens(): { [address: string]: SolanaToken[] } {
    return this.tokensTracker.state.tokens || {};
  }

  get conversionRate(): number {
    if (!this.currencyController.state.tokenPriceMap.solana) return 0;
    return this.currencyController.state.tokenPriceMap.solana[this.currentCurrency.toLowerCase()];
  }

  get jwtToken(): string {
    return this.preferencesController.state.identities[this.selectedAddress]?.jwtToken || "";
  }

  get userInfo(): UserInfo {
    return this.preferencesController.state.identities[this.selectedAddress]?.userInfo || cloneDeep(DEFAULT_PREFERENCES.userInfo);
  }

  get locale(): string {
    return this.getAccountPreferences(this.selectedAddress)?.locale?.split("-")[0] || getUserLanguage();
  }

  get communicationProvider(): SafeEventEmitterProvider {
    return this.embedController._communicationProviderProxy;
  }

  get currentCurrency(): string {
    // fiat currency
    return this.currencyController?.state?.currentCurrency;
  }

  get nativeCurrency(): string {
    // crypto currency
    return this.currencyController?.state?.nativeCurrency;
  }

  get currentNetworkName(): string {
    return this.networkController.state.providerConfig.displayName;
  }

  get provider(): SafeEventEmitterProvider {
    return this.networkController._providerProxy as unknown as SafeEventEmitterProvider;
  }

  get chainId(): string {
    // crypto currency
    return this.networkController?.state?.chainId;
  }

  // UNSAFE METHOD: use with caution
  get privateKey(): string | undefined {
    return this.keyringController?.state.wallets.find((keyring) => keyring.address === this.selectedAddress)?.privateKey;
  }

  // has active private key
  get hasSelectedPrivateKey(): boolean {
    return !!this.privateKey;
  }

  get hasKeyPair(): boolean {
    return this.keyringController?.state.wallets.length > 0 || false;
  }

  get embedLoginInProgress(): boolean {
    return this.embedController?.state.loginInProgress;
  }

  get embedOauthModalVisibility(): boolean {
    return this.embedController?.state.oauthModalVisibility || false;
  }

  get embedIsIFrameFullScreen(): boolean {
    return this.embedController?.state.isIFrameFullScreen || false;
  }

  get connection(): Connection {
    return this.networkController.getConnection();
  }

  get blockExplorerUrl(): string {
    return this.networkController.getProviderConfig().blockExplorerUrl;
  }

  get lastTokenRefreshDate(): Date {
    return new Date(Number(this.currencyController.state.conversionDate) * 1000);
  }

  /**
   * Always call init function before using this controller
   */
  public init({ _config, _state }: { _config: Partial<TorusControllerConfig>; _state: Partial<TorusControllerState> }): void {
    log.info(_config, _state, "restoring config & state");

    const initialState = _state;
    // overwrite google node with default node
    // overwrite custom node with default node when isMain is True
    if ((isMain && initialState.NetworkControllerState?.isCustomNetwork) || !initialState.NetworkControllerState?.isCustomNetwork) {
      let defaultNetwork = WALLET_SUPPORTED_NETWORKS.mainnet;
      if (initialState.NetworkControllerState) {
        if (initialState.NetworkControllerState.providerConfig.chainId === "0x2") defaultNetwork = WALLET_SUPPORTED_NETWORKS.testnet;
        if (initialState.NetworkControllerState.providerConfig.chainId === "0x3") defaultNetwork = WALLET_SUPPORTED_NETWORKS.devnet;
        initialState.NetworkControllerState.providerConfig = defaultNetwork;
        log.info("unsupported api.google rpc endpoint, replaced with default rpc endpoint");
      }
    }

    this.storageLayer = new TorusStorageLayer({
      hostUrl: config.openloginStateAPI,
    });
    // BaseController methods
    this.initialize();
    this.configure(_config, true, true);
    this.update(_state, true);

    this.networkController = new NetworkController({
      config: this.config.NetworkControllerConfig,
      state: this.state.NetworkControllerState,
    });
    this.initializeProvider();

    this.embedController = new BaseEmbedController({
      config: {},
      state: this.state.EmbedControllerState,
    });
    this.initializeCommunicationProvider();

    this.tokenInfoController = new TokenInfoController({
      config: this.config.TokensInfoConfig,
      state: this.state.TokenInfoState,
      getConnection: this.networkController.getConnection.bind(this),
      getJwt: () => this.jwtToken,
      getSelectedAddress: () => this.preferencesController.state.selectedAddress,
      getNetworkProviderState: () => this.networkController.state,
    });

    this.currencyController = new CurrencyController({
      config: this.config.CurrencyControllerConfig,
      state: this.state.CurrencyControllerState,
    });
    const combinedTokens = {...this.tokenInfoController.state.userTokenInfoMap, ...this.tokenInfoController.state.tokenInfoMap};
    this.currencyController.updateQueryToken(Object.values(combinedTokens), true);
    if (this.preferencesController?.state?.selectedAddress) {
      this.currencyController.scheduleConversionInterval();
      this.currencyController.updateConversionRate();
    }

    // key mgmt
    this.keyringController = new KeyringController({
      config: this.config.KeyringControllerConfig,
      state: this.state.KeyringControllerState,
    });

    this.preferencesController = new PreferencesController({
      state: this.state.PreferencesControllerState,
      config: this.config.PreferencesControllerConfig,
      signAuthMessage: this.keyringController.signAuthMessage.bind(this.keyringController),
      getProviderConfig: this.networkController.getProviderConfig.bind(this.networkController),
      getCurrentCurrency: this.currencyController.getCurrentCurrency.bind(this.currencyController),
      getConversionRate: this.currencyController.getConversionRate.bind(this.currencyController),
      getConnection: this.networkController.getConnection.bind(this),
      validateSignMessage: async (_msg: string) => {
        //
      },
    });

    this.accountTracker = new AccountTrackerController({
      state: this.state.AccountTrackerState,
      config: this.config.AccountTrackerConfig,
      getIdentities: () => this.preferencesController.state.identities,
      getConnection: this.networkController.getConnection.bind(this),
    });

    this.txController = new TransactionController({
      config: this.config.TransactionControllerConfig,
      state: this.state.TransactionControllerState,
      blockTracker: this.networkController._blockTrackerProxy,
      getCurrentChainId: this.networkController.getNetworkIdentifier.bind(this.networkController),
      getConnection: this.networkController.getConnection.bind(this),
      signTransaction: this.keyringController.signTransaction.bind(this.keyringController),
    });

    this.tokensTracker = new TokensTrackerController({
      state: this.state.TokensTrackerState,
      config: this.config.TokensTrackerConfig,
      getIdentities: () => this.preferencesController.state.identities,
      getConnection: this.networkController.getConnection.bind(this),
    });

    this.txController.on(TX_EVENTS.TX_UNAPPROVED, ({ txMeta, req }) => {
      this.emit(TX_EVENTS.TX_UNAPPROVED as keyof EventMap, { txMeta, req });
    });

    this.networkController._blockTrackerProxy.on("latest", (block) => {
      if (this.preferencesController.state.selectedAddress) {
        // this.preferencesController.sync(this.preferencesController.state.selectedAddress);
        this.accountTracker.refresh();
        this.tokensTracker.updateSolanaTokens();
        this.preferencesController.updateDisplayActivities();
      }
      this.emit("newBlock", block);
    });

    // ensure accountTracker updates balances after network change
    this.networkController.on("networkDidChange", async () => {
      if (this.selectedAddress) {
        this.preferencesController.initializeDisplayActivity().catch((err) => {
          log.error(err, "error while initializing display activity", this.selectedAddress);
        });
      }

      this.engine?.emit("notification", {
        method: PROVIDER_NOTIFICATIONS.CHAIN_CHANGED,
        params: {
          chainId: this.networkController.state.chainId,
        },
      });
      // emit event from toruscontroller, network controller is private
      this.emit("networkDidChange", this.state.NetworkControllerState.network);
    });

    // Listen to controller changes
    this.preferencesController.on("store", (state2) => {
      this.update({ PreferencesControllerState: state2 });
    });

    this.currencyController.on("store", (state2) => {
      this.update({ CurrencyControllerState: state2 });
    });

    this.networkController.on("store", (state2) => {
      this.update({ NetworkControllerState: state2 });
    });

    this.accountTracker.on("store", (state2) => {
      this.update({ AccountTrackerState: state2 });
    });

    this.tokenInfoController.on("store", (state2) => {
      this.update({ TokenInfoState: state2 });
      const combinedTokens = {...state2.userTokenInfoMap, ...state2.tokenInfoMap};
      this.currencyController.updateQueryToken(Object.values(combinedTokens), true);
    });

    this.keyringController.on("store", (state2) => {
      this.update({ KeyringControllerState: state2 });
    });

    this.tokensTracker.on("store", async (state2) => {
      this.update({ TokensTrackerState: state2 });
      if (state2.tokens) {
        this.tokenInfoController.updateMetadata(state2.tokens[this.selectedAddress]);
        this.tokenInfoController.updateTokenInfoMap(state2.tokens[this.selectedAddress]);
      }
      // this.tokenInfoController.updateTokenPrice(state2.tokens[this.selectedAddress]);
    });

    this.txController.on("store", (state2: TransactionState<VersionedTransaction>) => {
      this.update({ TransactionControllerState: state2 });
      Object.keys(state2.transactions).forEach(async (txId) => {
        if (state2.transactions[txId].status === TransactionStatus.submitted) {
          // Check if token transfer
          const tokenTransfer = await constructTokenData(
            this.currencyController.state.tokenPriceMap,
            this.tokenInfoController.state,
            this.connection,
            state2.transactions[txId].transaction,
            this.tokensTracker.state.tokens ? this.tokensTracker.state.tokens[this.selectedAddress] : []
          );
          this.preferencesController.patchNewTx(state2.transactions[txId], this.selectedAddress, tokenTransfer).catch((err) => {
            log.error(err, "error while patching a new tx");
          });
        }
      });
    });

    this.embedController.on("store", (state2) => {
      this.update({ EmbedControllerState: state2 });
    });

    this.updateRelayMap();
  }

  updateRelayMap = async (): Promise<void> => {
    const relayMap: { [keyof: string]: string } = {};
    const relayKeyHost: { [keyof: string]: string } = {};

    const promises = Object.keys(this.config.RelayHost).map(async (value) => {
      try {
        const res = await fetch(`${this.config.RelayHost[value]}/public_key`);
        const res_json = await res.json();
        relayMap[value] = res_json.key;
        relayKeyHost[res_json.key] = this.config.RelayHost[value];
        return undefined;
      } catch (e) {
        return { [value]: "" };
      }
    });

    await Promise.all(promises);

    this.update({
      RelayMap: relayMap,
      RelayKeyHostMap: relayKeyHost,
    });
  };

  setTokenLoadingState() {
    this.tokenInfoController.setTokenLoadingState();
  }

  async importCustomToken(token: CustomTokenInfo) {
    try {
      token.publicAddress = this.selectedAddress;
      token.network = this.currentNetworkName;
      const result = await this.tokenInfoController.importCustomToken(token);
      const tokenList = this.tokensTracker.state.tokens ? this.tokensTracker.state.tokens[this.selectedAddress] : [];
      if (tokenList?.length) await this.tokenInfoController.updateTokenInfoMap(tokenList, true);
      return result;
    } catch (err) {
      log.error(err);
      throw new Error("Unable to import token", err as Error);
    }
  }

  async fetchMetaPlexNft(nftMintAddress: string[]) {
    return TokenInfoController.fetchMetaplexNFTs(nftMintAddress, this.connection);
  }

  async fetchTokenInfo(mintAddress: string) {
    const res = await this.tokenInfoController.fetchTokenInfo([mintAddress]);
    return res[mintAddress];
  }

  setOrigin(origin: string): void {
    this.preferencesController.setIframeOrigin(origin);
  }

  setInstanceId(instanceId: string): void {
    this.instanceId = instanceId;
  }

  async getInputKey(input: string) {
    const hashedInputName = await getHashedName(input);
    const inputDomainKey = await getNameAccountKey(hashedInputName, undefined, SOL_TLD_AUTHORITY);
    return { inputDomainKey, hashedInputName };
  }

  async getSNSAccount(type: string, address: string): Promise<NameRegistryState | null | PublicKey> {
    // const { inputDomainKey } = await this.getInputKey(address); // we only support SNS at the moment
    switch (type) {
      case "sns": {
        // const registry = await NameRegistryState.retrieve(this.connection, inputDomainKey);
        // const nftOwner = await retrieveNftOwner(this.connection, inputDomainKey);
        // return { registry, nftOwner };
        const owner = await bonfidaResolve(this.connection, address);
        return owner;
      }
      case "twitter":
        return getTwitterRegistry(this.connection, address);
      default:
        return null;
    }
  }

  async approveSignTransaction(txId: string): Promise<void> {
    await this.txController.approveSignTransaction(txId, this.state.PreferencesControllerState.selectedAddress);
  }

  async approveTransaction(txId: string): Promise<void> {
    await this.txController.approveTransaction(txId, this.state.PreferencesControllerState.selectedAddress);
  }

  async transfer(tx: VersionedTransaction, req?: Ihandler<SendTransactionParams>): Promise<string> {
    const signedTransaction = await this.txController.addSignTransaction(tx, req);
    try {
      await signedTransaction.result;
    } catch (e) {
      throw ethErrors.provider.userRejectedRequest((e as Error).message);
    }

    try {
      // serialize transaction
      const serializedTransaction = Buffer.from(signedTransaction.transactionMeta.transaction.serialize());

      // submit onchain
      const options = req?.params?.options;
      const signature = await this.connection.sendRawTransaction(serializedTransaction, options);

      // attach necessary info and update controller state
      signedTransaction.transactionMeta.transactionHash = signature;
      signedTransaction.transactionMeta.rawTransaction = serializedTransaction.toString("hex");
      this.txController.setTxStatusSubmitted(signedTransaction.transactionMeta.id);
      return signature;
    } catch (error) {
      log.warn("error while submiting transaction", error);
      this.txController.setTxStatusFailed(signedTransaction.transactionMeta.id, error as Error);
      throw error;
    }
  }

  // burn NFT
  async burnToken(NFTtoBurn: string) {
    try {
      const currentTokens = this.tokens[this.selectedAddress];
      const foundToken = currentTokens.find((x: SolanaToken) => {
        return x.mintAddress === NFTtoBurn;
      });

      const associatedAddress = foundToken?.tokenAddress;
      if (!associatedAddress) {
        throw new Error("Token address not found in Token tracker state");
      }

      const tx = await burnAndCloseAccount(this.selectedAddress, associatedAddress, NFTtoBurn, this.connection);
      const result = await this.transfer(tx);
      log.info({ result });

      // remove state optimistically
      const newState = currentTokens.filter((x) => x.mintAddress !== NFTtoBurn);
      this.tokensTracker.update({
        tokens: {
          [this.selectedAddress]: newState,
        },
      });
    } catch (error) {
      log.error(error);
      throw new Error("Burn NFT Failed");
    }
  }

  getGaslessHost(_feePayer: string): string | undefined {
    return undefined;
    // if (!feePayer || feePayer === this.selectedAddress) return undefined;

    // const relayHost = this.state.RelayKeyHostMap[feePayer];
    // if (relayHost) {
    //   return `${relayHost}/partial_sign`;
    // }
    // throw new Error("Invalid Relay");
  }

  importExternalAccount(privKey: string, userInfo: UserInfo): Promise<string> {
    let pKey: string;
    try {
      pKey = Buffer.from(new Uint8Array(JSON.parse(privKey)))
        .toString("hex")
        .slice(0, 64);
    } catch (e1) {
      try {
        pKey = Buffer.from(base58.decode(privKey)).toString("hex").slice(0, 64);
      } catch (e2) {
        pKey = privKey;
      }
    }
    return this.addAccount(pKey, userInfo);
  }

  async addAccount(privKey: string, userInfo?: UserInfo, rehydrate?: boolean): Promise<string> {
    const address = this.keyringController.importKeyring(base58.decode(privKey));
    if (userInfo) {
      // try catch to prevent breaking login flow
      try {
        // omit address's preferences state on login (the jwt might be expired)
        this.preferencesController.update({ identities: omit(this.preferencesController.state.identities, address), selectedAddress: "" });
        await this.preferencesController.initPreferences({
          address,
          jwtToken: userInfo.idToken,
          calledFromEmbed: !isMain,
          userInfo,
          rehydrate,
          type: ACCOUNT_CATEGORY.IMPORTED,
        });
      } catch (e) {
        log.error(e);
        await this.preferencesController.backendFallback(address, userInfo);
      }
    }
    return address;
  }

  async setSelectedAccount(address: string, sync = false) {
    if (this.state.PreferencesControllerState.selectedAddress !== address) this.setTokenLoadingState();
    this.preferencesController.setSelectedAddress(address);
    if (sync) await this.preferencesController.sync(address);

    // set account in accountTracker
    this.accountTracker.syncAccounts();
    // get state from chain
    this.accountTracker.refresh();

    this.tokensTracker.updateSolanaTokens();
    this.preferencesController.initializeDisplayActivity();
  }

  async setCurrentCurrency(currency: string): Promise<void> {
    const { ticker } = this.networkController.getProviderConfig();
    this.currencyController.setNativeCurrency(ticker);
    // This is USD
    this.currencyController.setCurrentCurrency(currency);
    // await this.currencyController.updateConversionRate();
    // TODO: store this in prefsController
  }

  setNetwork(providerConfig: ProviderConfig): void {
    this.setTokenLoadingState();
    this.networkController.setProviderConfig(providerConfig);
  }

  getAccountPreferences(address: string): ExtendedAddressPreferences | undefined {
    if (!this.hasSelectedPrivateKey) return undefined;
    return this.preferencesController && this.preferencesController.getAddressState(address);
  }

  UNSAFE_signTransaction(transaction: VersionedTransaction): VersionedTransaction {
    return this.keyringController.signTransaction(transaction, this.state.PreferencesControllerState.selectedAddress);
  }

  async setCrashReport(status: boolean): Promise<boolean> {
    return this.preferencesController.setCrashReport(status);
  }

  async addContact(contactPayload: ContactPayload): Promise<boolean> {
    return this.preferencesController.addContact(contactPayload);
  }

  async deleteContact(contactId: number): Promise<boolean> {
    return this.preferencesController.deleteContact(contactId);
  }

  async setTheme(theme: THEME): Promise<boolean> {
    return this.preferencesController.setUserTheme(theme);
  }

  async refreshJwt(address?: string): Promise<void> {
    const currentAddress = this.selectedAddress;
    if (address) this.preferencesController.setSelectedAddress(address);
    await this.preferencesController.refreshJwt();
    this.preferencesController.setSelectedAddress(currentAddress);
  }

  async setDefaultCurrency(currency: string): Promise<boolean> {
    const { ticker } = this.networkController.getProviderConfig();
    // This is SOL
    this.currencyController.setNativeCurrency(ticker);
    // This is USD
    this.currencyController.setCurrentCurrency(currency);
    // await this.currencyController.updateConversionRate();
    return this.preferencesController.setSelectedCurrency({
      selectedCurrency: currency,
    });
  }

  async setLocale(locale: string): Promise<boolean> {
    return this.preferencesController.setUserLocale(locale);
  }

  async getBillboardData(): Promise<BillboardEvent[]> {
    return this.preferencesController.getBillBoardData();
  }

  async refreshUserTokens(): Promise<void> {
    this.currencyController.scheduleConversionInterval();
    await this.currencyController.updateConversionRate();
    // await this.tokensTracker.updateSolanaTokens();
  }

  setIFrameStatus(req: JRPCRequest<{ isIFrameFullScreen: boolean; rid?: string }>): void {
    const { isIFrameFullScreen = false, rid } = req.params || {};
    this.embedController.update({
      isIFrameFullScreen,
    });

    if (rid) this.emit(rid as keyof EventMap);
  }

  logout(req: JRPCRequest<[]>, res: JRPCResponse<boolean>, _: JRPCEngineNextCallback, end: JRPCEngineEndCallback): void {
    this.handleLogout();
    res.result = true;
    end();
  }

  public handleLogout(): void {
    this.emit("logout");
    this.notifyEmbedLogout();
  }

  public notifyEmbedLogout(): void {
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
  }

  closeIframeFullScreen(): void {
    this.communicationEngine?.emit("notification", {
      method: COMMUNICATION_NOTIFICATIONS.IFRAME_STATUS,
      params: {
        isFullScreen: false,
      },
    });
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

  showWalletPopup(path: string, instanceId: string): void {
    sessionStorage.setItem(instanceId, this.origin);
    const finalUrl = new URL(`${config.baseRoute}${path}?instanceId=${instanceId}`);
    // const finalUrl = new URL(`${config.baseRoute}${path}?instanceId=${instanceId}&dappLink=${this.origin}`);
    const walletPopupWindow = new PopupHandler({
      config: {
        features: getPopupFeatures(FEATURES_DEFAULT_WALLET_WINDOW),
      },
      state: { url: finalUrl, windowId: "" },
    });
    walletPopupWindow.open();
  }

  public loginFromWidgetButton(): void {
    const id = randomId();
    this.toggleIframeFullScreen(id);
    this.once(id as keyof EventMap, () => {
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
      this.once(id2 as keyof EventMap, () => {
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
          params: {
            currentLoginProvider: this.getAccountPreferences(this.selectedAddress)?.userInfo.typeOfLogin || "",
          },
        });
      }
    });
  }

  public embededOAuthLoginInProgress(): void {
    this.embedController.update({
      loginInProgress: true,
      oauthModalVisibility: false,
    });
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

    const engine = this.setupCommunicationProviderEngine({
      origin: senderUrl.origin,
    });
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
    const { windowId } = req.params as unknown as ProviderConfig & {
      windowId: string;
    };
    const channelName = `${BROADCAST_CHANNELS.PROVIDER_CHANGE_CHANNEL}_${windowId}`;
    const finalUrl = new URL(`${config.baseRoute}providerchange?integrity=true&instanceId=${windowId}`);
    const providerChangeWindow = new PopupWithBcHandler({
      state: {
        url: finalUrl,
        windowId,
      },
      config: {
        communicationEngine: this.communicationEngine as JRPCEngine,
        communicationWindowManager: this.communicationManager,
        target: "_blank",
        features: getPopupFeatures(FEATURES_PROVIDER_CHANGE_WINDOW),
      },
      channelPrefix: channelName,
    });
    const result = (await providerChangeWindow.handleWithHandshake({
      origin: this.preferencesController.iframeOrigin,
      newNetwork: req.params,
      currentNetwork: this.networkController.state.providerConfig.displayName,
    })) as { approve: boolean };
    const { approve = false } = result;
    if (approve) {
      this.networkController.setProviderConfig(req.params as unknown as ProviderConfig);
      return true;
    }
    throw new Error("user denied provider change request");
  }

  async handleTransactionPopup(
    txId: string,
    req: Ihandler<SendTransactionParams | SignTransactionParams | SignAllTransactionParams>
  ): Promise<boolean> {
    try {
      const { windowId } = req;
      if (!windowId) throw new Error("windowId not found");
      const channelName = `${BROADCAST_CHANNELS.TRANSACTION_CHANNEL}_${windowId}`;
      const finalUrl = new URL(`${config.baseRoute}confirm?instanceId=${windowId}&integrity=true&id=${windowId}`);

      const popupPayload: TransactionChannelDataType = {
        type: req.method,
        message: req.params?.message || "",
        messageOnly: req.params?.messageOnly || false,
        signer: this.selectedAddress,
        // txParams: JSON.parse(JSON.stringify(this.txController.getTransaction(txId))),
        origin: this.preferencesController.iframeOrigin,
        balance: this.userSOLBalance,
        selectedCurrency: this.currencyController.state.currentCurrency,
        selectedAddress: this.selectedAddress,
        currencyRate: this.conversionRate.toString(),
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
          communicationEngine: this.communicationEngine,
          communicationWindowManager: this.communicationManager,
          target: "_blank",
          features: getPopupFeatures(FEATURES_CONFIRM_WINDOW),
        },
        channelPrefix: channelName,
      });
      const result = (await txApproveWindow.handleWithHandshake(popupPayload)) as { approve: boolean };
      const { approve = false } = result;
      if (approve) {
        if (txId) this.approveSignTransaction(txId);
        return true; // TODO: fix temp bypass for sign all transactions
      }
      if (txId) this.txController.setTxStatusRejected(txId); // rejected
      return false;
    } catch (error) {
      log.error(error);
      this.txController.setTxStatusRejected(txId);
      return false;
    }
  }

  async handleSignMessagePopup(
    req: JRPCRequest<{
      data: Uint8Array;
      display?: string;
      message?: string;
    }> & { origin?: string; windowId?: string }
  ): Promise<boolean> {
    try {
      const { windowId } = req;
      if (!windowId) throw new Error("windowId not found");
      const channelName = `${BROADCAST_CHANNELS.TRANSACTION_CHANNEL}_${windowId}`;
      const finalUrl = new URL(`${config.baseRoute}confirm_message?instanceId=${windowId}&integrity=true&id=${windowId}`);

      const popupPayload: SignMessageChannelDataType = {
        type: req.method,
        data: Buffer.from(req.params?.data || []).toString("hex"),
        display: req.params?.display,
        message: Buffer.from(req.params?.data || []).toString(),
        signer: this.selectedAddress,
        // txParams: JSON.parse(JSON.stringify(this.txController.getTransaction(txId))),
        origin: this.preferencesController.iframeOrigin,
        balance: this.userSOLBalance,
        selectedCurrency: this.currencyController.state.currentCurrency,
        selectedAddress: this.selectedAddress,
        currencyRate: this.conversionRate.toString(),
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
          communicationEngine: this.communicationEngine,
          communicationWindowManager: this.communicationManager,
          target: "_blank",
        },
        channelPrefix: channelName,
      });
      const result = (await txApproveWindow.handleWithHandshake(popupPayload)) as { approve: boolean };
      const { approve = false } = result;
      return approve;
    } catch (error) {
      log.error(error);
      return false;
    }
  }

  async embedhandleTopUp(req: JRPCRequest<TopupInput>): Promise<boolean> {
    const windowId = req.params?.windowId;
    const params = req.params?.params || {};
    const provider = TOPUP.MOONPAY;
    return this.handleTopup(provider, params as PaymentParams, windowId);
  }

  async handleTopup(provider: string, params: PaymentParams, windowId?: string, redirectFlow?: boolean, redirectURL?: string): Promise<boolean> {
    // async handleTopUp(finalUrl: URL, instanceId: string, windowId?: string, redirectFlow?: boolean): Promise<boolean> {
    const instanceId = windowId || getRandomWindowId();
    const state = {
      // selectedAddress: params.selectedAddress || this.selectedAddress,
      selectedAddress: this.selectedAddress,
      email: this.state.PreferencesControllerState.identities[this.selectedAddress].userInfo.email || "",
    };
    log.info(params);
    try {
      const finalUrl = await topupPlugin[provider].orderUrl(state, params, instanceId, redirectFlow, redirectURL);

      if (!redirectFlow && windowId) {
        const channelName = `${BROADCAST_CHANNELS.REDIRECT_CHANNEL}_${instanceId}`;
        const topUpPopUpWindow = new PopupWithBcHandler({
          state: {
            url: finalUrl,
            windowId,
          },
          config: {
            communicationEngine: this.communicationEngine,
            communicationWindowManager: this.communicationManager,
            target: "_blank",
          },
          channelPrefix: channelName,
        });
        await topUpPopUpWindow.handle();
      } else {
        window.location.href = finalUrl.toString();
      }
      return true;
    } catch (err) {
      log.error(err);
      throw err;
    }
  }

  public async triggerLogin({
    loginProvider,
    login_hint,
    waitSaving,
  }: {
    loginProvider: LOGIN_PROVIDER_TYPE;
    login_hint?: string;
    waitSaving?: boolean;
  }): Promise<OpenLoginPopupResponse> {
    log.info(waitSaving);
    try {
      const extraLoginOptions: Record<string, string> = {
        dappOrigin: this.origin,
      };
      if (login_hint) extraLoginOptions.login_hint = login_hint;

      const handler = new OpenLoginHandler({
        windowId: randomId(),
        loginProvider,
        extraLoginOptions,
      });
      const result = await handler.handleLoginWindow({
        communicationEngine: this.communicationEngine,
        communicationWindowManager: this.communicationManager,
      });
      const { userInfo, accounts } = result;

      // if iframe (Dapp), only populate selected account only.
      // index 0 is the selected account
      // const targetAccount = isMain ? accounts : accounts.filter((account) => account.privKey === privKey);
      const targetAccount = isMain ? accounts : [accounts[0]];
      if (targetAccount.length === 0) throw new Error("Login Error");

      // populate account
      const userDapp = new Map();
      const accountPromise = targetAccount.map((account) => {
        userDapp.set(account.address, account.app);
        return this.addAccount(account.solanaPrivKey, userInfo as UserInfo);
      });
      this.update({ UserDapp: userDapp });

      // wait for selected account
      const address = await accountPromise[0];
      this.setSelectedAccount(address);

      if (!this.hasSelectedPrivateKey || !this.privateKey) throw new Error("Wallet Error: Invalid private key ");

      this.emit("LOGIN_RESPONSE", "", address);
      return result;
    } catch (error) {
      this.emit("LOGIN_RESPONSE", (error as Error)?.message, "");
      log.error(error);
      throw error;
    }
  }

  async signMessage(
    req: JRPCRequest<{
      data: Uint8Array;
      display?: string;
      message?: string;
    }> & {
      origin?: string | undefined;
      windowId?: string | undefined;
    },
    isRedirectFlow = false
  ) {
    if (!this.selectedAddress) throw ethErrors.provider.unauthorized("User Not logged in");

    let approve: boolean;
    if (!isRedirectFlow) approve = await this.handleSignMessagePopup(req);
    else approve = true;
    if (approve) {
      // const msg = Buffer.from(req.params?.message || "", "hex");
      const data = req.params?.data as Uint8Array;
      return this.keyringController.signMessage(data, this.selectedAddress);
    }
    throw ethErrors.provider.userRejectedRequest("User Rejected");
  }

  async getGaslessPublicKey() {
    const relayPublicKey = this.state.RelayMap.torus;
    if (!relayPublicKey) throw new Error("Invalid Relay");
    return relayPublicKey;
  }

  // Only called in redirect flow
  async UNSAFE_signAllTransactions(req: Ihandler<{ message: string[] | undefined }>) {
    // sign all transaction
    const allTransactions = req.params?.message?.map((msg: string) => {
      const tx = VersionedTransaction.deserialize(new Uint8Array(Buffer.from(msg as string, "hex")));
      const modifiedTx = this.keyringController.signTransaction(tx, this.selectedAddress);
      const signedMessage = Buffer.from(modifiedTx.serialize()).toString("hex");
      return signedMessage;
    });

    return allTransactions;
  }

  async getDappList(): Promise<DiscoverDapp[]> {
    return this.preferencesController.getDappList();
  }

  private async providerRequestAccounts(req: JRPCRequest<unknown>) {
    const accounts = await this.requestAccounts(req);

    this.engine?.emit("notification", {
      method: PROVIDER_NOTIFICATIONS.UNLOCK_STATE_CHANGED,
      params: {
        accounts,
        isUnlocked: accounts.length > 0,
      },
    });
    this.communicationEngine?.emit("notification", {
      method: COMMUNICATION_NOTIFICATIONS.USER_LOGGED_IN,
      params: {
        currentLoginProvider: this.getAccountPreferences(this.selectedAddress)?.userInfo.typeOfLogin || "",
      },
    });
    return accounts;
  }

  private async getAccounts() {
    return this.preferencesController.state.selectedAddress ? [this.preferencesController.state.selectedAddress] : [];
  }

  private async providerSignAllTransaction(req: Ihandler<SignAllTransactionParams>) {
    if (!this.selectedAddress) throw new Error("Not logged in");

    const message = req.params?.message;
    if (!message?.length) throw new Error("Empty message from embed");

    // if this approval fails, reject the entire tx
    // this is different from `signTransaction` because controllers do not support multiple txs
    const approved = await this.handleTransactionPopup("", req);
    if (!approved) throw ethErrors.provider.userRejectedRequest("User Rejected");

    // sign all transaction
    const allTransactions = req.params?.message?.map((msg) => {
      if (req.params?.messageOnly) {
        const signature = this.keyringController.signMessage(new Uint8Array(Buffer.from(msg as string, "hex")), this.selectedAddress);
        return JSON.stringify({
          publicKey: this.selectedAddress,
          signature: Buffer.from(signature).toString("hex"),
        });
      }

      // Fallback to whole tx
      // const msgObj = VersionedMessage.deserialize(msg);
      // const tx = new VersionedTransaction(msgObj);
      const tx = VersionedTransaction.deserialize(new Uint8Array(Buffer.from(msg as string, "hex")));
      const signedTx = this.keyringController.signTransaction(tx, this.selectedAddress);
      const signedMessage = Buffer.from(signedTx.serialize()).toString("hex");
      return signedMessage;
    });
    return allTransactions;
  }

  private async providerSignTransaction(req: JRPCRequest<SignTransactionParams>) {
    if (!this.selectedAddress) throw new Error("Not logged in");

    const message = req.params?.message;
    if (!message) throw new Error("Empty message from embed");

    let signature: Uint8Array;
    if (req.params?.messageOnly) {
      const approved = await this.handleTransactionPopup("", req);
      if (!approved) throw ethErrors.provider.userRejectedRequest("User Rejected");

      signature = this.keyringController.signMessage(new Uint8Array(Buffer.from(message as string, "hex")), this.selectedAddress);

      return JSON.stringify({
        publicKey: this.selectedAddress,
        signature: Buffer.from(signature).toString("hex"),
      });
    }

    const tx = VersionedTransaction.deserialize(new Uint8Array(Buffer.from(message as string, "hex")));

    const ret_signed = await this.txController.addSignTransaction(tx, req);
    try {
      await ret_signed.result;
    } catch (e) {
      throw ethErrors.provider.userRejectedRequest((e as Error).message);
    }

    const signed_tx = ret_signed.transactionMeta.txReceipt as string;
    return signed_tx;
  }

  private async sendTransaction(req: JRPCRequest<SendTransactionParams>) {
    if (!this.selectedAddress) throw new Error("Not logged in");
    const message = req.params?.message;
    if (!message) throw new Error("empty error message");

    let tx: VersionedTransaction;
    if (req.params?.messageOnly) {
      const msgObj = VersionedMessage.deserialize(new Uint8Array(Buffer.from(message, "hex")));
      tx = new VersionedTransaction(msgObj);
    } else tx = VersionedTransaction.deserialize(new Uint8Array(Buffer.from(message, "hex")));
    return this.transfer(tx, req);
  }

  private getNetworkProviderState(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>, _: unknown, end: () => void) {
    res.result = {
      accounts: this.keyringController.getPublicKeys(),
      chainId: this.networkController.state.chainId,
      isUnlocked: !!this.selectedAddress,
    };
    end();
  }

  private fastLogin() {
    this.preferencesController.storeUserLogin({
      verifier: this.userInfo.verifier,
      verifierId: this.userInfo.verifierId,
      address: this.selectedAddress,
      options: {
        calledFromEmbed: true,
        rehydrate: false,
      },
    });

    return this.selectedAddress;
  }

  private async requestAccounts(req: JRPCRequest<unknown>): Promise<string[]> {
    // Try to restore from backend (restore privatekey)
    this.embedController.update({ loginInProgress: true });

    const openloginInstance = await OpenLoginFactory.getInstance(true);
    const result = await OpenLoginFactory.computeAccount().catch((err) => {
      log.error(err);
      return null;
    });
    // rehydration
    if (result?.accounts.length) {
      const userDapp = new Map();
      const addAccountPromises = result.accounts.map(async (account) => {
        userDapp.set(account.address, account.app);

        const address = await this.addAccount(
          account.solanaPrivKey,
          {
            email: "",
            name: "",
            profileImage: "",
            ...openloginInstance.getUserInfo(),
          },
          true
        );
        return address;
      });
      this.update({
        UserDapp: userDapp,
      });
      // await Promise.all(addAccountPromises);
      const address = await addAccountPromises[result.matchedDappHost];
      await this.setSelectedAccount(address);
    }

    this.embedController.update({ loginInProgress: false });
    return new Promise((resolve, reject) => {
      const [requestedLoginProvider, login_hint] = req.params as string[];
      const currentLoginProvider = this.getAccountPreferences(this.selectedAddress)?.userInfo.typeOfLogin;
      log.info(currentLoginProvider);
      if (requestedLoginProvider) {
        if (requestedLoginProvider === currentLoginProvider && this.hasSelectedPrivateKey) {
          const address = this.fastLogin();
          resolve([address]);
        } else {
          // To login with the requested provider
          // On Embed, we have a window waiting... we need to tell it to login
          this.embedController.update({
            loginInProgress: true,
            oauthModalVisibility: false,
          });
          this.triggerLogin({
            loginProvider: requestedLoginProvider as LOGIN_PROVIDER_TYPE,
            login_hint,
          });
          this.once("LOGIN_RESPONSE", (error: string, address: string) => {
            this.embedController.update({
              loginInProgress: false,
              oauthModalVisibility: false,
            });
            if (error) reject(new Error(error));
            else resolve([address]);
          });
        }
      } else if (this.hasSelectedPrivateKey) {
        const address = this.fastLogin();
        resolve([address]);
      } else {
        // We show the modal to login
        this.embedController.update({
          loginInProgress: true,
          oauthModalVisibility: true,
        });
        this.once("LOGIN_RESPONSE", (error: string, address: string) => {
          this.embedController.update({
            loginInProgress: false,
            oauthModalVisibility: false,
          });
          if (error) reject(new Error(error));
          else resolve([address]);
        });
      }
    });
  }

  private async getCommProviderState(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>, _: unknown, end: () => void) {
    res.result = {
      currentLoginProvider: this.getAccountPreferences(this.selectedAddress)?.userInfo.typeOfLogin || "",
      isLoggedIn: this.hasSelectedPrivateKey,
    };
    end();
  }

  private async topup(req: JRPCRequest<TopupInput>) {
    return this.embedhandleTopUp(req);
  }

  private async getWalletInstanceId(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>, _: unknown, end: () => void) {
    // set DappOrign with instanceId key for dappStorageKey restoration
    sessionStorage.setItem(this.instanceId, this.origin);
    res.result = this.instanceId;
    end();
  }

  private async getUserInfo(req: JRPCRequest<unknown>, res: JRPCResponse<unknown>, _: unknown, end: () => void) {
    res.result = normalizeJson<UserInfo>(this.userInfo);
    end();
  }

  private async loginWithPrivateKey(req: Ihandler<LoginWithPrivateKeyParams>): Promise<{ success: boolean }> {
    if (!req.params?.privateKey) throw new Error("Invalid Private Key");

    const userInfo = req.params?.userInfo;
    // Do not need this as embed restore trigger moved to on 'requestAccount` called and state save in SessionStorage
    const publicKey = await this.addAccount(req.params?.privateKey, req.params?.userInfo);
    this.setSelectedAccount(publicKey);

    if (!this.hasSelectedPrivateKey) throw new Error("Waller Error");

    const privateKey = Buffer.from(base58.decode(req.params?.privateKey)).toString("hex");

    const openLoginHandler = await OpenLoginFactory.getInstance();
    const { sessionId: openloginSessionId, state: openloginState } = openLoginHandler;
    // this is import private key into torus wallet
    if (openloginSessionId && openloginState.ed25519PrivKey === privateKey) {
      const store = openloginState?.userInfo || {};
      const sessionData = {
        ...openloginState,
        userInfo: {
          ...store,
          ...userInfo,
        },
      };
      await updateSession(sessionData);
    } else {
      // login with private key from torus wallet plugin
      const sessionId = OpenloginSessionManager.generateRandomSessionKey();
      const sessionData = {
        ed25519PrivKey: privateKey,
        sessionId,
        userInfo: {
          isPlugin: true,
          ...userInfo,
        },
      };
      openLoginHandler.state = sessionData;
      await createSession(sessionId, sessionData);
    }

    this.engine?.emit("notification", {
      method: PROVIDER_NOTIFICATIONS.UNLOCK_STATE_CHANGED,
      params: {
        accounts: [publicKey],
        isUnlocked: true,
      },
    });
    this.communicationEngine?.emit("notification", {
      method: COMMUNICATION_NOTIFICATIONS.USER_LOGGED_IN,
      params: {
        currentLoginProvider: this.getAccountPreferences(this.selectedAddress)?.userInfo.typeOfLogin || "",
      },
    });
    log.info(publicKey);
    return { success: true };
  }

  private initializeProvider() {
    const providerHandlers: IProviderHandlers = {
      version: PKG.version,
      requestAccounts: this.providerRequestAccounts.bind(this),

      // Expose no accounts if this origin has not been approved, preventing
      // account-requiring RPC methods from completing successfully
      // only show address if account is unlocked
      getAccounts: this.getAccounts.bind(this),
      signMessage: this.signMessage.bind(this),
      signTransaction: this.providerSignTransaction.bind(this),
      signAllTransactions: this.providerSignAllTransaction.bind(this),
      sendTransaction: this.sendTransaction.bind(this),
      getProviderState: this.getNetworkProviderState.bind(this),
      getGaslessPublicKey: this.getGaslessPublicKey.bind(this),
    };
    return this.networkController.initializeProvider(providerHandlers);
  }

  private initializeCommunicationProvider() {
    const commProviderHandlers: ICommunicationProviderHandlers = {
      setIFrameStatus: this.setIFrameStatus.bind(this),
      changeProvider: this.changeProvider.bind(this),
      logout: this.logout.bind(this),
      getUserInfo: this.getUserInfo.bind(this),
      getWalletInstanceId: this.getWalletInstanceId.bind(this),
      topup: this.topup.bind(this),
      handleWindowRpc: this.communicationManager.handleWindowRpc,
      getProviderState: this.getCommProviderState.bind(this),
      loginWithPrivateKey: this.loginWithPrivateKey.bind(this),
      showCheckout: () => {
        throw new Error("Unsupported method");
      },
      showWalletConnect: () => {
        throw new Error("Unsupported method");
      },
      showWalletUi: () => {
        throw new Error("Unsupported method");
      },
      showWindowBlockAlert: () => {
        throw new Error("Unsupported method");
      },
      loginWithSessionId(req: Ihandler<[string, string]>): Promise<{ success: boolean }> {
        throw new Error("Function not implemented.");
      },
      showSwap(
        // eslint-disable-next-line to ignore the next line.
        _req: JRPCRequest<BaseEmbedControllerState["showCheckout"]>,
        _res: JRPCResponse<boolean>,
        _next: JRPCEngineNextCallback,
        _end: JRPCEngineEndCallback
      ): void {
        throw new Error("Function not implemented.");
      },
    };
    this.embedController.initializeProvider(commProviderHandlers);
  }
}

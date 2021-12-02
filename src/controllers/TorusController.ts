/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, LAMPORTS_PER_SOL, Message, PublicKey, Transaction } from "@solana/web3.js";
import {
  BaseConfig,
  BaseController,
  BaseEmbedController,
  BaseEmbedControllerState,
  BillboardEvent,
  BROADCAST_CHANNELS,
  COMMUNICATION_NOTIFICATIONS,
  CommunicationWindowManager,
  ContactPayload,
  createLoggerMiddleware,
  createOriginMiddleware,
  DEFAULT_PREFERENCES,
  FEATURES_CONFIRM_WINDOW,
  FEATURES_DEFAULT_WALLET_WINDOW,
  FEATURES_PROVIDER_CHANGE_WINDOW,
  getPopupFeatures,
  ICommunicationProviderHandlers,
  PaymentParams,
  PopupHandler,
  PopupWithBcHandler,
  PROVIDER_NOTIFICATIONS,
  providerAsMiddleware,
  ProviderConfig,
  SafeEventEmitterProvider,
  THEME,
  TopupInput,
  TransactionState,
  TransactionStatus,
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
  SolanaToken,
  TokenInfoController,
  TokensTrackerController,
  TransactionController,
} from "@toruslabs/solana-controllers";
import { BigNumber } from "bignumber.js";
import { cloneDeep } from "lodash-es";
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
import { getRelaySigned, normalizeJson } from "@/utils/helpers";
import { constructTokenData } from "@/utils/instruction_decoder";
import { SolAndSplToken } from "@/utils/interfaces";

import { PKG } from "../const";

const TARGET_NETWORK = "mainnet";

export const DEFAULT_CONFIG = {
  CurrencyControllerConfig: { api: config.api, pollInterval: 600_000 },
  NetworkControllerConfig: { providerConfig: WALLET_SUPPORTED_NETWORKS[TARGET_NETWORK] },
  PreferencesControllerConfig: { pollInterval: 180_000, api: config.api, signInPrefix: "Solana Signin", commonApiHost: config.commonApiHost },
  TransactionControllerConfig: { txHistoryLimit: 40 },
  RelayHost: {
    torus: "https://solana-relayer.tor.us/relayer",
    local: "http://localhost:4422/relayer",
  },
  TokensTrackerConfig: { supportedCurrencies: config.supportedCurrencies },
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
    dappMetadata: {
      name: "",
      icon: "",
    },
  },
  TokensTrackerState: { tokens: undefined, splTokens: {} },
  TokenInfoState: { tokenInfoMap: {}, tokenTickerMap: {}, metaplexMetaMap: {}, tokenPriceMap: {} },
  RelayMap: {},
  RelayKeyHostMap: {},
};

export default class TorusController extends BaseController<TorusControllerConfig, TorusControllerState> {
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

  get tokens(): { [address: string]: SolanaToken[] } {
    return this.tokensTracker.state.tokens || {};
  }

  get conversionRate(): number {
    return this.currencyController.state.conversionRate;
  }

  get userInfo(): UserInfo {
    return this.preferencesController.state.identities[this.selectedAddress]?.userInfo || cloneDeep(DEFAULT_PREFERENCES.userInfo);
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

  get privateKey(): string {
    return this.keyringController.state.wallets.find((keyring) => keyring.address === this.selectedAddress)?.privateKey || "private_key_undefined";
  }

  get embedLoginInProgress(): boolean {
    return this.embedController?.state.loginInProgress || false;
  }

  get embedOauthModalVisibility(): boolean {
    return this.embedController?.state.oauthModalVisibility || false;
  }

  get embedIsIFrameFullScreen(): boolean {
    return this.embedController?.state.isIFrameFullScreen || false;
  }

  get connection(): Connection {
    // return await getSolanaConnection(this.networkController._providerProxy);
    return new Connection(this.networkController.getProviderConfig().rpcTarget);
  }

  /**
   * Always call init function before using this controller
   */
  public init({ _config, _state }: { _config: Partial<TorusControllerConfig>; _state: Partial<TorusControllerState> }): void {
    log.info(_config, _state, "restoring config & state");
    this.initialize();
    this.configure(_config, true, true);
    this.update(_state, true);
    this.networkController = new NetworkController({ config: this.config.NetworkControllerConfig, state: this.state.NetworkControllerState });
    this.initializeProvider();
    this.embedController = new BaseEmbedController({ config: {}, state: this.state.EmbedControllerState });
    this.initializeCommunicationProvider();

    this.tokenInfoController = new TokenInfoController({
      provider: this.networkController._providerProxy,
    });
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
      getTokenInfo: (mintAddress: string) => this.tokenInfoController.state.tokenInfoMap[mintAddress],
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
      getTokenInfo: (mintAddress: string) => this.tokenInfoController.state.tokenInfoMap[mintAddress],
      getMetaplexData: this.tokenInfoController.getMetaplexData.bind(this.tokenInfoController),
      getIdentities: () => this.preferencesController.state.identities,
      onPreferencesStateChange: (listener) => this.preferencesController.on("store", listener),
    });

    this.txController.on(TX_EVENTS.TX_UNAPPROVED, ({ txMeta, req }) => {
      log.info(req);
      this.emit(TX_EVENTS.TX_UNAPPROVED, { txMeta, req });
    });

    this.networkController._blockTrackerProxy.on("latest", () => {
      if (this.preferencesController.state.selectedAddress) {
        // this.preferencesController.sync(this.preferencesController.state.selectedAddress);
        this.preferencesController.updateDisplayActivities();
        this.tokensTracker.fetchSolTokens();
        this.accountTracker.refresh();
      }
    });

    // ensure accountTracker updates balances after network change
    this.networkController.on("networkDidChange", async () => {
      log.info("network changed");
      if (this.selectedAddress) {
        // Get latest metaplex data
        // this.tokenInfoController.initializeMetaPlexInfo(this.selectedAddress);
        // this.tokenInfoController.updateMetaData()
        this.preferencesController.initializeDisplayActivity();
        log.info(this.tokenInfoController.state);
      }

      this.engine?.emit("notification", {
        method: PROVIDER_NOTIFICATIONS.CHAIN_CHANGED,
        params: {
          chainId: this.networkController.state.chainId,
        },
      });
    });

    this.networkController.lookupNetwork();

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

    this.tokensTracker.on("store", (state2) => {
      this.update({ TokensTrackerState: state2 });
      // log.info(state2.tokens[this.selectedAddress]);
      this.tokenInfoController.updateMetaData(state2.tokens[this.selectedAddress]);
      this.tokenInfoController.updateTokenPrice(state2.tokens[this.selectedAddress]);
    });

    this.tokenInfoController.on("store", (state2) => {
      this.update({ TokenInfoState: state2 });
    });
    this.keyringController.on("store", (state2) => {
      this.update({ KeyringControllerState: state2 });
    });

    this.txController.on("store", (state2: TransactionState<Transaction>) => {
      this.update({ TransactionControllerState: state2 });
      Object.keys(state2.transactions).forEach((txId) => {
        if (state2.transactions[txId].status === TransactionStatus.submitted) {
          // Check if token transfer
          const tokenTransfer = constructTokenData(
            state2.transactions[txId].rawTransaction,
            this.tokensTracker.state.tokens ? this.tokensTracker.state.tokens[this.selectedAddress] : []
          );

          this.preferencesController.patchNewTx(state2.transactions[txId], this.selectedAddress, tokenTransfer).catch((err) => {
            log.error("error while patching a new tx", err);
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

  setOrigin(origin: string): void {
    this.preferencesController.setIframeOrigin(origin);
  }

  async calculateTxFee(): Promise<{ b_hash: string; fee: number }> {
    const conn = new Connection(this.state.NetworkControllerState.providerConfig.rpcTarget);
    const b_hash = (await conn.getRecentBlockhash("finalized")).blockhash;
    const fee = (await conn.getFeeCalculatorForBlockhash(b_hash)).value?.lamportsPerSignature || 0;
    return { b_hash, fee };
  }

  async approveSignTransaction(txId: string): Promise<void> {
    await this.txController.approveSignTransaction(txId, this.state.PreferencesControllerState.selectedAddress);
  }

  async approveTransaction(txId: string): Promise<void> {
    await this.txController.approveTransaction(txId, this.state.PreferencesControllerState.selectedAddress);
  }

  async transfer(tx: Transaction, req?: Ihandler<{ message: string }>): Promise<string> {
    const conn = new Connection(this.networkController.state.providerConfig.rpcTarget);
    const signedTransaction = await this.txController.addSignTransaction(tx, req);
    await signedTransaction.result;
    try {
      // serialize transaction
      let serializedTransaction = signedTransaction.transactionMeta.transaction.serialize({ requireAllSignatures: false }).toString("hex");
      const gaslessHost = this.getGaslessHost(tx.feePayer?.toBase58() || "");
      if (gaslessHost) {
        serializedTransaction = await getRelaySigned(gaslessHost, serializedTransaction, tx.recentBlockhash || "");
      }

      // submit onchain
      const signature = await conn.sendRawTransaction(Buffer.from(serializedTransaction, "hex"));

      // attach necessary info and update controller state
      signedTransaction.transactionMeta.transactionHash = signature;
      signedTransaction.transactionMeta.rawTransaction = serializedTransaction;
      this.txController.setTxStatusSubmitted(signedTransaction.transactionMeta.id);
      return signature;
    } catch (error) {
      log.warn("error while submiting transaction", error);
      this.txController.setTxStatusFailed(signedTransaction.transactionMeta.id, error as Error);
      throw error;
    }
  }

  async transferSpl(receiver: string, amount: number, selectedToken: SolAndSplToken): Promise<string> {
    const tokenMintAddress = selectedToken.mintAddress;
    const connection = new Connection(this.networkController.state.providerConfig.rpcTarget);
    const transaction = new Transaction();
    const decimals = selectedToken.balance?.decimals || 9;
    const mintAccount = new PublicKey(tokenMintAddress);
    const signer = new PublicKey(this.selectedAddress);
    const sourceAccount = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mintAccount, signer);
    const receiverAccount = new PublicKey(receiver);
    let assocAccount = new PublicKey(receiver);
    try {
      assocAccount = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        new PublicKey(tokenMintAddress),
        receiverAccount
      );
    } catch (e) {
      log.info("error generating assoc, account passed is possible assocAccount");
    }

    const receiverAccountInfo = await connection.getAccountInfo(assocAccount);

    if (receiverAccountInfo?.owner?.toString() === TOKEN_PROGRAM_ID.toString()) {
      const transferInsturction = Token.createTransferCheckedInstruction(
        TOKEN_PROGRAM_ID,
        sourceAccount,
        mintAccount,
        assocAccount,
        signer,
        [],
        amount,
        decimals
      );
      transaction.add(transferInsturction);
    } else {
      // Not a Token Account (associcate Account)
      // address is a wallet pub key

      const catai = await Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        new PublicKey(tokenMintAddress),
        assocAccount,
        receiverAccount,
        new PublicKey(this.selectedAddress)
      );
      transaction.add(catai);

      const transferInsturction = Token.createTransferCheckedInstruction(
        TOKEN_PROGRAM_ID,
        sourceAccount,
        mintAccount,
        assocAccount,
        signer,
        [],
        amount,
        decimals
      );
      transaction.add(transferInsturction);
    }

    transaction.recentBlockhash = (await connection.getRecentBlockhash("finalized")).blockhash;
    const res = await this.transfer(transaction);
    return res;
  }

  getGaslessHost(feePayer: string): string | undefined {
    if (!feePayer || feePayer === this.selectedAddress) return undefined;

    const relayHost = this.state.RelayKeyHostMap[feePayer];
    if (relayHost) {
      return `${relayHost}/partial_sign`;
    }
    throw new Error("Invalid Relay");
  }

  async addAccount(privKey: string, userInfo: UserInfo): Promise<string> {
    const paddedKey = privKey.padStart(64, "0");
    const address = this.keyringController.importAccount(paddedKey);
    await this.preferencesController.initPreferences({
      address,
      calledFromEmbed: false,
      userInfo,
    });
    return address;
  }

  setSelectedAccount(address: string): void {
    this.preferencesController.setSelectedAddress(address);
    this.preferencesController.sync(address);
    this.preferencesController.initializeDisplayActivity();
  }

  async setCurrentCurrency(currency: string): Promise<void> {
    const { ticker } = this.networkController.getProviderConfig();
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

  async setDefaultCurrency(currency: string): Promise<boolean> {
    const { ticker } = this.networkController.getProviderConfig();
    // This is SOL
    this.currencyController.setNativeCurrency(ticker);
    // This is USD
    this.currencyController.setCurrentCurrency(currency);
    await this.currencyController.updateConversionRate();
    return this.preferencesController.setSelectedCurrency({ selectedCurrency: currency });
  }

  async setLocale(locale: string): Promise<boolean> {
    return this.preferencesController.setUserLocale(locale);
  }

  async getBillboardData(): Promise<BillboardEvent[]> {
    return this.preferencesController.getBillBoardData();
  }

  setIFrameStatus(req: JRPCRequest<{ isIFrameFullScreen: boolean; rid?: string }>): void {
    const { isIFrameFullScreen = false, rid } = req.params || {};
    this.embedController.update({
      isIFrameFullScreen,
    });

    if (rid) this.emit(rid);
  }

  logout(req: JRPCRequest<[]>, res: JRPCResponse<boolean>, _: JRPCEngineNextCallback, end: JRPCEngineEndCallback): void {
    this.handleLogout();
    res.result = true;
    end();
  }

  public handleLogout(): void {
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
    const finalUrl = new URL(`${config.baseRoute}${path}?instanceId=${instanceId}`);
    const walletPopupWindow = new PopupHandler({
      config: {
        features: getPopupFeatures(FEATURES_DEFAULT_WALLET_WINDOW),
      },
      state: { url: finalUrl },
    });
    walletPopupWindow.open();
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
        features: getPopupFeatures(FEATURES_PROVIDER_CHANGE_WINDOW),
      },
      instanceId: channelName,
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

  async handleTransactionPopup(txId: string, req: JRPCRequest<{ message: string }> & { origin: string; windowId: string }): Promise<void> {
    try {
      const { windowId } = req;
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
          features: getPopupFeatures(FEATURES_CONFIRM_WINDOW),
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
      const { windowId } = req;
      log.info(windowId);
      const channelName = `${BROADCAST_CHANNELS.TRANSACTION_CHANNEL}_${windowId}`;
      const finalUrl = new URL(`${config.baseRoute}confirm_message?instanceId=${windowId}&integrity=true&id=${windowId}`);
      log.info(req);
      // debugger;

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
      return approve;
    } catch (error) {
      log.error(error);
      return false;
    }
  }

  async embedhandleTopUp(req: JRPCRequest<TopupInput>): Promise<boolean> {
    const windowId = req.params?.windowId;
    const params = req.params?.params || {};
    return this.handleTopUp(params, windowId);
  }

  async handleTopUp(params: PaymentParams, windowId?: string): Promise<boolean> {
    try {
      const instanceId = windowId || this.getWindowId();

      const parameters = {
        userAddress: params.selectedAddress || this.selectedAddress || undefined,
        userEmailAddress: this.state.PreferencesControllerState.identities[this.selectedAddress].userInfo.email || undefined,
        swapAsset: params.selectedCryptoCurrency || "SOLANA_SOL" || undefined,
        swapAmount: params.cryptoAmount || undefined,
        fiatValue: params.fiatValue || undefined,
        fiatCurrency: params.selectedCurrency || undefined,
        variant: "hosted-auto",
        webhookStatusUrl: `${config.rampApiHost}/transaction`,
        hostUrl: "https://app.tor.us",
        hostLogoUrl: "https://app.tor.us/images/torus-logo-blue.svg",
        hostAppName: "Torus",
        hostApiKey: config.rampAPIKEY,
        finalUrl: `${config.baseRoute}redirect?instanceId=${instanceId}&topup=success`, // redirect url
      };

      // const redirectUrl = new URL(`${config.baseRoute}/redirect?instanceId=${windowId}&integrity=true&id=${windowId}`);
      const parameterString = new URLSearchParams(JSON.parse(JSON.stringify(parameters)));
      const finalUrl = new URL(`${config.rampHost}?${parameterString.toString()}`);

      // testnet
      // const finalUrl = new URL(`https://ri-widget-staging.firebaseapp.com/?${parameterString.toString()}`);

      log.info(windowId);
      const channelName = `${BROADCAST_CHANNELS.REDIRECT_CHANNEL}_${instanceId}`;

      const topUpPopUpWindow = new PopupWithBcHandler({
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
      await topUpPopUpWindow.handle();
      return true;
      // debugger;
    } catch (err) {
      log.error(err);
      throw err;
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
        extraLoginOptions: login_hint ? { login_hint } : {},
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

  getWindowId = (): string => Math.random().toString(36).slice(2);

  private initializeProvider() {
    const providerHandlers: IProviderHandlers = {
      version: PKG.version,
      requestAccounts: async (req) => {
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
          return this.keyringController.signMessage(data, this.selectedAddress);
        }
        throw new Error("User Rejected");
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
        return this.transfer(tx, req);
      },
      getProviderState: (req, res, _, end) => {
        res.result = {
          accounts: this.keyringController.getPublicKeys(),
          chainId: this.networkController.state.chainId,
          isUnlocked: !!this.selectedAddress,
        };
        end();
      },
      getGaslessPublicKey: async () => {
        const relayPublicKey = this.state.RelayMap.torus;
        if (!relayPublicKey) throw new Error("Invalid Relay");
        return relayPublicKey;
      },
    };
    return this.networkController.initializeProvider(providerHandlers);
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
      } else if (this.selectedAddress) resolve([this.selectedAddress]);
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
    });
  }

  private initializeCommunicationProvider() {
    const commProviderHandlers: ICommunicationProviderHandlers = {
      setIFrameStatus: this.setIFrameStatus.bind(this),
      changeProvider: this.changeProvider.bind(this),
      logout: this.logout.bind(this),
      getUserInfo: (req, res, _, end) => {
        res.result = normalizeJson<UserInfo>(this.userInfo);
        end();
      },
      getWalletInstanceId: () => {
        return "";
      },
      topup: async (req) => {
        return this.embedhandleTopUp(req);
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
}

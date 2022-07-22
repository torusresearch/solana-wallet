import { NameRegistryState } from "@solana/spl-name-service";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { BaseEmbedController, KeyPair, PAYMENT_PROVIDER_TYPE, PopupHandler, PopupWithBcHandler } from "@toruslabs/base-controllers";
import eccrypto from "@toruslabs/eccrypto";
import OpenLogin from "@toruslabs/openlogin";
import { BasePostMessageStream, JRPCEngine, SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
// import * as OpenLoginMethods from "@toruslabs/openlogin";
import {
  AccountTrackerController,
  CurrencyController,
  KeyringController,
  NetworkController,
  PreferencesController,
  SUPPORTED_NETWORKS,
  TokenInfoController,
  TokensTrackerController,
  TransactionController,
} from "@toruslabs/solana-controllers";
import nacl from "@toruslabs/tweetnacl-js";
import assert from "assert";
// import {  } from 'mocha';
import base58 from "bs58";
import { cloneDeep } from "lodash-es";
import log from "loglevel";
import nock from "nock";
import sinon from "sinon";

import OpenLoginFactory from "@/auth/OpenLogin";
import OpenLoginHandler from "@/auth/OpenLoginHandler";
import config from "@/config";
import TorusController, { DEFAULT_STATE } from "@/controllers/TorusController";
// import { app } from "@/modules/app";
import controllerModule from "@/modules/controllers";
import { KeyState } from "@/utils/enums";
import * as helper from "@/utils/helpers";
import { SolAndSplToken } from "@/utils/interfaces";
import * as SolanaHelper from "@/utils/solanaHelpers";
import TorusStorageLayer from "@/utils/tkey/storageLayer";
import { TOPUP } from "@/utils/topup";

import { accountInfoPromise, mockGetConnection, mockMintAddress, mockMintInfo } from "./mockConnection";
import { mockData, openloginFaker, sampleDapps, sampleEvent, sampleToken, sKeyPair } from "./mockData";
import nockRequest from "./nockRequest";

describe("Controller Module", () => {
  const sandbox = sinon.createSandbox();
  let clock: sinon.SinonFakeTimers; //=

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const noopAsync = async () => {};
  let popupResult = { approve: true };
  let popupStub: sinon.SinonStub;
  // let addToStub: sinon.SinonStub;
  // let storageAvailableSpy: sinon.SinonSpy<[type: string], boolean>;

  let spyAccountTracker: sinon.SinonSpy;
  // let spyApproveSignTransaction: sinon.SinonSpy;
  let spyPrefIntializeDisp: sinon.SinonSpy;

  // init once only
  controllerModule.init({ state: cloneDeep(DEFAULT_STATE), origin: "https://localhost:8080/" });
  beforeEach(async () => {
    nockRequest();

    // Stubing Openlogin
    sandbox.stub(config, "baseUrl").get(() => "http://localhost:8080/");
    sandbox.stub(config, "baseRoute").get(() => "http://localhost:8080/");
    sandbox.stub(config, "torusNetwork").get(() => "mainnet");
    sandbox.stub(OpenLogin.prototype, "init").callsFake(noopAsync);
    sandbox.stub(OpenLogin.prototype, "logout").callsFake(noopAsync);
    sandbox.stub(OpenLogin.prototype, "_syncState").callsFake(noopAsync);
    sandbox.stub(TorusStorageLayer.prototype, "getMetadata").callsFake(async () => {
      return openloginFaker[1];
    });
    // storageAvailableSpy = sandbox.spy(OpenLoginMethods, "storageAvailable");
    sandbox.stub(OpenLogin.prototype, "_getData").callsFake(async () => {
      return {};
    });
    sandbox.stub(TokenInfoController.prototype, "fetchMetaplexNFTs").callsFake(async () => {
      return {};
    });

    sandbox.stub(OpenLoginFactory, "getInstance").callsFake(async () => {
      return { state: {} } as OpenLogin;
    });
    sandbox.stub(OpenLoginHandler.prototype, "handleLoginWindow").callsFake(async (_) => {
      return mockData.openLoginHandler;
    });
    sandbox.stub(PopupWithBcHandler.prototype, "handle").callsFake(async (data) => {
      return data;
    });

    // mock popup handler
    popupStub = sandbox.stub(PopupWithBcHandler.prototype, "handleWithHandshake").callsFake(async (_payload: unknown) => {
      return popupResult;
    });
    log.info({ popupStub });
    // add sinon method stubs & spies on Controllers and TorusController
    sandbox.stub(NetworkController.prototype, "getConnection").callsFake(mockGetConnection);
    spyAccountTracker = sandbox.spy(AccountTrackerController.prototype, "refresh");
    // spyApproveSignTransaction = sandbox.spy(TransactionController.prototype, "approveSignTransaction");
    spyPrefIntializeDisp = sandbox.spy(PreferencesController.prototype, "initializeDisplayActivity");
    // addToStub = sandbox.spy(app.value.toastMessages, "addToast");
    // currencyScheduleSpy = sandbox.spy(CurrencyController.prototype, "scheduleConversionInterval");

    // init
    // controllerModule.torus = new TorusController({ _config: cloneDeep(DEFAULT_CONFIG), _state: cloneDeep(DEFAULT_STATE) });
    // controllerModule.init({ state: cloneDeep(DEFAULT_STATE), origin: "https://localhost" });
    controllerModule.logout();
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    nock.cleanAll();
    sandbox.restore();
    clock.restore();
  });

  describe("#importCustomToken", async () => {
    await controllerModule.triggerLogin({ loginProvider: "google" });
    controllerModule.torus.setSelectedAccount(sKeyPair[0].publicKey.toBase58());
  });

  // Initialization
  describe("#Initialization, login logout flow", () => {
    it("embed is full screeen", async () => {
      sandbox.stub(BaseEmbedController.prototype, "state").returns({ isIFrameFullScreen: false });
      const { embedIsIFrameFullScreen } = controllerModule.torus;
      assert.equal(embedIsIFrameFullScreen, false);
    });
    it("importCustomToken", async () => {
      // sandbox.stub(TokenInfoController.prototype, "getConnection").callsFake(mockGetConnection);
      // controllerModule.torus.tokenInfoController;
      sandbox.stub(TokenInfoController.prototype, "fetchTokenInfo").callsFake(async () => {
        return {};
      });
      // sandbox.stub(TokensTrackerController.prototype, "state").returns(sampleTokens);
      // sandbox.stub(NetworkController.prototype, "getConnection").callsFake();
      // const updateTokenInfoSpy = sandbox.spy(TokenInfoController.prototype, "updateTokenInfoMap");
      const result: any = await controllerModule.torus.importCustomToken({
        address: "5RA64XFTwfAaZLqNvJoFsNMcCQRdEd4kzGTd9c276VjK",
        name: "test",
        network: "testnet",
        publicAddress: sKeyPair[0].publicKey.toBase58(),
        symbol: "tst",
      });
      // assert(updateTokenInfoSpy.calledOnce);
      // assert(importTokenInfoSpy.calledOnce);
      assert.equal(true, result.success);
    });
    it("fetchTokenInfo", async () => {
      const tokenMint = "E4nC2ThDznHgwdFEPyze8p9U28ueRuomx8o3MTgNM7yz";
      const result = await controllerModule.torus.fetchTokenInfo(tokenMint);
      assert.deepEqual(result, sampleToken);
    });
    it("setOrigin", async () => {
      const origin = "http://localhost:3001";
      const setIframeOriginSpy = sandbox.spy(PreferencesController.prototype, "setIframeOrigin");
      await controllerModule.torus.setOrigin(origin);
      assert(setIframeOriginSpy.calledWith(origin));
      assert(controllerModule.torus.origin, origin);
    });
    it("embed is full screen", async () => {
      const updateEmbedSpy = sandbox.spy(BaseEmbedController.prototype, "update");
      const eventEmitSpy = sandbox.spy(SafeEventEmitter.prototype, "emit");
      const windowId = helper.getRandomWindowId();
      controllerModule.torus.setIFrameStatus({
        method: "iframe_status",
        params: {
          isIFrameFullScreen: true,
          rid: windowId,
        },
      });
      const { embedIsIFrameFullScreen } = controllerModule.torus;
      assert.equal(embedIsIFrameFullScreen, true);
      assert(updateEmbedSpy.calledWith({ isIFrameFullScreen: true }));
      assert(eventEmitSpy.calledWith(windowId));
    });
    it("closeIframeFullScreen", async () => {
      // setup comm provider enginer for torus related infos
      await controllerModule.setupCommunication("http://localhost:3001");
      // const engine = controllerModule.torus.communicationManager
      const communicationEngineSpy = sandbox.spy(JRPCEngine.prototype, "emit");
      await controllerModule.torus.closeIframeFullScreen();
      assert(communicationEngineSpy.calledOnce);
    });
    it("handleLogout", async () => {
      const communicationEngineSpy = sandbox.spy(JRPCEngine.prototype, "emit");
      const eventEmitSpy = sandbox.spy(SafeEventEmitter.prototype, "emit");
      await controllerModule.torus.handleLogout();
      assert(eventEmitSpy.calledWith("logout"));
      assert(communicationEngineSpy.calledThrice);
    });
    it("toggleIframeFullScreen", async () => {
      const communicationEngineSpy = sandbox.spy(JRPCEngine.prototype, "emit");
      await controllerModule.torus.toggleIframeFullScreen();
      const { embedIsIFrameFullScreen } = controllerModule.torus;
      assert.equal(embedIsIFrameFullScreen, false);
      assert(communicationEngineSpy.calledOnce);
    });

    it("showWalletPopup", async () => {
      const openPopupSpy = sandbox.spy(PopupHandler.prototype, "open");
      await controllerModule.torus.showWalletPopup("http://localhost:3000", "2123");
      assert(openPopupSpy.calledOnce);
    });

    it("hideOAuthModal", async () => {
      await controllerModule.torus.hideOAuthModal();
      const { oauthModalVisibility } = controllerModule.torus.state.EmbedControllerState;
      assert.equal(controllerModule.torus.embedOauthModalVisibility, false);
      assert.deepEqual(oauthModalVisibility, false);
    });

    it("loginFromWidgetButton", async () => {
      const communicationEngineSpy = sandbox.spy(JRPCEngine.prototype, "emit");
      await controllerModule.torus.loginFromWidgetButton();
      const { embedIsIFrameFullScreen } = controllerModule.torus;
      assert.equal(embedIsIFrameFullScreen, false);
      assert(communicationEngineSpy.calledOnce);
    });

    it("refreshUserTokens", async () => {
      sinon.stub(CurrencyController.prototype, "scheduleConversionInterval").callsFake(noopAsync);
      sinon.stub(CurrencyController.prototype, "updateConversionRate").callsFake(noopAsync);
      // const updateConversionSpy = sinon.spy(CurrencyController.prototype, "updateConversionRate");
      await controllerModule.torus.refreshUserTokens();
      // assert(updateConversionSpy.calledOnce);
    });

    it("trigger login/logout flow", async () => {
      const account = await accountInfoPromise;
      sandbox.stub(mockData, "openLoginHandler").get(() => openloginFaker[0]);
      const setIframeOriginSpy = sandbox.spy(PreferencesController.prototype, "setIframeOrigin");

      assert.deepStrictEqual(controllerModule.torusState.AccountTrackerState.accounts, {});
      assert.deepStrictEqual(controllerModule.torusState.KeyringControllerState.wallets, []);

      await controllerModule.triggerLogin({ loginProvider: "google" });

      assert(spyPrefIntializeDisp.calledOnce);
      assert(spyAccountTracker.calledOnce);

      // validate login state
      const checkIdentities = controllerModule.torusState.PreferencesControllerState.identities[sKeyPair[0].publicKey.toBase58()];

      assert.deepStrictEqual(checkIdentities.userInfo, mockData.openLoginHandler.userInfo);
      assert.equal(controllerModule.torusState.KeyringControllerState.wallets.length, 1);
      assert.equal((controllerModule.torusState.KeyringControllerState.wallets[0] as KeyPair).publicKey, sKeyPair[0].publicKey.toBase58());
      assert.equal((controllerModule.torusState.KeyringControllerState.wallets[0] as KeyPair).privateKey, base58.encode(sKeyPair[0].secretKey));
      assert.equal(controllerModule.selectedAddress, sKeyPair[0].publicKey.toBase58());
      assert.equal(controllerModule.solBalance, account[sKeyPair[0].publicKey.toBase58()].lamports / LAMPORTS_PER_SOL);
      assert.equal(controllerModule.torus.userSOLBalance, account[sKeyPair[0].publicKey.toBase58()].lamports / LAMPORTS_PER_SOL);
      assert.equal(controllerModule.torus.hasKeyPair, true);
      assert.equal(controllerModule.torus.hasSelectedPrivateKey, true);
      assert.equal(controllerModule.torus.privateKey, base58.encode(sKeyPair[0].secretKey));
      assert.deepEqual(controllerModule.torus.connection, mockGetConnection());
      assert.deepEqual(controllerModule.torus.chainId, SUPPORTED_NETWORKS.mainnet.chainId);
      checkIdentities.contacts.forEach((item, idx) => {
        assert.deepStrictEqual(item, mockData.backend.user.data.contacts[idx]);
      });

      assert.equal(controllerModule.solBalance, account[sKeyPair[0].publicKey.toBase58()].lamports / LAMPORTS_PER_SOL);

      // logout flow
      await controllerModule.logout();
      assert(setIframeOriginSpy.calledWith("http://localhost:3001"));
      // validate logout state
      assert.deepStrictEqual(controllerModule.torusState.AccountTrackerState.accounts, {});
      assert.deepStrictEqual(controllerModule.torusState.KeyringControllerState.wallets, []);
    });
  });

  describe("#Embeded Login Logout flow", () => {
    // const initParams = {
    //   buttonPosition: BUTTON_POSITION.BOTTOM_LEFT,
    //   apiKey: "adsf",
    // };
    // const dappOrigin = "localhost";
    it("login via embed", async () => {
      const accountInfo = await accountInfoPromise;
      assert.equal(Object.keys(controllerModule.torusState.AccountTrackerState.accounts).length, 0);
      assert.equal(controllerModule.torusState.KeyringControllerState.wallets.length, 0);

      const loginResult = controllerModule.torus.provider.sendAsync({
        method: "solana_requestAccounts",
        params: [],
      });
      assert.deepEqual(controllerModule.torus.embedLoginInProgress, false);
      // Frame.vue on click login
      await controllerModule.triggerLogin({ loginProvider: "google" });
      // wait for login complete
      const result = await loginResult;

      // check return array of wallet public key
      assert.deepStrictEqual(result, [sKeyPair[0].publicKey.toBase58()]);

      //  to validate state
      const checkIdentities = controllerModule.torusState.PreferencesControllerState.identities[sKeyPair[0].publicKey.toBase58()];
      assert.deepStrictEqual(checkIdentities.userInfo, mockData.openLoginHandler.userInfo);
      // assert.deepStrictEqual(checkIdentities.contacts, mockData.backend.user.data.contacts);
      assert.equal(controllerModule.torusState.KeyringControllerState.wallets.length, 1);
      assert.equal(controllerModule.torusState.KeyringControllerState.wallets[0].publicKey, sKeyPair[0].publicKey.toBase58());
      assert.equal(controllerModule.torusState.KeyringControllerState.wallets[0].privateKey, base58.encode(sKeyPair[0].secretKey));
      assert.equal(controllerModule.selectedAddress, sKeyPair[0].publicKey.toBase58());
      assert.equal(controllerModule.solBalance, accountInfo[sKeyPair[0].publicKey.toBase58()].lamports / LAMPORTS_PER_SOL);

      const logoutResult = await controllerModule.torus.communicationProvider.sendAsync({
        method: "logout",
        params: [],
      });
      // expect return true
      assert(logoutResult);
      assert.deepStrictEqual(controllerModule.torusState.AccountTrackerState.accounts, {});
      assert.deepStrictEqual(controllerModule.torusState.KeyringControllerState.wallets, []);
    });

    // add account
    it("add newAccount flow", async () => {
      await controllerModule.triggerLogin({ loginProvider: "google" });

      assert.equal(controllerModule.torusState.KeyringControllerState.wallets.length, 1);
      assert(spyPrefIntializeDisp.calledOnce);
      log.info(sKeyPair[3]);
      // await controllerModule.torus.loginWithPrivateKey(base58.encode(sKeyPair[3].secretKey));

      // validate state
      assert.equal(controllerModule.torusState.KeyringControllerState.wallets.length, 1);
      // assert(controllerModule.torusState.KeyringControllerState.wallets.find((wallet) => wallet.address === sKeyPair[3].publicKey.toBase58()));
      assert(controllerModule.torusState.KeyringControllerState.wallets.find((wallet) => wallet.address === sKeyPair[0].publicKey.toBase58()));
      assert.equal(controllerModule.selectedAddress, sKeyPair[0].publicKey.toBase58());

      // controllerModule.setSelectedAccount(sKeyPair[3].publicKey.toBase58());
      // assert(spyPrefIntializeDisp.calledTwice);

      // assert.equal(controllerModule.selectedAddress, sKeyPair[3].publicKey.toBase58());
      // validate getusersolbalance
      // validate token
    });

    // it("login with private key", async () => {
    //   // sinon.stub(window.localStorage, "getItem").callsFake(async(${EPHERMAL_KEY}) => {return {"priv_key":"309c7a8899bead3e43bafbd6a1a6bbd2590153923af39ce457495be626cef17e","pub_key":"0419da9c6df30eaff607039919ee03117534d614972551ebcdee5603d441f6e101eb822067495cd1f8e40e786f7db1311845d042a160b2b12938eb5fded2ab7ddd"}})
    //   await controllerModule.logout();
    //   sandbox.stub(window.localStorage, "getItem").callsFake(() => {
    //     return JSON.stringify({
    //       priv_key: "309c7a8899bead3e43bafbd6a1a6bbd2590153923af39ce457495be626cef17e",
    //       pub_key:
    //         "0419da9c6df30eaff607039919ee03117534d614972551ebcdee5603d441f6e101eb822067495cd1f8e40e786f7db1311845d042a160b2b12938eb5fded2ab7ddd",
    //     });
    //   });
    //   controllerModule.torus.provider.sendAsync({
    //     method: "solana_requestAccounts",
    //     params: [],
    //   });
    //   // assert.equal(loginResult, true);
    //   // const loginResult = controllerModule.torus.provider.sendAsync({
    //   //   method: "solana_requestAccounts",
    //   //   params: [],
    //   // });
    //   const result = await controllerModule.torus.restoreFromBackend();
    //   assert.equal(result, true);
    // });

    it("embedhandleTopUp", async () => {
      await controllerModule.triggerLogin({ loginProvider: "google" });

      const handleTopUpSpy = sandbox.spy(TorusController.prototype, "handleTopup");
      const sampleRequest = {
        method: "topup",
        params: {
          provider: TOPUP.MOONPAY as PAYMENT_PROVIDER_TYPE,
          params: { selectedAddress: "3zLbFcrLPYk1hSdXdy1jcBRpeeXrhC47iCSjdwqsUaf9" },
          windowId: "n8llxj1gnxf",
        },
        id: "05992defa7462673f245ff8e854d24911c18feb938009a445f7db56d19245fb7",
        origin: "http://localhost:3000",
      };
      await controllerModule.torus.communicationProvider.sendAsync(sampleRequest);
      assert(handleTopUpSpy.calledOnce);
    });

    it("setLogoutRequired", async () => {
      await controllerModule.setLogoutRequired(true);
      assert.equal(controllerModule.logoutRequired, true);
    });
    // it("handleTopUp", async () => {
    //   await controllerModule.triggerLogin({ loginProvider: "google" });
    //   controllerModule.torus.setSelectedAccount(sKeyPair[0].publicKey.toBase58());
    //   const sampleRequest = {
    //     method: "topup",
    //     params: {
    //       provider: TOPUP.MOONPAY as PAYMENT_PROVIDER_TYPE,
    //       params: { selectedAddress: "3zLbFcrLPYk1hSdXdy1jcBRpeeXrhC47iCSjdwqsUaf9" },
    //       windowId: "n8llxj1gnxf",
    //     },
    //     id: "05992defa7462673f245ff8e854d24911c18feb938009a445f7db56d19245fb7",
    //     origin: "http://localhost:3000",
    //   };
    //   const result = await controllerModule.handleRedirectFlow({ method: "topup", params: sampleRequest, resolveRoute: "home" });
    //   assert.equal(result, true);
    // });
  });

  // transfer flow
  describe("#Transfer flow", () => {
    const transferInstruction = () => {
      return SystemProgram.transfer({
        fromPubkey: sKeyPair[0].publicKey,
        toPubkey: sKeyPair[1].publicKey,
        lamports: 0.1 * LAMPORTS_PER_SOL,
      });
    };
    beforeEach(async () => {
      await controllerModule.triggerLogin({ loginProvider: "google" });
    });
    // it("setIFrameStatus", async () => {
    //   // const spyUpdate = sandbox.spy(BaseEmbedController.prototype, "update");
    //   const body = {
    //     method: "iframe_status",
    //     params: {
    //       isFullScreen: true,
    //       isIFrameFullScreen: true,
    //       rid: helper.getRandomWindowId(),
    //     },
    //     origin: "http://localhost:3000",
    //   };
    //   await controllerModule.torus.communicationProvider.sendAsync(body);
    //   // assert(spyUpdate.calledOnce);
    //   assert.equal(controllerModule.torus.state.EmbedControllerState.isIFrameFullScreen, true);
    // });
    it("SOL Transfer", async () => {
      assert.equal(Object.keys(controllerModule.torusState.TransactionControllerState.transactions).length, 0);
      assert.equal(controllerModule.selectedNetworkTransactions.length, 0);
      const tx = new Transaction({ recentBlockhash: sKeyPair[0].publicKey.toBase58(), feePayer: sKeyPair[0].publicKey });
      tx.add(transferInstruction());
      const results = await controllerModule.torus.transfer(tx);
      tx.sign(sKeyPair[0]);

      // verify
      assert.equal(results, base58.encode(tx.signature || [1]));
      assert.equal(Object.keys(controllerModule.torusState.TransactionControllerState.transactions).length, 1);
      assert.equal(controllerModule.selectedNetworkTransactions.length, 1);
      // check state
    });
    it("SPL Transfer", async () => {
      assert.equal(Object.keys(controllerModule.torusState.TransactionControllerState.transactions).length, 0);
      assert.equal(controllerModule.selectedNetworkTransactions.length, 0);
      const selectedToken: SolAndSplToken = {
        mintAddress: mockMintAddress[1],
        name: "",
        iconURL: "",
        symbol: "",
        tokenAddress: "",
        isFungible: false,
        balance: { decimals: mockMintInfo[mockMintAddress[1]].decimals, amount: "0", uiAmount: 0, uiAmountString: "0" },
      };
      const splTransaction = await SolanaHelper.generateSPLTransaction(
        sKeyPair[0].publicKey.toBase58(),
        0,
        selectedToken,
        controllerModule.selectedAddress,
        controllerModule.connection
      );
      const result = await controllerModule.torus.transfer(splTransaction);
      assert.equal(Object.keys(controllerModule.torusState.TransactionControllerState.transactions).length, 1);
      assert.equal(controllerModule.selectedNetworkTransactions.length, 1);
      log.info(result);
    });
    // opportunistic update on activities and balance for sol token nft transfer
    // check transaction controller flow
  });

  // Embed API call
  describe("#Embedded Solana API flow", () => {
    const transferInstruction = () => {
      return SystemProgram.transfer({
        fromPubkey: sKeyPair[0].publicKey,
        toPubkey: sKeyPair[1].publicKey,
        lamports: 0.1 * LAMPORTS_PER_SOL,
      });
    };

    beforeEach(async () => {
      // controllerModule.torus = new TorusController({ _config: cloneDeep(DEFAULT_CONFIG), _state: cloneDeep(DEFAULT_STATE) });
      // controllerModule.init({ state: cloneDeep(DEFAULT_STATE), origin: "https://localhost:8080/" });
      sandbox.stub(helper, "isMain").get(() => false);
      await controllerModule.torus.triggerLogin({ loginProvider: "google" });
      sandbox.stub(TorusController.prototype, "conversionRate").get(() => 1);
    });

    // Solana Api
    it("embed sendTransaction flow", async () => {
      const tx = new Transaction({ recentBlockhash: sKeyPair[0].publicKey.toBase58(), feePayer: sKeyPair[0].publicKey }); // Transaction.serialize
      const msg = tx.add(transferInstruction()).serialize({ requireAllSignatures: false }).toString("hex");
      assert.equal(
        Object.keys(controllerModule.torusState.PreferencesControllerState.identities[sKeyPair[0].publicKey.toBase58()].displayActivities).length,
        0
      );
      // validate state before
      const result = await controllerModule.torus.provider.sendAsync({
        method: "send_transaction",
        params: {
          message: msg,
        },
      });

      // validate state after
      assert.equal(
        Object.keys(controllerModule.torusState.PreferencesControllerState.identities[sKeyPair[0].publicKey.toBase58()].displayActivities).length,
        1
      );

      // log.error(result);
      tx.sign(sKeyPair[0]);
      assert.equal(result, base58.encode(tx.signature || [1]));
      assert(popupStub.calledOnce);

      // Reject Transaction
      popupResult = { approve: false };
      assert.rejects(
        async () => {
          await controllerModule.torus.provider.sendAsync({
            method: "send_transaction",
            params: {
              message: msg,
            },
          });
        },
        (_err) => {
          // validate state after reject
          assert(popupStub.calledTwice);
          return true;
        },
        "Send Transaction Rejection does not throw error"
      );
    });

    it("embed signTransaction flow", async () => {
      popupResult = { approve: true };
      const tx = new Transaction({ recentBlockhash: sKeyPair[0].publicKey.toBase58(), feePayer: sKeyPair[0].publicKey }); // Transaction.serialize
      const msg = tx.add(transferInstruction()).serialize({ requireAllSignatures: false });

      assert.equal(Object.keys(controllerModule.torusState.TransactionControllerState.transactions).length, 0);
      const result = await controllerModule.torus.provider.sendAsync({
        method: "sign_transaction",
        params: {
          message: msg,
        },
      });

      tx.sign(sKeyPair[0]);
      assert.equal(result, tx.serialize({ requireAllSignatures: false }).toString("hex"));
      // will not patch activities
      // validate controller
      assert(popupStub.calledOnce);
      assert(
        Object.keys(controllerModule.torusState.PreferencesControllerState.identities[sKeyPair[0].publicKey.toBase58()].displayActivities).length ===
          0
      );
      assert.equal(Object.keys(controllerModule.torusState.TransactionControllerState.transactions).length, 1);

      // Reject Transaction
      popupResult = { approve: false };
      assert.rejects(
        async () => {
          await controllerModule.torus.provider.sendAsync({
            method: "sign_transaction",
            params: {
              message: msg,
            },
          });
          // should not be success
          assert(false);
        },
        (_e) => {
          assert(popupStub.calledTwice);
        }
      );
    });

    it("embed signAllTransaction flow", async () => {
      popupResult = { approve: true };
      const tx = new Transaction({ recentBlockhash: sKeyPair[0].publicKey.toBase58(), feePayer: sKeyPair[0].publicKey }); // Transaction.serialize
      const txs = [1, 2, 3, 4].map(() => tx.add(transferInstruction()));
      const msg = txs.map((item) => item.serialize({ requireAllSignatures: false }).toString("hex"));

      const result = await controllerModule.torus.provider.sendAsync({
        method: "sign_all_transactions",
        params: {
          message: msg,
        },
      });

      // validate state
      assert(popupStub.calledOnce);
      assert.deepStrictEqual(
        result,
        txs.map((item) => {
          item.sign(sKeyPair[0]);
          return item.serialize({ requireAllSignatures: false }).toString("hex");
        })
      );
      // validate txcontroller

      popupResult = { approve: false };
      assert.rejects(
        async () => {
          await controllerModule.torus.provider.sendAsync({
            method: "sign_all_transactions",
            params: {
              message: msg,
            },
          });
          // should not be success
          assert(false);
        },
        (_e) => {
          // validate state
          assert(popupStub.calledTwice);
        }
      );
    });

    it("embed signMessage flow", async () => {
      // mock msg popup handler
      // controllerModule.torus.state.TokensTrackerState[]("usd");
      popupResult = { approve: true };
      const msg = "This is test message";
      const result = await controllerModule.torus.provider.sendAsync({
        method: "sign_message",
        params: {
          data: Buffer.from(msg, "utf8"),
        },
      });
      assert(popupStub.calledOnce);
      assert(nacl.sign.detached.verify(Buffer.from(msg, "utf8"), result as Buffer, sKeyPair[0].publicKey.toBuffer()));

      // reject
      popupResult = { approve: false };
      assert.rejects(
        async () => {
          await controllerModule.torus.provider.sendAsync({
            method: "sign_message",
            params: {
              data: Buffer.from(msg, "utf8"),
            },
          });
          // should not be success
          assert(false);
        },
        (_e) => {
          // validate state
          assert(popupStub.calledTwice);
        }
      );
    });

    it("gasless transaction (dapp as feepayer) flow", async () => {
      // no internal relayer for now, using dapp relayer's fee payer
      const tx = new Transaction({ recentBlockhash: sKeyPair[0].publicKey.toBase58(), feePayer: sKeyPair[1].publicKey }); // Transaction.serialize
      tx.add(transferInstruction()).sign(sKeyPair[1]);
      const msg = tx.serialize({ requireAllSignatures: false }).toString("hex");

      // validate state before
      popupResult = { approve: true };
      const result = await controllerModule.torus.provider.sendAsync({
        method: "send_transaction",
        params: {
          message: msg,
        },
      });
      tx.partialSign(sKeyPair[0]);

      // validate state after
      assert(popupStub.called);

      log.info(result);
      assert.equal(result, base58.encode(tx.signature || [1]));

      // Reject Transaction
      popupResult = { approve: false };
      assert.rejects(
        async () => {
          await controllerModule.torus.provider.sendAsync({
            method: "send_transaction",
            params: {
              message: msg,
            },
          });
        },
        (_err) => {
          // validate state after reject
          assert(popupStub.calledTwice);
          return true;
        },
        "Send Transaction Rejection does not throw error"
      );
    });

    it("send multiInstruction flow", async () => {
      const tx = new Transaction({ recentBlockhash: sKeyPair[0].publicKey.toBase58(), feePayer: sKeyPair[0].publicKey }); // Transaction.serialize
      tx.add(transferInstruction());
      tx.add(transferInstruction());
      tx.add(transferInstruction());
      const msg = tx.serialize({ requireAllSignatures: false }).toString("hex");

      // validate state before
      popupResult = { approve: true };
      const result = await controllerModule.torus.provider.sendAsync({
        method: "send_transaction",
        params: {
          message: msg,
        },
      });
      tx.partialSign(sKeyPair[0]);

      // validate state after
      assert(popupStub.called);
      assert.equal(result, base58.encode(tx.signature || [1]));

      // Reject Transaction
      popupResult = { approve: false };
      assert.rejects(
        async () => {
          await controllerModule.torus.provider.sendAsync({
            method: "send_transaction",
            params: {
              message: msg,
            },
          });
        },
        (_err) => {
          // validate state after reject
          assert(popupStub.calledTwice);
          return true;
        },
        "Send Transaction Rejection does not throw error"
      );
    });

    // add contact on null account test if condition
    it("add contact", async () => {
      const addContactSpy = sandbox.spy(PreferencesController.prototype, "addContact");
      const dummyContact = {
        id: 47,
        created_at: "2021-12-28T06:51:41.000Z",
        updated_at: "2021-12-28T06:51:41.000Z",
        contact_verifier: "solana",
        contact_verifier_id: "4wverifyier",
        display_name: "test-2",
        public_address: sKeyPair[1].publicKey.toBase58(),
      };
      const result = await controllerModule.torus.addContact(dummyContact);
      // asser`t.deepEqual([app.value.toastMessages], [{ type: "success", message: "jhi" }]);
      const newIdentities = controllerModule.torusState.PreferencesControllerState.identities[sKeyPair[0].publicKey.toBase58()];
      // checkIdentities.contacts.forEach((item, idx) => {
      //   assert.deepStrictEqual(item, mockData.backend.user.data.contacts[idx]);
      // });
      assert.deepStrictEqual(dummyContact, newIdentities.contacts[1]);
      assert.equal(newIdentities.contacts.length, 2);
      assert.equal(result, true);
      assert(addContactSpy.calledOnce);
    });

    it("deleteContact", async () => {
      const contactId = 46;
      const deleteContactSpy = sandbox.spy(PreferencesController.prototype, "deleteContact");
      const result = await controllerModule.torus.deleteContact(contactId);
      assert(deleteContactSpy.calledWith(contactId));
      const { contacts } = controllerModule.torusState.PreferencesControllerState.identities[sKeyPair[0].publicKey.toBase58()];
      assert.equal(contacts.length, 0);
      assert.equal(result, true);
      assert.deepEqual(contacts, []);
    });

    it("addAccount", async () => {
      await controllerModule.logout();
      const { publicKey, secretKey } = sKeyPair[1];
      // const privKey = base58.decode(secretKey).toString("hex").slice(0, 64);
      const result = await controllerModule.torus.addAccount(base58.encode(secretKey), {
        email: "test@test.com",
        name: "test",
        profileImage: "",
        verifier: "google",
        verifierId: "google-test",
        typeOfLogin: "google",
      });
      await controllerModule.torus.setSelectedAccount(publicKey.toString(), true);
      // assert.deepEqual(controllerModule.torus.selectedAddress, publicKey);
      assert.deepEqual(result, publicKey.toString());
      assert.deepEqual(controllerModule.torus.jwtToken, mockData.backend.verify.token);
      // console.log(controllerModule.torus.existingTokenAddress);
      // console.log(controllerModule.torus.communicationProvider);
      // console.log(controllerModule.torus.getAccountPreferences(sKeyPair[0].publicKey.toString()));
    });

    it("set theme", async () => {
      await controllerModule.torus.setTheme("light");
      const { theme } = controllerModule.torusState.PreferencesControllerState.identities[sKeyPair[0].publicKey.toBase58()];
      assert.deepStrictEqual(theme, "light");
      // assert.deepStrictEqual(result, true;
    });

    it("setCrashReport", async () => {
      await controllerModule.setCrashReport(true);
      const { crashReport } = controllerModule.torusState.PreferencesControllerState.identities[sKeyPair[0].publicKey.toBase58()];
      assert.deepStrictEqual(crashReport, true);
      assert.deepStrictEqual(controllerModule.crashReport, true);
      assert.deepStrictEqual(controllerModule.selectedAccountPreferences.crashReport, true);
    });

    it("refreshJwt", async () => {
      const spyPreferenceTrackerRefresh = sandbox.spy(PreferencesController.prototype, "refreshJwt");
      const spySetSelectedAddress = sandbox.spy(PreferencesController.prototype, "setSelectedAddress");
      await controllerModule.torus.triggerLogin({ loginProvider: "google" });
      controllerModule.torus.setSelectedAccount(sKeyPair[0].publicKey.toBase58());
      await controllerModule.torus.refreshJwt(sKeyPair[0].publicKey.toBase58());
      assert(spyPreferenceTrackerRefresh.calledOnce);
      assert(spySetSelectedAddress.calledWith(sKeyPair[0].publicKey.toBase58()));
    });

    it("setCrashReport torus", async () => {
      const setCrashReportSpy = sandbox.spy(PreferencesController.prototype, "setCrashReport");
      const result = await controllerModule.torus.setCrashReport(true);
      const { crashReport } = controllerModule.torusState.PreferencesControllerState.identities[sKeyPair[0].publicKey.toBase58()];
      assert.deepStrictEqual(crashReport, true);
      assert.deepStrictEqual(result, true);
      assert.deepStrictEqual(controllerModule.selectedAccountPreferences.crashReport, true);
      assert(setCrashReportSpy.calledWith(true));
      // assert.deepStrictEqual(result, true);
      // assert(setCrashReportSpy.calledOnce);
      // assert.deepStrictEqual(theme, "dark");

      // get account preference
      // await getAccountPreferences
    });

    it("saveToOpenloginBackend", async () => {
      const spySetMetadata = sandbox.spy(TorusStorageLayer.prototype, "setMetadata");
      // const spyLocalStorage = sandbox.stub(global.window.localStorage, "setItem");
      // const spySessionStorage = sandbox.stub(global.window.sessionStorage, "setItem");
      const { publicKey, secretKey } = sKeyPair[1];
      sandbox.stub(eccrypto, "generatePrivate").callsFake(() => {
        return Buffer.from(secretKey);
      });
      sandbox.stub(eccrypto, "getPublic").callsFake(() => {
        return Buffer.from(publicKey.toString());
      });
      const ecc_privateKey = eccrypto.generatePrivate();
      const ecc_publicKey = eccrypto.getPublic(ecc_privateKey);

      const keyState: KeyState = {
        priv_key: ecc_privateKey.toString("hex"),
        pub_key: ecc_publicKey.toString("hex"),
      };

      log.info({ keyState });
      // spySessionStorage(`${EPHERMAL_KEY}`, stringify(keyState));
      // spyLocalStorage(`${EPHERMAL_KEY}`, stringify(keyState));
      await controllerModule.torus.saveToOpenloginBackend({
        privateKey: secretKey.toString(),
        publicKey: publicKey.toString(),
        accounts: openloginFaker[1].accounts,
      });
      assert(spySetMetadata.calledOnce);
      spySetMetadata.restore();
      // spySessionStorage.restore();
    });

    it("approve sign transaction", async () => {
      popupStub.restore();
      let handleWithHandshakeStub = sandbox.stub(PopupWithBcHandler.prototype, "handleWithHandshake").callsFake(async (_payload: unknown) => {
        return { approve: true };
      });
      // test popup
      const req = {
        method: "sign_all_transactions",
        params: {
          message: "test",
        },
        windowId: helper.getRandomWindowId(),
      };
      const result = await controllerModule.torus.handleTransactionPopup("123", req);
      // assert(spyApproveSignTransaction).to;
      assert.equal(result, true);
      handleWithHandshakeStub.restore();
      handleWithHandshakeStub = sandbox.stub(PopupWithBcHandler.prototype, "handleWithHandshake").callsFake(async (_payload: unknown) => {
        return { approve: false };
      });
      const falseResult = await controllerModule.torus.handleTransactionPopup("123", req);
      // assert(spyApproveSignTransaction).to;
      assert.equal(falseResult, false);
      handleWithHandshakeStub.restore();
      popupStub.reset();
    });

    it("handleSignMessagePopup", async () => {
      popupResult = { approve: true };
      await controllerModule.torus.signMessage({
        method: "sign_message",
        params: {
          data: sKeyPair[0].secretKey,
          message: "Test Signing Message",
          display: "test",
        },
      });
      assert(popupStub.calledOnce);
    });

    it("changeProvider", async () => {
      await controllerModule.setupCommunication("http://localhost:3001");
      const setProviderConfigSpy = sandbox.spy(NetworkController.prototype, "setProviderConfig");
      const result = await controllerModule.torus.changeProvider({
        method: "set_provider",
        params: SUPPORTED_NETWORKS.testnet,
      });
      assert.equal(result, true);
      assert(setProviderConfigSpy.calledWith(SUPPORTED_NETWORKS.testnet));
      assert.deepEqual(controllerModule.torus.blockExplorerUrl, SUPPORTED_NETWORKS.testnet.blockExplorerUrl);
      assert.deepEqual(controllerModule.torus.currentNetworkName, SUPPORTED_NETWORKS.testnet.displayName);
    });

    it("changeProvider rejected", async () => {
      popupResult = { approve: false };
      const setProviderConfigSpy = sandbox.spy(NetworkController.prototype, "setProviderConfig");

      // assert.throws(() => {
      //   throw (new Error("user denied provider change request"), Error, "user denied provider change request");
      // });
      assert.rejects(
        async () => {
          await controllerModule.torus.changeProvider({
            method: "set_provider",
            params: {
              windowId: "123",
            },
          });
        },
        (_err) => {
          assert(setProviderConfigSpy.notCalled);
          assert.equal(_err, "user denied provider change request");
          // console.log({ err: err });
          return true;
        },
        "user denied provider change request"
      );
      // assert.equal(result, false);
      assert(setProviderConfigSpy.notCalled);
    });
    it("getBillboardData", async () => {
      const getBillBoardDataSpy = sandbox.spy(PreferencesController.prototype, "getBillBoardData");
      const result = await controllerModule.torus.getBillboardData();
      assert(getBillBoardDataSpy.called);
      assert.deepEqual(result, sampleEvent);
    });
    it("setLocale", async () => {
      const setUserLocaleSpy = sandbox.spy(PreferencesController.prototype, "setUserLocale");
      const result = await controllerModule.torus.setLocale("ja");
      const { locale } = controllerModule.torusState.PreferencesControllerState.identities[sKeyPair[0].publicKey.toBase58()];
      assert(setUserLocaleSpy.calledWith("ja"));
      assert.deepEqual(result, true);
      assert.deepEqual(locale, "ja");
      assert.deepEqual(controllerModule.torus.locale, "ja");
    });
    it("setDefaultCurrency", async () => {
      const setNativeCurrencySpy = sandbox.spy(CurrencyController.prototype, "setNativeCurrency");
      const setCurrentCurrencySpy = sandbox.spy(CurrencyController.prototype, "setCurrentCurrency");
      const setSelectedCurrencySpy = sandbox.spy(PreferencesController.prototype, "setSelectedCurrency");
      const result = await controllerModule.torus.setDefaultCurrency("CAD");

      const { selectedCurrency } = controllerModule.torusState.PreferencesControllerState.identities[sKeyPair[0].publicKey.toBase58()];
      assert.deepEqual(result, true);
      assert.deepEqual(controllerModule.torus.conversionRate, "1");
      assert.deepEqual(selectedCurrency, "CAD");
      assert.deepEqual(controllerModule.torus.currentCurrency, "CAD");
      assert.deepEqual(controllerModule.torus.nativeCurrency, "SOL");
      const refreshDate = new Date(Number(controllerModule.torus.state.CurrencyControllerState.conversionDate) * 1000);
      assert.deepEqual(controllerModule.torus.lastTokenRefreshDate, refreshDate);
      assert(setNativeCurrencySpy.calledWith("SOL"));
      assert(setCurrentCurrencySpy.calledWith("CAD"));
      assert(setSelectedCurrencySpy.calledWith({ selectedCurrency: "CAD" }));
    });
    it("setCurrentCurrency", async () => {
      const setNativeCurrencySpy = sandbox.spy(CurrencyController.prototype, "setNativeCurrency");
      const setCurrentCurrencySpy = sandbox.spy(CurrencyController.prototype, "setCurrentCurrency");
      const result = await controllerModule.torus.setDefaultCurrency("INR");

      const { selectedCurrency } = controllerModule.torusState.PreferencesControllerState.identities[sKeyPair[0].publicKey.toBase58()];
      assert.deepEqual(result, true);
      assert.deepEqual(selectedCurrency, "INR");
      assert(setNativeCurrencySpy.calledWith("SOL"));
      assert(setCurrentCurrencySpy.calledWith("INR"));
    });
    // it("UNSAFE_signTransaction", async () => {
    //   await controllerModule.torus.UNSAFE_signTransaction(mockData.backend.user.data.transactions[0]);
    // });

    it("getAccountPreferences", async () => {
      const getAddressStateSpy = sandbox.spy(PreferencesController.prototype, "getAddressState");
      const pubAddress = sKeyPair[0].publicKey.toBase58();
      const result = await controllerModule.torus.getAccountPreferences(sKeyPair[0].publicKey.toBase58());
      assert.deepEqual(result?.defaultPublicAddress, pubAddress);
      assert(getAddressStateSpy.calledWith(pubAddress));
    });

    it("getSNSAccount null type", async () => {
      // default
      const result = await controllerModule.torus.getSNSAccount("torus", sKeyPair[0].publicKey.toBase58());
      assert.equal(result, null);
      // twitter
      const nameRegistry: NameRegistryState = {
        parentName: new PublicKey(sKeyPair[0].publicKey),
        owner: new PublicKey(sKeyPair[1].publicKey),
        class: new PublicKey(sKeyPair[1].publicKey),
        data: sKeyPair[1].publicKey.toBuffer(),
      };
      sandbox.stub(NameRegistryState, "retrieve").callsFake(async () => nameRegistry);
      const twitterResult = await controllerModule.torus.getSNSAccount("sns", sKeyPair[0].publicKey.toBase58());
      assert.equal(nameRegistry, (twitterResult as any).registry);
    });

    it("approveSignTransaction", async () => {
      sandbox.stub(TransactionController.prototype, "approveSignTransaction").callsFake(noopAsync);
      await controllerModule.torus.approveSignTransaction("123");
    });

    it("triggerLogin selectedNetworkTransactions", async () => {
      const updateSolanaTokensSpy = sandbox.spy(TokensTrackerController.prototype, "updateSolanaTokens");
      const syncSpy = sandbox.spy(PreferencesController.prototype, "sync");
      await controllerModule.logout();
      const pubKey = sKeyPair[1].publicKey.toBase58();
      await controllerModule.torus.setSelectedAccount(pubKey, true);
      assert.deepEqual(controllerModule.selectedAddress, pubKey);
      assert(updateSolanaTokensSpy.calledOnce);
      assert(syncSpy.calledWith(pubKey));
    });

    it("getDappList", async () => {
      const dappList = await controllerModule.torus.getDappList();
      assert.deepEqual(dappList, sampleDapps);
    });

    it("UNSAFE_signTransaction", async () => {
      const signTransactionSpy = sandbox.spy(KeyringController.prototype, "signTransaction");
      const tx = new Transaction({ recentBlockhash: sKeyPair[0].publicKey.toBase58(), feePayer: sKeyPair[0].publicKey });
      tx.add(transferInstruction());
      const result = await controllerModule.torus.UNSAFE_signTransaction(tx);
      assert(signTransactionSpy.calledWith(tx, controllerModule.selectedAddress));
      assert.deepEqual(result, tx);
    });

    it("setupUnTrustedCommunication", async () => {
      const setIframeOriginSpy = sandbox.spy(PreferencesController.prototype, "setIframeOrigin");
      const torusStream = new BasePostMessageStream({
        name: "iframe_torus",
        target: "embed_torus",
        targetWindow: window.parent,
      });
      controllerModule.torus.setupUnTrustedCommunication(torusStream, "http://localhost:3001");
      assert(setIframeOriginSpy.calledOnce);
    });

    it("setupUnTrustedCommunication", async () => {
      const setIframeOriginSpy = sandbox.spy(PreferencesController.prototype, "setIframeOrigin");
      const torusStream = new BasePostMessageStream({
        name: "iframe_torus",
        target: "embed_torus",
        targetWindow: window.parent,
      });
      controllerModule.torus.setupUnTrustedCommunication(torusStream, "http://localhost:3001");
      assert(setIframeOriginSpy.calledOnce);
    });

    // it("getGaslessPublicKey", async () => {
    //   const result = await controllerModule.torus.getGaslessPublicKey();
    //   assert.deepEqual(result, true);
    // });

    // it("UNSAFE_signAllTransactions", async () => {
    //   const tx = new Transaction({ recentBlockhash: sKeyPair[0].publicKey.toBase58(), feePayer: sKeyPair[0].publicKey }); // Transaction.serialize
    //   const msg = tx.add(transferInstruction()).serialize({ requireAllSignatures: false });
    //   // const signTransactionSpy = sandbox.stub(KeyringController.prototype, "signTransaction").callsFake(async (_payload: unknow) => {
    //   //   return tx as Transaction;
    //   // });
    //   // const tx = new Transaction({ recentBlockhash: sKeyPair[0].publicKey.toBase58(), feePayer: sKeyPair[0].publicKey });
    //   // tx.add(transferInstruction());
    //   const result = await controllerModule.torus.UNSAFE_signAllTransactions({
    //     method: "sign_all_transactions",
    //     params: {
    //       message: [msg.toString()],
    //     },
    //   });
    //   // assert(signTransactionSpy.calledOnce);
    //   assert.deepEqual(result, true);
    // });
  });

  // describe("Settings Flow Change", () => {
  //   beforeEach(async () => {
  //     // controllerModule.torus = new TorusController({ _config: cloneDeep(DEFAULT_CONFIG), _state: cloneDeep(DEFAULT_STATE) });
  //     // controllerModule.init({ state: cloneDeep(DEFAULT_STATE), origin: "https://localhost:8080/" });
  //     sandbox.stub(helper, "isMain").get(() => false);
  //     // await controllerModule.torus.triggerLogin({ loginProvider: "google" });
  //     // sandbox.stub(TorusController.prototype, "conversionRate").get(() => 1);
  //   });
  //   // add contact else flow
  //   it("add contact else", async () => {
  //     // await controllerModule.triggerLogin({ loginProvider: "google" });
  //     // const checkIdentities = controllerModule.torusState.PreferencesControllerState.identities[sKeyPair[0].publicKey.toBase58()];
  //     const dummyContact = {};
  //     // eslint-disable-next-line no-debugger
  //     debugger;
  //     const result = await controllerModule.torus.addContact(dummyContact as any);
  //     // const newIdentities = controllerModule.torusState.PreferencesControllerState.identities[sKeyPair[0].publicKey.toBase58()];
  //     // checkIdentities.contacts.forEach((item, idx) => {
  //     //   assert.deepStrictEqual(item, mockData.backend.user.data.contacts[idx]);
  //     // });
  //     // assert.deepStrictEqual(dummyContact, newIdentities.contacts[1]);
  //     // assert.equal(newIdentities.contacts.length, 2);
  //     assert.equal(result, false);
  //   });
  // });
});

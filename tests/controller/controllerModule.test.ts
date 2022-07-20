import { LAMPORTS_PER_SOL, SystemProgram, Transaction } from "@solana/web3.js";
import { BaseEmbedController, KeyPair, PAYMENT_PROVIDER_TYPE, PopupWithBcHandler } from "@toruslabs/base-controllers";
import OpenLogin from "@toruslabs/openlogin";
// import * as OpenLoginMethods from "@toruslabs/openlogin";
import {
  AccountTrackerController,
  CurrencyController,
  NetworkController,
  PreferencesController,
  TokenInfoController,
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
import * as helper from "@/utils/helpers";
import { SolAndSplToken } from "@/utils/interfaces";
import * as SolanaHelper from "@/utils/solanaHelpers";
import TorusStorageLayer from "@/utils/tkey/storageLayer";
import { TOPUP } from "@/utils/topup";

import { accountInfoPromise, mockGetConnection, mockMintAddress, mockMintInfo } from "./mockConnection";
import { mockData, openloginFaker, sampleTokens, sKeyPair } from "./mockData";
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

  xdescribe("#importCustomToken", async () => {
    beforeEach(async () => {
      // const a = new TokenInfoController({
      //   config: DEFAULT_CONFIG.TokensInfoConfig,
      //   state: DEFAULT_STATE.TokenInfoState,
      //   getConnection: mockGetConnection,
      //   getJwt: () => controllerModule.torus.jwtToken,
      //   getSelectedAddress: () => controllerModule.torus.selectedAddress,
      //   getNetworkProviderState: () => controllerModule.torus.state.NetworkControllerState,
      // });
      await controllerModule.triggerLogin({ loginProvider: "google" });
      controllerModule.torus.setSelectedAccount(sKeyPair[0].publicKey.toBase58());
      // sandbox.stub(a, "getConnection").callsFake(mockGetConnection);
    });
    it("importCustomToken", async () => {
      // sandbox.stub(TokenInfoController.prototype, "getConnection").callsFake(mockGetConnection);
      // controllerModule.torus.tokenInfoController;
      // sandbox.stub(TokenInfoController.prototype, "importCustomToken").callsFake(noopAsync);
      // sandbox.stub(TokensTrackerController.prototype, "state").returns(sampleTokens);
      // sandbox.stub(NetworkController.prototype, "getConnection").callsFake();
      // const updateTokenInfoSpy = sandbox.spy(TokenInfoController.prototype, "updateTokenInfoMap");
      const result: any = await controllerModule.torus.importCustomToken({
        address: "E4nC2ThDznHgwdFEPyze8p9U28ueRuomx8o3MTgNM7yz",
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
      const tokenMint = "5RA64XFTwfAaZLqNvJoFsNMcCQRdEd4kzGTd9c276VjK";
      const result = await controllerModule.torus.fetchTokenInfo(tokenMint);
      assert.deepEqual(result, sampleTokens.tokens["7dpVde1yJCzpz2bKNiXWh7sBJk7PFvv576HnyFCrgNyW"]["5RA64XFTwfAaZLqNvJoFsNMcCQRdEd4kzGTd9c276VjK"]);
    });
  });

  // Initialization
  xdescribe("#Initialization, login logout flow", () => {
    it("embed is full screeen", async () => {
      sandbox.stub(BaseEmbedController.prototype, "state").returns({ isIFrameFullScreen: false });
      const { embedIsIFrameFullScreen } = controllerModule.torus;
      assert.equal(embedIsIFrameFullScreen, false);
    });

    // it("embed is full screen", async () => {
    //   controllerModule.torus.setIFrameStatus();
    //   assert.equal(embedIsIFrameFullScreen, false);
    //   assert.equal(BaseEmbedController.prototype.state.embedIsIFrameFullScreen, false);
    // });

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

      checkIdentities.contacts.forEach((item, idx) => {
        assert.deepStrictEqual(item, mockData.backend.user.data.contacts[idx]);
      });

      assert.equal(controllerModule.solBalance, account[sKeyPair[0].publicKey.toBase58()].lamports / LAMPORTS_PER_SOL);

      // logout flow
      await controllerModule.logout();
      // validate logout state
      assert.deepStrictEqual(controllerModule.torusState.AccountTrackerState.accounts, {});
      assert.deepStrictEqual(controllerModule.torusState.KeyringControllerState.wallets, []);
    });
  });

  xdescribe("#Embeded Login Logout flow", () => {
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

    it("triggerLogin selectedNetworkTransactions", async () => {
      await controllerModule.triggerLogin({ loginProvider: "google" });
      controllerModule.torus.setSelectedAccount(sKeyPair[0].publicKey.toBase58());
      assert.deepEqual(controllerModule.selectedNetworkTransactions, true);
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

    // it("setIFrameStatus", async () => {
    //   // const spyUpdate = sandbox.spy(BaseEmbedController.prototype, "update");
    //   await controllerModule.triggerLogin({ loginProvider: "google" });
    //   const body = {
    //     method: "iframe_status",
    //     params: {
    //       isFullScreen: true,
    //       isIFrameFullScreen: true,
    //       rid: helper.getRandomWindowId(),
    //     },
    //     id: "05992defa7462673f245ff8e854d24911c18feb938009a445f7db56d19245fb7",
    //     origin: "http://localhost:3000",
    //   };
    //   await controllerModule.torus.communicationProvider.sendAsync(body);
    //   // assert(spyUpdate.calledOnce);
    //   assert.equal(controllerModule.torus.state.EmbedControllerState.isIFrameFullScreen, true);
    // });

    it("setLogoutRequired", async () => {
      await controllerModule.setLogoutRequired(true);
      assert.equal(controllerModule.logoutRequired, true);
    });
    it("handleTopUp", async () => {
      // sandbox.mock()
      await controllerModule.triggerLogin({ loginProvider: "google" });
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
      const result = await controllerModule.handleRedirectFlow({ method: "topup", params: sampleRequest, resolveRoute: "home" });
      assert.equal(result, true);
    });
  });

  // transfer flow
  xdescribe("#Transfer flow", () => {
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
    it.only("add contact", async () => {
      // await controllerModule.triggerLogin({ loginProvider: "google" });
      // const checkIdentities = controllerModule.torusState.PreferencesControllerState.identities[sKeyPair[0].publicKey.toBase58()];
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
    });

    it("set theme", async () => {
      await controllerModule.changeTheme("light");
      const { theme } = controllerModule.torusState.PreferencesControllerState.identities[sKeyPair[0].publicKey.toBase58()];
      assert.deepStrictEqual(theme, "light");
      // assert.deepStrictEqual(result, true);
      // assert.deepStrictEqual(theme, "dark");
    });

    it("setCrashReport", async () => {
      // const localStore: any = {};
      // sinon.sandbox.create()
      // sandbox.stub(localStorage, "getItem").callsFake((key) => (key in localStore ? localStore[key] : null));
      // sandbox.stub(localStorage, "setItem").callsFake((key, value) => {
      //   localStore[key] = `${value}`;
      // });
      // sinon.stub(controllerModule.)
      // const setCrashReportSpy = sandbox.spy(PreferencesController.prototype, "setCrashReport");
      await controllerModule.setCrashReport(true);
      const { crashReport } = controllerModule.torusState.PreferencesControllerState.identities[sKeyPair[0].publicKey.toBase58()];
      assert.deepStrictEqual(crashReport, true);
      assert.deepStrictEqual(controllerModule.crashReport, true);
      assert.deepStrictEqual(controllerModule.selectedAccountPreferences.crashReport, true);
      // assert.deepStrictEqual(result, true);
      // assert(setCrashReportSpy.calledOnce);
      // assert.deepStrictEqual(theme, "dark");

      // get account preference
      // await getAccountPreferences
    });

    it("setCrashReport2", async () => {
      const result = await controllerModule.torus.setCrashReport(true);
      const { crashReport } = controllerModule.torusState.PreferencesControllerState.identities[sKeyPair[0].publicKey.toBase58()];
      assert.deepStrictEqual(crashReport, true);
      assert.deepStrictEqual(result, true);
      assert.deepStrictEqual(controllerModule.selectedAccountPreferences.crashReport, true);
      // assert.deepStrictEqual(result, true);
      // assert(setCrashReportSpy.calledOnce);
      // assert.deepStrictEqual(theme, "dark");

      // get account preference
      // await getAccountPreferences
    });

    it("approve sign transaction", async () => {
      // test popup
      // const transaction = controllerModule.torusState.PreferencesControllerState.identities[sKeyPair[0].publicKey.toBase58()].incomingBackendTransactions;
      // await controllerModule.torus.handleTransactionPopup(transactions[0].id.toString());
      // // assert(spyApproveSignTransaction).to;
      // assert(spyApproveSignTransaction.calledOnce);
    });
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

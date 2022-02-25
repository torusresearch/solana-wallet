import { LAMPORTS_PER_SOL, SystemProgram, Transaction } from "@solana/web3.js";
import { KeyPair, PopupWithBcHandler } from "@toruslabs/base-controllers";
import OpenLogin from "@toruslabs/openlogin";
import { AccountTrackerController, NetworkController, PreferencesController } from "@toruslabs/solana-controllers";
import nacl from "@toruslabs/tweetnacl-js";
import assert from "assert";
import base58 from "bs58";
import { cloneDeep } from "lodash-es";
import log from "loglevel";
import nock from "nock";
import sinon from "sinon";

import OpenLoginFactory from "@/auth/OpenLogin";
import OpenLoginHandler from "@/auth/OpenLoginHandler";
import config from "@/config";
import { DEFAULT_STATE } from "@/controllers/TorusController";
import controllerModule from "@/modules/controllers";
// import { BUTTON_POSITION } from "@/utils/enums";
import * as helper from "@/utils/helpers";
import { SolAndSplToken } from "@/utils/interfaces";

import { accountInfoPromise, mockGetConnection, mockMintAddress, mockMintInfo } from "./mockConnection";
import { mockData, openloginFaker, sKeyPair } from "./mockData";
import nockRequest from "./nockRequest";

describe("Controller Module", () => {
  const sandbox = sinon.createSandbox();
  let clock: sinon.SinonFakeTimers; //=

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const noopAsync = async () => {};
  let popupResult = { approve: true };
  let popupStub: sinon.SinonStub;

  let spyAccountTracker: sinon.SinonSpy;
  let spyPrefIntializeDisp: sinon.SinonSpy;

  // init once only
  controllerModule.init({ state: cloneDeep(DEFAULT_STATE), origin: "https://localhost" });
  beforeEach(async () => {
    nockRequest();

    // Stubing Openlogin
    sandbox.stub(config, "baseUrl").get(() => "http://localhost");
    sandbox.stub(config, "baseRoute").get(() => "http://localhost");
    sandbox.stub(config, "torusNetwork").get(() => "mainnet");
    sandbox.stub(OpenLogin.prototype, "init").callsFake(noopAsync);
    sandbox.stub(OpenLogin.prototype, "logout").callsFake(noopAsync);
    sandbox.stub(OpenLogin.prototype, "_syncState").callsFake(noopAsync);
    sandbox.stub(OpenLogin.prototype, "_getData").callsFake(async () => {
      return {};
    });

    sandbox.stub(OpenLoginFactory, "getInstance").callsFake(async () => {
      return { state: {} } as OpenLogin;
    });
    sandbox.stub(OpenLoginHandler.prototype, "handleLoginWindow").callsFake(async (_) => {
      return mockData.openLoginHandler;
    });

    // mock popup handler
    popupStub = sandbox.stub(PopupWithBcHandler.prototype, "handleWithHandshake").callsFake(async (_payload: unknown) => {
      return popupResult;
    });

    // add sinon method stubs & spies on Controllers and TorusController
    sandbox.stub(NetworkController.prototype, "getConnection").callsFake(mockGetConnection);
    spyAccountTracker = sandbox.spy(AccountTrackerController.prototype, "refresh");
    spyPrefIntializeDisp = sandbox.spy(PreferencesController.prototype, "initializeDisplayActivity");

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

  // Initialization
  describe("#Initialization, login logout flow", () => {
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

      controllerModule.importExternalAccount(base58.encode(sKeyPair[3].secretKey));

      // validate state
      assert.equal(controllerModule.torusState.KeyringControllerState.wallets.length, 2);
      assert(controllerModule.torusState.KeyringControllerState.wallets.find((wallet) => wallet.address === sKeyPair[3].publicKey.toBase58()));
      assert(controllerModule.torusState.KeyringControllerState.wallets.find((wallet) => wallet.address === sKeyPair[0].publicKey.toBase58()));
      assert.equal(controllerModule.selectedAddress, sKeyPair[0].publicKey.toBase58());

      controllerModule.setSelectedAccount(sKeyPair[3].publicKey.toBase58());
      assert(spyPrefIntializeDisp.calledTwice);

      assert.equal(controllerModule.selectedAddress, sKeyPair[3].publicKey.toBase58());
      // validate getusersolbalance
      // validate token
    });
  });

  // transfer flow
  describe("#Transfer flow", () => {
    const transferInstruction = () => {
      return SystemProgram.transfer({
        fromPubkey: sKeyPair[0].publicKey,
        toPubkey: sKeyPair[1].publicKey,
        lamports: Math.random() * LAMPORTS_PER_SOL,
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
      const result = await controllerModule.torus.transferSpl(sKeyPair[0].publicKey.toBase58(), 0, selectedToken);
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
        lamports: Math.random() * LAMPORTS_PER_SOL,
      });
    };

    beforeEach(async () => {
      sandbox.stub(helper, "isMain").get(() => false);
      await controllerModule.torus.triggerLogin({ loginProvider: "google" });
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
  });
});

import { LAMPORTS_PER_SOL, SystemProgram, Transaction } from "@solana/web3.js";
import { PopupWithBcHandler } from "@toruslabs/base-controllers";
import { AccountTrackerController, NetworkController, PreferencesController } from "@toruslabs/solana-controllers";
import nacl from "@toruslabs/tweetnacl-js";
import assert from "assert";
import base58 from "bs58";
import { cloneDeep } from "lodash-es";
// import log from "loglevel";
import nock from "nock";
import sinon from "sinon";

import OpenLoginHandler from "@/auth/OpenLoginHandler";
import config from "@/config";
import { DEFAULT_CONFIG, DEFAULT_STATE } from "@/controllers/TorusController";
import controllerModule from "@/modules/controllers";
import { BUTTON_POSITION } from "@/utils/enums";
// import { delay } from "@/utils/helpers";
import * as helper from "@/utils/helpers";

import { mockGetConnection } from "./mockConnection";
import { mockData, openloginFaker, sKeyPair } from "./mockData";
import nockRequest from "./nockRequest";

describe("Controller Module", () => {
  const sandbox = sinon.createSandbox({
    // useFakeTimers: true,
  });
  let clock: sinon.SinonFakeTimers; //=

  // clock = sinon.useFakeTimers();
  // const noop = () => {};
  let popupResult = { approve: true };
  let popupStub: sinon.SinonStub;

  let spyAccountTracker: sinon.SinonSpy;
  let spyPrefIntializeDisp: sinon.SinonSpy;

  // const waitNetwork = () =>
  //   new Promise<void>((resolve, reject) => {
  //     controllerModule.torus.once("networkDidChange", (_msg) => {
  //       resolve();
  //     });
  //     setTimeout(() => reject(Error("no network emited")), 5000);
  //   });
  // const waitBlock = () =>
  //   new Promise<void>((resolve, reject) => {
  //     controllerModule.torus.once("newBlock", (_msg) => {
  //       // log.error("new block");
  //       resolve();
  //     });
  //     resolve();
  //     setTimeout(() => reject(Error("no block emited")), 21000);
  //   });

  beforeEach(async () => {
    nockRequest();

    // Stubing Openlogin
    sandbox.stub(config, "baseUrl").get(() => "http://localhost");
    sandbox.stub(config, "baseRoute").get(() => "http://localhost");
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

    controllerModule.torus.init({ _config: cloneDeep(DEFAULT_CONFIG), _state: cloneDeep(DEFAULT_STATE) });
    clock = sinon.useFakeTimers();
    // spy transaction controller event
  });

  afterEach(() => {
    nock.cleanAll();
    sandbox.restore();
    clock.restore();
  });
  // Initialization
  describe("#Initialization, login logout flow", () => {
    it("trigger login flow", async () => {
      // log.error(torusController);
      sandbox.stub(mockData, "openLoginHandler").get(() => openloginFaker[0]);

      // assert.deepStrictEqual(torusController.state.AccountTrackerState.accounts, {});
      // assert.deepStrictEqual(torusController.state.KeyringControllerState.wallets, []);

      // clock.tick(100);
      await controllerModule.triggerLogin({ loginProvider: "google" });

      assert(spyPrefIntializeDisp.calledOnce);
      assert(spyAccountTracker.calledOnce);
      // validate login state
      // const checkIdentities = torusController.state.PreferencesControllerState.identities[sKeyPair[0].publicKey.toBase58()];
      // assert.deepStrictEqual(checkIdentities.userInfo, mockData.openLoginHandler.userInfo);
      // assert.deepStrictEqual(checkIdentities.contacts, mockData.backend.user.data.contacts);

      // logout flow
      await controllerModule.logout();
      // validate logout state
      assert.deepStrictEqual(controllerModule.torus.state.AccountTrackerState.accounts, {});
      assert.deepStrictEqual(controllerModule.torus.state.KeyringControllerState.wallets, []);
    });
  });

  describe("#Embeded Solana API flow", () => {
    const initParams = {
      buttonPosition: BUTTON_POSITION.BOTTOM_LEFT,
      apiKey: "adsf",
    };
    const dappOrigin = "localhost";
    it("login via embed", () => {
      controllerModule.init({
        state: {
          EmbedControllerState: {
            buttonPosition: initParams.buttonPosition,
            isIFrameFullScreen: true,
            apiKey: initParams.apiKey,
            oauthModalVisibility: false,
            loginInProgress: false,
            dappMetadata: { name: "", icon: "" },
          },
          //   ...(initParams.network && {
          //     NetworkControllerState: {
          //       chainId: initParams.network.chainId,
          //       properties: {},
          //       providerConfig: initParams.network,
          //     },
          //   }),
        },
        origin: dappOrigin,
      });
      controllerModule.setupCommunication(dappOrigin);

      //   log.error(controllerModule.torusState);
      //   controllerModule.torus.loginFromWidgetButton();
    });
  });

  // Embed API call
  describe("#Embeded Solana API flow", () => {
    const transferInstruction = () => {
      return SystemProgram.transfer({
        fromPubkey: sKeyPair[0].publicKey,
        toPubkey: sKeyPair[1].publicKey,
        lamports: Math.random() * LAMPORTS_PER_SOL,
      });
    };

    beforeEach(async () => {
      sandbox.stub(helper, "isMain").get(() => false);
      controllerModule.torus.init({ _config: cloneDeep(DEFAULT_CONFIG), _state: cloneDeep(DEFAULT_STATE) });
      await controllerModule.torus.triggerLogin({ loginProvider: "google" });
    });

    // Solana Api
    it("embed sendTransaction flow", async () => {
      const tx = new Transaction({ recentBlockhash: sKeyPair[0].publicKey.toBase58(), feePayer: sKeyPair[0].publicKey }); // Transaction.serialize
      const msg = tx.add(transferInstruction()).serialize({ requireAllSignatures: false }).toString("hex");
      // log.error(spyPrefIntializeDisp.callCount);
      // log.error(controllerModule.torus.state.PreferencesControllerState.identities[sKeyPair[0].publicKey.toBase58()]);
      assert(
        Object.keys(controllerModule.torus.state.PreferencesControllerState.identities[sKeyPair[0].publicKey.toBase58()].displayActivities).length ===
          0
      );
      // validate state before
      const result = await controllerModule.torus.provider.sendAsync({
        method: "send_transaction",
        params: {
          message: msg,
        },
      });

      // log.error(result);
      // log.error(popupStub.callCount);
      // validate state after
      assert(popupStub.called);
      assert(
        Object.keys(controllerModule.torus.state.PreferencesControllerState.identities[sKeyPair[0].publicKey.toBase58()].displayActivities).length ===
          1
      );

      // log.error(base58.encode(tx.signature || [1]));
      // log.error(result);
      tx.sign(sKeyPair[0]);
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

    it("embed signTransaction flow", async () => {
      popupResult = { approve: true };
      const tx = new Transaction({ recentBlockhash: sKeyPair[0].publicKey.toBase58(), feePayer: sKeyPair[0].publicKey }); // Transaction.serialize
      const msg = tx.add(transferInstruction()).serialize({ requireAllSignatures: false });

      const result = await controllerModule.torus.provider.sendAsync({
        method: "sign_transaction",
        params: {
          message: msg,
        },
      });

      tx.sign(sKeyPair[0]);
      assert.equal(result, tx.serialize({ requireAllSignatures: false }).toString("hex"));
      // will not patch activities
      assert(
        Object.keys(controllerModule.torus.state.PreferencesControllerState.identities[sKeyPair[0].publicKey.toBase58()].displayActivities).length ===
          0
      );
      // validate controller

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
      // log.error(base58.encode(tx.signature || [1]));
      // log.error(result);
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

    // xit("embed flow", async () => {
    //   controllerModule.torus.init({ _config: DEFAULT_CONFIG, _state: DEFAULT_STATE });
    // });
  });
});

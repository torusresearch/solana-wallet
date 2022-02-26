import { PopupWithBcHandler } from "@toruslabs/base-controllers";
import { AccountTrackerController, NetworkController, SUPPORTED_NETWORKS, TokenInfoController } from "@toruslabs/solana-controllers";
import assert from "assert";
import base58 from "bs58";
import { cloneDeep } from "lodash-es";
import log from "loglevel";
import nock from "nock";
import sinon from "sinon";

import OpenLoginHandler from "@/auth/OpenLoginHandler";
import config from "@/config";
import TorusController, { DEFAULT_CONFIG, DEFAULT_STATE } from "@/controllers/TorusController";
import { delay } from "@/utils/helpers";

import { mockGetConnection } from "./mockConnection";
import { mockData, sKeyPair } from "./mockData";
import nockRequest from "./nockRequest";

describe("TorusController", () => {
  const sandbox = sinon.createSandbox({
    // useFakeTimers: true,
  });
  let torusController: TorusController;
  let clock: sinon.SinonFakeTimers; //=

  // clock = sinon.useFakeTimers();
  // const noop = () => {};
  let popupResult = { approve: true };
  let popupStub: sinon.SinonStub;

  let spyAccountTracker: sinon.SinonSpy;
  // let spyPrefIntializeDisp: sinon.SinonSpy;
  let spyTokenInfo: sinon.SinonSpy;

  const waitNetwork = () =>
    new Promise<void>((resolve, reject) => {
      torusController.once("networkDidChange", (_msg) => {
        resolve();
      });
      setTimeout(() => reject(Error("no network emited")), 5000);
    });

  const waitBlock = () =>
    new Promise<void>((resolve, reject) => {
      torusController.once("newBlock", (_msg) => {
        // log.error("new block");
        resolve();
      });
      // resolve();
      setTimeout(() => reject(Error("no block emited")), 21000);
    });

  beforeEach(async () => {
    nockRequest();
    // Stubing Openlogin
    sandbox.stub(config, "baseUrl").get(() => "http://localhost");
    sandbox.stub(config, "baseRoute").get(() => "http://localhost");
    sandbox.stub(OpenLoginHandler.prototype, "handleLoginWindow").callsFake(async (_) => {
      // log.error("sinon stub working");
      return mockData.openLoginHandler;
    });

    // mock popup handler
    popupStub = sandbox.stub(PopupWithBcHandler.prototype, "handleWithHandshake").callsFake(async (_payload: unknown) => {
      return popupResult;
    });
    // add sinon method stubs & spies on Controllers and TorusController
    sandbox.stub(NetworkController.prototype, "getConnection").callsFake(mockGetConnection);
    spyAccountTracker = sandbox.spy(AccountTrackerController.prototype, "refresh");
    // spyPrefIntializeDisp = sandbox.spy(PreferencesController.prototype, "initializeDisplayActivity");
    spyTokenInfo = sandbox.spy(TokenInfoController.prototype, "updateMetadata");

    torusController = new TorusController({ _config: cloneDeep(DEFAULT_CONFIG), _state: cloneDeep(DEFAULT_STATE) });
    torusController.init({ _config: cloneDeep(DEFAULT_CONFIG), _state: cloneDeep(DEFAULT_STATE) });

    clock = sinon.useFakeTimers();
    // spy transaction controller event
  });

  afterEach(() => {
    nock.cleanAll();
    sandbox.restore();
    clock.restore();
  });

  // on update
  describe("#On Update flow", () => {
    it("network changed trigger updates", async () => {
      await waitNetwork();
      await torusController.triggerLogin({ loginProvider: "google" });
      assert(spyAccountTracker.calledOnce);

      torusController.setNetwork(SUPPORTED_NETWORKS.testnet);
      await waitNetwork();
      assert(spyAccountTracker.calledTwice);
    });

    it("selecteAddress wallet changed trigger updates", async () => {
      await waitNetwork();
      await torusController.triggerLogin({ loginProvider: "google" });
      assert(spyAccountTracker.calledOnce);

      torusController.importExternalAccount(base58.encode(sKeyPair[3].secretKey), torusController.userInfo);
      torusController.setSelectedAccount(sKeyPair[3].publicKey.toBase58());
      assert(spyAccountTracker.calledTwice);

      torusController.setSelectedAccount(sKeyPair[2].publicKey.toBase58());
      assert(spyAccountTracker.calledThrice);
    });

    it("onPollingBlock trigger updates", async () => {
      await waitNetwork();
      await torusController.triggerLogin({ loginProvider: "google" });

      assert(spyAccountTracker.calledOnce);
      // log.error(spyAccountTracker.callCount);
      // assert(spyTokenInfo.calledOnce);

      const wbPromise = waitBlock();
      const delayPromise = delay(2000);
      clock.tick(20000);
      await wbPromise;
      await delayPromise;

      log.info(torusController.state.TokensTrackerState.tokens);
      // log.error(spyAccountTracker.callCount);
      assert(spyAccountTracker.calledTwice);
      assert(spyTokenInfo.calledTwice);

      const wbPromise1 = waitBlock();

      // const delayPromise1 = delay(2000);
      clock.tick(20000);
      await wbPromise1;
      await delayPromise;
      // log.error(spyAccountTracker.callCount);
      assert(spyAccountTracker.calledThrice);

      // alter mock data to simulate update
      const wbPromise2 = waitBlock();
      clock.tick(20000);
      await wbPromise2;
      await delayPromise;
      // log.error(torusController.state.TokensTrackerState.tokens);
      // log.error(torusController.state.TokenInfoState);
      // log.error(torusController.state.TokensTrackerState);
      // log.error(torusController.state.AccountTrackerState);
    });
  });

  // Wallet Api
  // Provider API tests
  describe("#Embedded Wallet API", () => {
    //  "logout" is covered in login logout flow

    it("returns first address when dapp calls getAccounts", async () => {
      // inject postasync
      const result = await torusController.provider.sendAsync({
        method: "getAccounts",
        params: [],
      });

      await torusController.triggerLogin({ loginProvider: "google" });
      assert.deepStrictEqual(result, []);

      const resultAfterLogin = await torusController.provider.sendAsync({
        method: "getAccounts",
        params: [],
      });

      assert.deepStrictEqual(resultAfterLogin, [sKeyPair[0].publicKey.toBase58()]);
    });

    // provider changed
    it("changed provider", async () => {
      await waitNetwork();

      // allow change network before login
      // await torusController.triggerLogin({ loginProvider: "google" });
      // verify initial state
      assert.notEqual(torusController.state.NetworkControllerState.network, SUPPORTED_NETWORKS.testnet.displayName);

      popupResult = { approve: true };
      const result = await torusController.communicationProvider.sendAsync({
        method: "set_provider",
        params: SUPPORTED_NETWORKS.testnet,
      });

      // validate state

      const wnPromise = waitNetwork();
      await result;
      await wnPromise;
      assert(popupStub.calledOnce);

      // validate state
      assert.equal(torusController.state.NetworkControllerState.network, SUPPORTED_NETWORKS.testnet.displayName);
      assert.rejects(
        async () => {
          popupResult = { approve: false };
          await torusController.communicationProvider.sendAsync({
            method: "set_provider",
            params: SUPPORTED_NETWORKS.testnet,
          });
        },
        (_err) => {
          assert(true);
          return true;
        }
      );
    });
  });

  //   describe('#setupUntrustedCommunication', function () {
  //     it('adds an origin to requests with untrusted communication', function (done) {
  //       // debugger
  //       const messageSender = {
  //         url: 'https://mycrypto.com',
  //       }
  //       const streamTest = createThoughStream((chunk, _, cb) => {
  //         if (chunk.data && chunk.data.method) {
  //           cb(null, chunk)
  //         } else {
  //           cb()
  //         }
  //       })

  //       torusController.setupUntrustedCommunication(setupMultiplex(streamTest).createStream('provider'), messageSender.url)

  //       const message = {
  //         id: 1999133338649204,
  //         jsonrpc: '2.0',
  //         params: [{ from: testAccount.address }],
  //         method: 'eth_sendTransaction',
  //       }
  //       streamTest.write(
  //         {
  //           name: 'provider',
  //           data: message,
  //         },
  //         null,
  //         (err) => {
  //           if (err) done(err)
  //           setTimeout(() => {
  //             assert.deepStrictEqual(torusController.txController.newUnapprovedTransaction.getCall(0).args, [
  //               { from: testAccount.address },
  //               {
  //                 ...message,
  //                 origin: 'mycrypto.com',
  //               },
  //             ])
  //             done()
  //           })
  //         }
  //       )
  //     })
  //   })

  //   // describe('#setupTrustedCommunication', function() {
  //   //   it('sets up controller api for trusted communication', async function () {
  //   //     const messageSender = {
  //   //       url: 'http://mycrypto.com'
  //   //     }
  //   //     const { promise, resolve } = deferredPromise()
  //   //     const streamTest = createThoughStream((chunk, _, cb) => {
  //   //       assert.strictEqual(chunk.name, 'controller')
  //   //       resolve()
  //   //       cb()
  //   //     })

  //   //     metamaskController.setupTrustedCommunication(setupMultiplex(streamTest).createStream('controller'), messageSender.url)
  //   //     await promise
  //   //     streamTest.end()
  //   //   })
  //   // })
});

// import { Connection } from "@solana/web3.js";
import { LAMPORTS_PER_SOL, SystemProgram, Transaction } from "@solana/web3.js";
import { PopupWithBcHandler, TX_EVENTS } from "@toruslabs/base-controllers";
import { NetworkController, SUPPORTED_NETWORKS } from "@toruslabs/solana-controllers";
import assert from "assert";
import base58 from "bs58";
import { cloneDeep } from "lodash-es";
import log from "loglevel";
// import assert from "assert";
import nock from "nock";
import sinon from "sinon";

import OpenLoginHandler from "@/auth/OpenLoginHandler";
import config from "@/config";
import TorusController, { DEFAULT_CONFIG, DEFAULT_STATE } from "@/controllers/TorusController";

import { mockGetConnection } from "./mockConnection";
import { mockData, openloginFaker, sKeyPair } from "./mockData";

describe("TorusController", () => {
  let torusController: TorusController;
  const sandbox = sinon.createSandbox();
  let clock: sinon.SinonFakeTimers;
  // const noop = () => {};

  beforeEach(async () => {
    nock.cleanAll();
    nock.enableNetConnect((host) => host.includes("localhost") || host.includes("mainnet.infura.io:443"));

    nock("https://api.coingecko.com")
      .get("/api/v3/simple/price?ids=usd-coin&vs_currencies=usd,aud,cad,eur,gbp,hkd,idr,inr,jpy,php,rub,sgd,uah")
      .reply(200, (_uri, _body) => {
        // log.error(uri);
        // log.error(body);
        return JSON.stringify(mockData.coingekco["usd-coin"]);
      });

    const nockBackend = nock("https://solana-api.tor.us").persist();
    nockBackend
      .get("/user")
      .delay(100)
      .query(true)
      .reply(200, (_uri) => {
        // log.error(uri);
        return JSON.stringify(mockData.backend.user);
      });

    nockBackend.get("/currency?fsym=SOL&tsyms=USD").reply(200, () => JSON.stringify(mockData.backend.currency));

    nockBackend.post("/auth/message").reply(200, () => JSON.stringify(mockData.backend.message));

    nockBackend.post("/auth/verify").reply(200, () => JSON.stringify(mockData.backend.verify));

    nockBackend.post("/user").reply(200, (_uri, _requestbody) => JSON.stringify(mockData.backend.user));

    nockBackend.post("/user/recordLogin").reply(200, () => JSON.stringify(mockData.backend.recordLogin));

    nockBackend.post("/transaction").reply(200, () => JSON.stringify(mockData.backend.transaction));

    // api.mainnet-beta nock
    nock("https://api.mainnet-beta.solana.com")
      .post("/")
      .reply(200, (_data) => {
        // log.error(data);
      });

    // Stubing Openlogin
    sandbox.stub(config, "baseUrl").get(() => "http://localhost");
    sandbox.stub(config, "baseRoute").get(() => "http://localhost");
    sandbox.stub(OpenLoginHandler.prototype, "handleLoginWindow").callsFake(async (_) => {
      // log.error("sinon stub working");
      return mockData.openLoginHandler;
    });

    // add sinon method stubs & spies on Controllers and TorusController
    sandbox.stub(NetworkController.prototype, "getConnection").callsFake(mockGetConnection);

    torusController = new TorusController({ _config: cloneDeep(DEFAULT_CONFIG), _state: cloneDeep(DEFAULT_STATE) });
    torusController.init({ _config: cloneDeep(DEFAULT_CONFIG), _state: cloneDeep(DEFAULT_STATE) });

    // spy transaction controller event
    clock = sinon.useFakeTimers();
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

      assert.deepStrictEqual(torusController.state.AccountTrackerState.accounts, {});
      assert.deepStrictEqual(torusController.state.KeyringControllerState.wallets, []);

      await torusController.triggerLogin({ loginProvider: "google" });
      // log.error(result)
      clock.tick(1000);

      // validate login state
      // log.error(torusController.state.PreferencesControllerState.identities);
      // log.error(torusController.state.AccountTrackerState);
      const checkIdentities = torusController.state.PreferencesControllerState.identities[sKeyPair[0].publicKey.toBase58()];
      assert.deepStrictEqual(checkIdentities.userInfo, mockData.openLoginHandler.userInfo);
      assert.deepStrictEqual(checkIdentities.contacts, mockData.backend.user.data.contacts);

      // logout flow
      await torusController.handleLogout();
      // validate logout state
      // only emit logout event, logout will be handle by controller module
      // assert.deepStrictEqual(torusController.state.AccountTrackerState.accounts, {});
      // assert.deepStrictEqual(torusController.state.KeyringControllerState.wallets, []);
    });
  });

  // Login Flow
  describe("#Embed Login Logout flow", () => {
    it("embed trigger login flow", async () => {
      sandbox.stub(mockData, "openLoginHandler").get(() => openloginFaker[0]);

      assert.deepStrictEqual(torusController.state.AccountTrackerState.accounts, {});
      assert.deepStrictEqual(torusController.state.KeyringControllerState.wallets, []);

      const loginResult = torusController.provider.sendAsync({
        method: "solana_requestAccounts",
        params: [],
      });
      // Frame.vue on click login
      await torusController.triggerLogin({ loginProvider: "google" });
      // wait for login complete
      await loginResult;
      // log.error(result);

      const checkIdentities = torusController.state.PreferencesControllerState.identities[sKeyPair[0].publicKey.toBase58()];
      assert.deepStrictEqual(checkIdentities.userInfo, mockData.openLoginHandler.userInfo);
      assert.deepStrictEqual(checkIdentities.contacts, mockData.backend.user.data.contacts);

      //  to validate state
      const logoutResult = await torusController.communicationProvider.sendAsync({
        method: "logout",
        params: [],
      });
      // expect return true
      assert(logoutResult);
      // validate logout state
      // embed logout does not wait for logout compeleted
    });

    // add account
    it("add newAccount flow", async () => {
      await torusController.triggerLogin({ loginProvider: "google" });

      assert.equal(torusController.state.KeyringControllerState.wallets.length, 1);

      torusController.importExternalAccount(base58.encode(sKeyPair[3].secretKey), torusController.userInfo);

      // validate state
      assert.equal(torusController.state.KeyringControllerState.wallets.length, 2);
      assert(torusController.state.KeyringControllerState.wallets.find((wallet) => wallet.address === sKeyPair[3].publicKey.toBase58()));
      assert(torusController.state.KeyringControllerState.wallets.find((wallet) => wallet.address === sKeyPair[0].publicKey.toBase58()));
      assert(torusController.selectedAddress === sKeyPair[0].publicKey.toBase58());
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
      await torusController.triggerLogin({ loginProvider: "google" });
    });
    it("SOL Transfer", async () => {
      torusController.on(TX_EVENTS.TX_UNAPPROVED, async ({ txMeta, req: _req }) => {
        torusController.approveSignTransaction(txMeta.id);
      });
      const tx = new Transaction({ recentBlockhash: sKeyPair[0].publicKey.toBase58(), feePayer: sKeyPair[0].publicKey });
      tx.add(transferInstruction());
      const results = await torusController.transfer(tx);
      log.error("transfer here");
      log.error(results);

      torusController.removeAllListeners(TX_EVENTS.TX_UNAPPROVED);
      // check state
    });
    it("Spl Transfer", async () => {
      // torusController.transferSpl()
      // torusController.transfer();
      torusController.on(TX_EVENTS.TX_UNAPPROVED, async ({ txMeta, req: _req }) => {
        torusController.approveSignTransaction(txMeta.id);
      });
      // tx = torusController.getSPLTransactions()
      // const results = await torusController.transfer(tx);
      // log.error("transfer here");
      // log.error(results);

      torusController.removeAllListeners(TX_EVENTS.TX_UNAPPROVED);
      // check state
    });
    // opportunistic update on activities and balance for sol token nft transfer
    // check transaction controller flow
  });

  // on update
  describe("#On Update flow", () => {
    xit("network changed trigger updates", async () => {
      // torusController.init({ _config: DEFAULT_CONFIG, _state: DEFAULT_STATE });
    });
    xit("selecteAddress wallet changed trigger updates", async () => {
      // torusController.init({ _config: DEFAULT_CONFIG, _state: DEFAULT_STATE });
    });
    xit("onPollingBlock trigger updates", async () => {
      // torusController.init({ _config: DEFAULT_CONFIG, _state: DEFAULT_STATE });
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

    let popupResult = { approve: true };
    let popupStub: sinon.SinonStub;
    beforeEach(async () => {
      // mock popup handler
      popupStub = sandbox.stub(PopupWithBcHandler.prototype, "handleWithHandshake").callsFake(async (_payload: unknown) => {
        return popupResult;
      });
      // consume on new unapproved event
      torusController.on(TX_EVENTS.TX_UNAPPROVED, async ({ txMeta, req }) => {
        // torusController.approveSignTransaction(txMeta.id);
        torusController.handleTransactionPopup(txMeta.id, req);
      });
      await torusController.triggerLogin({ loginProvider: "google" });
    });

    // Solana Api
    it("embed sendTransaction flow", async () => {
      const tx = new Transaction({ recentBlockhash: sKeyPair[0].publicKey.toBase58(), feePayer: sKeyPair[0].publicKey }); // Transaction.serialize
      const msg = tx.add(transferInstruction()).serialize({ requireAllSignatures: false });

      // validate state before
      const result = await torusController.provider.sendAsync({
        method: "send_transaction",
        params: {
          message: msg,
        },
      });

      // validate state after
      assert(popupStub.called);
      assert(result);

      // Reject Transaction
      popupResult = { approve: false };
      // const msg = tx.add(transferInstruction()).serialize({ requireAllSignatures: false });
      try {
        await torusController.provider.sendAsync({
          method: "send_transaction",
          params: {
            message: msg,
          },
        });
        // should not be success
        assert(false);
      } catch (_e) {
        // validate state after reject
        assert(popupStub.calledTwice);
      }
    });
    it("embed signTransaction flow", async () => {
      popupResult = { approve: true };
      const tx = new Transaction({ recentBlockhash: sKeyPair[0].publicKey.toBase58(), feePayer: sKeyPair[0].publicKey }); // Transaction.serialize
      const msg = tx.add(transferInstruction()).serialize({ requireAllSignatures: false });

      const result = await torusController.provider.sendAsync({
        method: "sign_transaction",
        params: {
          message: msg,
        },
      });

      log.error(result);
      // Reject Transaction
      popupResult = { approve: false };
      try {
        await torusController.provider.sendAsync({
          method: "sign_transaction",
          params: {
            message: msg,
          },
        });
        // should not be success
        assert(false);
      } catch (_e) {
        assert(popupStub.calledTwice);
      }
    });
    it("embed signAllTransaction flow", async () => {
      popupResult = { approve: true };
      const tx = new Transaction({ recentBlockhash: sKeyPair[0].publicKey.toBase58(), feePayer: sKeyPair[0].publicKey }); // Transaction.serialize
      const msg = [1, 2, 3, 4].map(() => tx.add(transferInstruction()).serialize({ requireAllSignatures: false }));
      const result = await torusController.provider.sendAsync({
        method: "sign_all_transactions",
        params: {
          message: msg,
        },
      });

      popupResult = { approve: false };
      try {
        await torusController.provider.sendAsync({
          method: "sign_all_transactions",
          params: {
            message: msg,
          },
        });
        // should not be success
        assert(false);
      } catch (_e) {
        // validate state
        assert(popupStub.calledTwice);
      }
      log.error(result);
    });
    it("embed signMessage flow", async () => {
      // mock msg popup handler
      popupResult = { approve: true };
      const msg = "This is test message";
      const result = await torusController.provider.sendAsync({
        method: "sign_message",
        params: {
          data: Buffer.from(msg, "utf8"),
        },
      });

      log.error(result);
      // reject
    });

    xit("gasless transaction (dapp as feepayer) flow", async () => {
      torusController.init({ _config: DEFAULT_CONFIG, _state: DEFAULT_STATE });
    });

    xit("send multiInstruction flow", async () => {
      torusController.init({ _config: DEFAULT_CONFIG, _state: DEFAULT_STATE });
    });

    // xit("embed flow", async () => {
    //   torusController.init({ _config: DEFAULT_CONFIG, _state: DEFAULT_STATE });
    // });
  });

  // Wallet Api
  // Provider API tests
  describe("#Embeded Wallet Api", () => {
    //  "logout" is covered in login logout flow

    xit("returns first address when dapp calls getAccounts", async () => {
      // await torusController.addAccount(TestAccount.key, testAccount.address)
      // await torusController.setSelectedAccount(testAccount.address)
      // inject postasync
      const result = await torusController.provider.sendAsync({
        method: "getAccounts",
        params: [],
      });
      log.error(result);
      // assert.strictEqual(res.length, 1)
      // assert.strictEqual(res[0], testAccount.address)
    });

    // provider changed
    xit("changed provider", async () => {
      // mock provider popup handler
      const result = torusController.communicationProvider.sendAsync({
        method: "set_provider",
        params: SUPPORTED_NETWORKS.testnet,
      });
      // await mock popup called
      // validate state
      // mock approve
      await result;
      // validate state
      log.error(result);
    });
  });

  //   describe('#newUnsignedMessage', () => {
  //     let messageParameters
  //     let metamaskMsgs
  //     let messages
  //     let messageId

  //     const address = testAccount.address
  //     const data = '0x43727970746f6b697474696573'

  //     beforeEach(async () => {
  //       sandbox.stub(torusController, 'getBalance')
  //       torusController.getBalance.callsFake(() => Promise.resolve('0x0'))

  //       // await metamaskController.createNewVaultAndRestore('foobar1337', TEST_SEED_ALT)
  //       // await metamaskController.createNewVaultAndKeychain('password')
  //       // log.info(await metamaskController.keyringController.getAccounts())

  //       await torusController.addAccount(testAccount.key)

  //       messageParameters = {
  //         from: address,
  //         data,
  //       }

  //       const promise = torusController.newUnsignedMessage(messageParameters)
  //       // handle the promise so it doesn't throw an unhandledRejection
  //       promise.then(noop).catch(noop)

  //       metamaskMsgs = torusController.messageManager.getUnapprovedMsgs()
  //       messages = torusController.messageManager.messages
  //       messageId = Object.keys(metamaskMsgs)[0]
  //       messages[0].msgParams.metamaskId = parseInt(messageId)
  //     })

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

  //   describe('#_onKeyringControllerUpdate', () => {
  //     it('should update selected address if keyrings are provided', async () => {
  //       // const addAddresses = sinon.fake()
  //       // const getSelectedAddress = sinon.fake.returns('0x42')
  //       // const setSelectedAddress = sinon.fake()
  //       const syncWithAddresses = sinon.fake()
  //       const addAccounts = sinon.fake()
  //       const deserialize = sinon.fake.resolves()
  //       const addAccount = sinon.fake()

  //       sandbox.replace(torusController, 'keyringController', {
  //         deserialize,
  //         addAccount,
  //       })
  //       sandbox.replace(torusController, 'accountTracker', {
  //         syncWithAddresses,
  //         addAccounts,
  //       })

  //       const oldState = torusController.getState()
  //       await torusController.initTorusKeyring([testAccount.key], [testAccount.address])

  //       // assert.deepStrictEqual(addAddresses.args, [[['0x1', '0x2']]])
  //       assert.deepStrictEqual(syncWithAddresses.args, [[[testAccount.address]]])
  //       // assert.deepStrictEqual(setSelectedAddress.args, [['0x1']])
  //     })
  //   })
});

// function deferredPromise () {
//   let resolve
//   const promise = new Promise((_resolve) => {
//     resolve = _resolve
//   })
//   return { promise, resolve }
// }

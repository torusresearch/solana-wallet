// import { Connection } from "@solana/web3.js";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { NetworkController, SUPPORTED_NETWORKS } from "@toruslabs/solana-controllers";
import log from "loglevel";
// import assert from "assert";
import nock from "nock";
import sinon from "sinon";

import OpenLoginHandler from "@/auth/OpenLoginHandler";
import config from "@/config";
import TorusController, { DEFAULT_CONFIG, DEFAULT_STATE } from "@/controllers/TorusController";

import { mockConnection } from "./mockConnection";
import { mockData, openloginFaker } from "./mockData";

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
      .reply(200, (uri, body) => {
        log.error(uri);
        log.error(body);
        return JSON.stringify(mockData.coingekco["usd-coin"]);
      });

    const nockBackend = nock("https://solana-api.tor.us").persist();
    nockBackend
      .get("/user")
      .delay(100)
      .query(true)
      .reply(200, (uri) => {
        log.error(uri);
        return JSON.stringify(mockData.backend.user);
      });

    nockBackend.get("/currency?fsym=SOL&tsyms=USD").reply(200, () => JSON.stringify(mockData.backend.currency));

    nockBackend.post("/auth/message").reply(200, () => JSON.stringify(mockData.backend.message));

    nockBackend.post("/auth/verify").reply(200, () => JSON.stringify(mockData.backend.verify));

    nockBackend.post("/user").reply(200, (_uri, _requestbody) => JSON.stringify(mockData.backend.user));

    nockBackend.post("/user/recordLogin").reply(200, () => JSON.stringify(mockData.backend.recordLogin));

    // api.mainnet-beta nock
    nock("https://api.mainnet-beta.solana.com")
      .post("/")
      .reply(200, (data) => {
        log.error(data);
      });

    // Stubing Openlogin
    sandbox.stub(config, "baseUrl").get(() => "http://localhost");
    sandbox.stub(config, "baseRoute").get(() => "http://localhost");
    sandbox.stub(OpenLoginHandler.prototype, "handleLoginWindow").callsFake(async (_) => {
      // log.error("sinon stub working");
      return mockData.openLoginHandler;
    });

    // add sinon method stubs & spies on Controllers and TorusController
    sandbox.stub(NetworkController.prototype, "getConnection").callsFake(mockConnection);
    // sandbox.stub(torusController["preferencesController"], 'sync')
    // sandbox.stub(torusController["networkController"], 'getConnection').callsFake(() => mockConnection)

    torusController = new TorusController({ _config: DEFAULT_CONFIG, _state: DEFAULT_STATE });
    log.info(torusController);
    torusController.init({ _config: DEFAULT_CONFIG, _state: DEFAULT_STATE });

    // spy transaction controller event
    // sandbox.spy(torusController, 'transac')
    // fake openlogin
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    nock.cleanAll();
    sandbox.restore();
    clock.restore();
  });
  // Initialization
  describe("#Initialization flow", () => {
    it("trigger login flow", async () => {
      // log.error(torusController);
      sandbox.stub(mockData, "openLoginHandler").get(() => openloginFaker[2]);
      await torusController.triggerLogin({ loginProvider: "google" });
      // log.error(result);
      clock.tick(1000);

      // validate login state

      // logout flow
      await torusController.handleLogout();
      // validate logout state
    });
  });

  // Login Flow
  describe("#Login flow", () => {
    it("embed trigger login flow", async () => {
      const result = torusController.provider.sendAsync({
        method: "solana_requestAccounts",
        params: [],
      });
      // Frame.vue on click login
      torusController.triggerLogin({ loginProvider: "google" });

      // wait for login complete
      await result;
      // log.error(result);

      //  to validate state
      const logoutResult = await torusController.communicationProvider.sendAsync({
        method: "logout",
        params: [],
      });
      log.error(logoutResult);
      // validate logout state
    });
    // add account
    xit("add newAccount flow", async () => {
      torusController.triggerLogin({ loginProvider: "google" });
      torusController.importExternalAccount("", torusController.userInfo);
      // validate state
    });
  });

  // transfer flow
  describe("#Transfer flow", () => {
    beforeEach(() => {
      torusController.triggerLogin({ loginProvider: "google" });
    });
    xit("Sol Transfer", async () => {
      // torusController.transfer();
      // check state
    });
    xit("Spl Transfer", async () => {
      // torusController.transfer();
      // check state
    });
    // opportunistic update on activities and balance for sol token nft transfer
    // check transaction controller flow
  });

  // on update
  describe("#On Update flow", () => {
    xit("embed trigger login flow", async () => {
      torusController.init({ _config: DEFAULT_CONFIG, _state: DEFAULT_STATE });
    });
    // network changed trigger updates
    // selecteAddress wallet changed trigger updates
    // onPollingBlock trigger updates
  });

  // Embed API call
  describe("#Embeded Solana API flow", () => {
    const transferInstruction = () => {
      return SystemProgram.transfer({
        fromPubkey: new PublicKey(""),
        toPubkey: new PublicKey(""),
        lamports: Math.random() * LAMPORTS_PER_SOL,
      });
    };
    beforeEach(() => {
      torusController.triggerLogin({ loginProvider: "google" });
      // mock popup handler
    });

    // Solana Api
    xit("embed sendTransaction flow", async () => {
      const tx = new Transaction({}); // Transaction.serialize
      const msg = tx.add(transferInstruction()).serialize({ requireAllSignatures: false });
      const result = torusController.provider.sendAsync({
        method: "send_transaction",
        params: {
          message: msg,
        },
      });

      // wait for mock up handler called
      // validate state
      // mockup handler response
      // validate state
      log.error(result);
    });
    xit("embed signTransaction flow", async () => {
      const msg = "";
      const result = torusController.provider.sendAsync({
        method: "sign_transaction",
        params: {
          message: msg,
        },
      });

      // wait for mock up handler called
      // validate state
      // mockup handler response
      // validate state
      log.error(result);
    });
    xit("embed signAllTransaction flow", async () => {
      const msg = [""];
      const result = torusController.provider.sendAsync({
        method: "sign_transaction",
        params: {
          message: msg,
        },
      });

      // wait for mock up handler called
      // validate state
      // mockup handler response
      // validate state
      log.error(result);
    });
    xit("embed signMessage flow", async () => {
      // mock msg popup handler
      const msg = "";
      const result = torusController.provider.sendAsync({
        method: "sign_message",
        params: {
          message: msg,
        },
      });

      // wait for mock up handler called
      // validate state
      // mockup handler response
      // validate state
      log.error(result);
      // approve
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

  //     it('errors when an primary keyring is does not exist', async () => {
  //       await addNewAccount
  //       const state = torusController.accountTracker.store.getState()
  //       assert.deepStrictEqual(await torusController.keyringController.getAccounts(), [testAccount.address])
  //       assert.deepStrictEqual(await Object.keys(state.accounts), [testAccount.address])
  //     })
  //   })

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

  //     it('persists address from msg params', () => {
  //       assert.strictEqual(metamaskMsgs[messageId].msgParams.from, address)
  //     })

  //     it('persists data from msg params', () => {
  //       assert.strictEqual(metamaskMsgs[messageId].msgParams.data, data)
  //     })

  //     it('sets the status to unapproved', () => {
  //       assert.strictEqual(metamaskMsgs[messageId].status, 'unapproved')
  //     })

  //     it('sets the type to eth_sign', () => {
  //       assert.strictEqual(metamaskMsgs[messageId].type, 'eth_sign')
  //     })

  //     it('rejects the message', () => {
  //       const messageIdInt = parseInt(messageId)
  //       torusController.cancelMessage(messageIdInt, noop)
  //       assert.strictEqual(messages[0].status, 'rejected')
  //     })

  //     it('errors when signing a message', async function () {
  //       try {
  //         await torusController.signMessage(messages[0].msgParams)
  //       } catch (error) {
  //         assert.strictEqual(error.message, 'Expected message to be an Uint8Array with length 32')
  //       }
  //     })
  //   })

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

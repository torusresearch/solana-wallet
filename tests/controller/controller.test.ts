// import { Connection } from "@solana/web3.js";
import log from "loglevel";
// import assert from "assert";
import nock from "nock";
import sinon from "sinon";

import TorusController, { DEFAULT_CONFIG, DEFAULT_STATE } from "@/controllers/TorusController";

// import createTxMeta from '../lib/createTxMeta'

// const TEST_ADDRESS = "0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc";
// const CUSTOM_RPC_URL = "http://localhost:8545";
describe("TorusController", () => {
  let torusController: TorusController;
  const sandbox = sinon.createSandbox();
  // const noop = () => {};

  beforeEach(async () => {
    nock.cleanAll();
    nock.enableNetConnect((host) => host.includes("localhost") || host.includes("mainnet.infura.io:443"));

    nock("https://min-api.cryptocompare.com")
      .get("/data/price")
      .query((url) => url.fsym === "ETH" && url.tsyms === "USD")
      .reply(
        200,
        ""
        // '{"base": "ETH", "quote": "USD", "bid": 288.45, "ask": 288.46, "volume": 112888.17569277, "exchange": "bitfinex", "total_volume": 272175.00106721005, "num_exchanges": 8, "timestamp": 1506444677}'
      );

    // nock("https://min-api.cryptocompare.com")
    //   .get("/data/price")
    //   .query((url) => url.fsym === "ETH" && url.tsyms === "JPY")
    //   .reply(
    //     200,
    //     "{\"base\": \"ETH\", \"quote\": \"JPY\", \"bid\": 32300.0, \"ask\": 32400.0, \"volume\": 247.4616071, \"exchange\": \"kraken\", \"total_volume\": 247.4616071, \"num_exchanges\": 1, \"timestamp\": 1506444676}"
    //   );

    nock("https://api.infura.io").persist().get(/.*/).reply(200);

    // nock("https://min-api.cryptocompare.com").persist().get(/.*/).reply(200, '{"JPY":12415.9}');

    torusController = new TorusController({ _config: DEFAULT_CONFIG, _state: DEFAULT_STATE });
    // add sinon method stubs & spies
    // const mockConnection = {} as Connection;
    log.info(torusController);
    // sandbox.stub(torusController["preferencesController"], 'sync')
    // sandbox.stub(torusController["networkController"], 'getConnection').callsFake(() => mockConnection)

    // fake openlogin login?
    // await torusController.prefsController.init({ address: testAccount.address, rehydrate: true, jwtToken: 'hello', dispatch: noop, commit: noop })
    // torusController.prefsController.setSelectedAddress(testAccount.address)

    // spy transaction controller event
    // sandbox.spy(torusController, 'transac')
  });

  afterEach(() => {
    nock.cleanAll();
    sandbox.restore();
  });

  // Provider API tests
  describe("#getAccounts", function () {
    it("returns first address when dapp calls getAccounts", async function () {
      // fake Openlogin login?
      // await torusController.addAccount(TestAccount.key, testAccount.address)
      // await torusController.setSelectedAccount(testAccount.address)
      // fake postmessage provider call from embed
      // provider call get Account
      // const res = await torusController.getAccounts()
      // assert.strictEqual(res.length, 1)
      // assert.strictEqual(res[0], testAccount.address)
    });
  });

  //   describe('#getBalance', () => {
  //     it('should return the balance known by accountTracker', async () => {

  //       // Provider call getBalance ?
  //       const gotten = await torusController.userSOLBalance
  //       assert.strictEqual(balance, gotten)
  //     })

  //   })

  //   describe('#setCustomRpc', function () {

  //     beforeEach(function () {
  //     })

  //     it('returns custom RPC that when called', async function () {
  //       // provider call set custome rpc
  //       // rpcTarget = torusController.setCustomRpc(CUSTOM_RPC_URL)
  //       // assert.strictEqual(await rpcTarget, CUSTOM_RPC_URL)
  //     })

  //     it('changes the network controller rpc', function () {
  //       // const networkControllerState = torusController.networkController.store.getState()
  //       // assert.strictEqual(networkControllerState.provider.rpcUrl, CUSTOM_RPC_URL)
  //     })
  //   })

  //   describe('#setCurrentCurrency', () => {
  //     let defaultMetaMaskCurrency

  //     beforeEach(() => {
  //       defaultMetaMaskCurrency = torusController.currencyController.getCurrentCurrency()
  //     })

  //     it('defaults to usd', () => {
  //       assert.strictEqual(defaultMetaMaskCurrency, 'usd')
  //     })

  //     it('sets currency to JPY', () => {
  //       torusController.setCurrentCurrency({ selectedCurrency: 'JPY' }, noop)
  //       assert.strictEqual(torusController.currencyController.getCurrentCurrency(), 'jpy')
  //     })
  //   })

  //   describe('#addNewAccount', () => {
  //     let addNewAccount

  //     beforeEach(() => {
  //       addNewAccount = torusController.addAccount(testAccount.key, testAccount.address)
  //     })

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

  //   describe('#newUnsignedPersonalMessage', () => {
  //     it('errors with no from in msgParams', async () => {
  //       const messageParameters = {
  //         data,
  //       }
  //       try {
  //         await torusController.newUnsignedPersonalMessage(messageParameters)
  //         assert.fail('should have thrown')
  //       } catch (error) {
  //         assert.strictEqual(error.message, 'MetaMask Message Signature: from field is required.')
  //       }
  //     })

  //     let messageParameters
  //     let metamaskPersonalMsgs
  //     let personalMessages
  //     let messageId

  //     const address = testAccount.address
  //     const data = '0x43727970746f6b697474696573'

  //     beforeEach(async () => {
  //       sandbox.stub(torusController, 'getBalance')
  //       torusController.getBalance.callsFake(() => Promise.resolve('0x0'))

  //       // await metamaskController.createNewVaultAndRestore('foobar1337', TEST_SEED_ALT)
  //       await torusController.addAccount(testAccount.key)

  //       messageParameters = {
  //         from: address,
  //         data,
  //       }

  //       const promise = torusController.newUnsignedPersonalMessage(messageParameters)
  //       // handle the promise so it doesn't throw an unhandledRejection
  //       promise.then(noop).catch(noop)

  //       metamaskPersonalMsgs = torusController.personalMessageManager.getUnapprovedMsgs()
  //       personalMessages = torusController.personalMessageManager.messages
  //       messageId = Object.keys(metamaskPersonalMsgs)[0]
  //       personalMessages[0].msgParams.metamaskId = parseInt(messageId)
  //     })

  //     it('persists address from msg params', () => {
  //       assert.strictEqual(metamaskPersonalMsgs[messageId].msgParams.from, address)
  //     })

  //     it('persists data from msg params', () => {
  //       assert.strictEqual(metamaskPersonalMsgs[messageId].msgParams.data, data)
  //     })

  //     it('sets the status to unapproved', () => {
  //       assert.strictEqual(metamaskPersonalMsgs[messageId].status, 'unapproved')
  //     })

  //     it('sets the type to personal_sign', () => {
  //       assert.strictEqual(metamaskPersonalMsgs[messageId].type, 'personal_sign')
  //     })

  //     it('rejects the message', () => {
  //       const messageIdInt = parseInt(messageId)
  //       torusController.cancelPersonalMessage(messageIdInt, noop)
  //       assert.strictEqual(personalMessages[0].status, 'rejected')
  //     })

  //     it('errors when signing a message', async function () {
  //       await torusController.signPersonalMessage(personalMessages[0].msgParams)
  //       assert.strictEqual(metamaskPersonalMsgs[messageId].status, 'signed') // Not signed cause no keyringcontroller
  //       log.info(metamaskPersonalMsgs[messageId].rawSig)
  //       assert.strictEqual(
  //         metamaskPersonalMsgs[messageId].rawSig,
  //         '0x77e7a8abbeca5c3041aaf4502a09f3379f41ed3e0a64176d03bcc3061a624a1529e130b0d198da2c743b5344ab52efce4fca311c133302b75bd6b3131f4eccfb1b'
  //       )
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

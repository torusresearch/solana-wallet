import { JRPCRequest } from "@toruslabs/openlogin-jrpc";
import log from "loglevel";
import nock from "nock";

import { WALLET_SUPPORTED_NETWORKS } from "@/utils/const";
import { TorusStorageLayerAPIParams } from "@/utils/tkey/baseTypes/commonTypes";

import { mockBillBoardEvent, mockDapps, mockData, MockStorageLayer, mockTokens, OffChainMetaplexUri, testNetTokenWWW } from "./mockData";

export default () => {
  nock.cleanAll();
  nock.enableNetConnect((host) => host.includes("localhost") || host.includes("mainnet.infura.io:443"));

  nock(OffChainMetaplexUri)
    .persist()
    .defaultReplyHeaders({
      "access-control-allow-origin": "*",
      "access-control-allow-credentials": "true",
    })
    .get("/")
    .reply(200, () => {
      return {
        collection: {},
      };
    });

  nock("https://moonpay-api.tor.us/")
    .persist()
    .get("/sign")
    .query(true)
    .reply(200, () => {
      return { signature: "test" };
    });

  nock("https://api.coingecko.com")
    .persist()
    .defaultReplyHeaders({
      "access-control-allow-origin": "*",
      "access-control-allow-credentials": "true",
    })
    .get("/api/v3/simple/price")
    .query(true)
    .reply(200, (_uri, _body) => {
      // log.error(uri);
      return JSON.stringify(mockData.coingekco["usd-coin"]);
    });

  const nockBackend = nock("https://solana-api.tor.us").persist();
  nockBackend
    .get("/user")
    .delay(100)
    .query(true)
    .reply(200, (_uri) => {
      log.error(_uri);
      return JSON.stringify(mockData.backend.user);
    });

  nockBackend.get("/currency?fsym=SOL&tsyms=USD").reply(200, () => JSON.stringify(mockData.backend.currency));

  nockBackend.post("/auth/message").reply(200, () => JSON.stringify(mockData.backend.message));

  nockBackend.post("/auth/verify").reply(200, () => JSON.stringify(mockData.backend.verify));

  nockBackend.post("/user").reply(200, (_uri, _requestbody) => JSON.stringify(mockData.backend.user));

  nockBackend.post("/contact").reply(200, (_uri, _requestbody) => JSON.stringify({ data: _requestbody, message: "Contact Added", success: true }));

  nockBackend.post("/customtoken/fetchToken").reply(200, (_uri, _requestbody) => {
    return { response: mockTokens.tokens, success: true };
  });

  nockBackend
    .delete("/contact/46")
    .reply(200, (_uri, _requestbody) => JSON.stringify({ data: { id: 46 }, message: "Contact Deleted", success: true }));

  nockBackend.patch("/user").reply(201, (_uri, _requestbody) => JSON.stringify({ data: _requestbody, success: true }));

  nockBackend.get("/billboard").reply(200, (_uri, _requestbody) => {
    return { success: true, data: mockBillBoardEvent };
  });

  nockBackend.get("/dapps").reply(200, (_uri, _requestbody) => {
    return { success: true, data: mockDapps };
  });

  nockBackend.post("/tokeninfo").reply(200, (_uri: string, _requestbody: { mintAddress: string }) => {
    return { [testNetTokenWWW.address]: testNetTokenWWW };
  });

  nockBackend.post("/customtoken").reply(200, (_uri, _requestbody) => {
    return { data: _requestbody, message: "Custom Token Imported", success: true };
  });

  nockBackend.post("/customToken/fetchToken").reply(200, (_uri, _requestbody) => {
    return { response: mockTokens.tokens, success: true };
  });

  nockBackend.post("/user/recordLogin").reply(200, () => JSON.stringify(mockData.backend.recordLogin));

  nockBackend.post("/transaction").reply(200, () => JSON.stringify(mockData.backend.transaction));

  // api.mainnet-beta nock
  // nock("https://api.mainnet-beta.solana.com")
  nock(WALLET_SUPPORTED_NETWORKS.mainnet.rpcTarget)
    .persist()
    .post("/")
    .reply(200, (_uri: string, body: JRPCRequest<unknown>) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { method, params, ...others } = body;
      // log.error(method);
      if (method === "getHealth" || method === "qn_fetchNFTs") {
        const value = { ...others, result: "ok" };
        // log.error(value);
        return value;
      }
      throw new Error(`Unimplemented mock mainnet rpc method ${body.method}`);
    });

  // api.testnet nock
  nock(WALLET_SUPPORTED_NETWORKS.testnet.rpcTarget)
    .persist()
    .post("/")
    .reply(200, (_uri: string, body: JRPCRequest<unknown>) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { method, params, ...others } = body;
      // log.error("testnet", method);
      if (method === "getHealth" || method === "qn_fetchNFTs") {
        const value = { ...others, result: "ok" };
        // log.error(value);
        return value;
      }
      throw new Error(`Unimplemented mock testnet rpc method ${body.method}`);
    });

  nock("https://api.testnet.solana.com")
    .persist()
    .post("/")
    .reply(200, (_uri: string, body: JRPCRequest<unknown>) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { method, params, ...others } = body;
      // log.error("testnet", method);
      if (method === "getHealth" || method === "qn_fetchNFTs") {
        const value = { ...others, result: "ok" };
        // log.error(value);
        return value;
      }
      throw new Error(`Unimplemented mock testnet rpc method ${body.method}`);
    });

  // api.devnet nock
  // nock("https://api.devnet.solana.com")
  nock(WALLET_SUPPORTED_NETWORKS.devnet.rpcTarget)
    .persist()
    .post("/")
    .reply(200, (_uri: string, body: JRPCRequest<unknown>) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { method, params, ...others } = body;
      // log.error("devnet", method);
      if (method === "getHealth") {
        const value = { ...others, result: "ok" };
        // log.error(value);
        return value;
      }
      throw new Error(`Unimplemented mock devnet rpc method ${body.method}`);
    });

  // Open login
  nock("https://solana-openlogin-state.tor.us")
    .persist()
    .defaultReplyHeaders({
      "access-control-allow-origin": "*",
      "access-control-allow-credentials": "true",
    })
    .post("/set")
    .reply(200, (_uri, body) => {
      const data = body as TorusStorageLayerAPIParams;
      const pointer = `${data.pub_key_X}:${data.pub_key_Y}`;
      MockStorageLayer[pointer] = data;
      return { message: "", success: true };
    });

  nock("https://solana-openlogin-state.tor.us")
    .persist()
    .defaultReplyHeaders({
      "access-control-allow-origin": "*",
      "access-control-allow-credentials": "true",
    })
    .post("/get")
    .reply(200, async (_uri, body) => {
      const data = body as TorusStorageLayerAPIParams;
      const pointer = `${data.pub_key_X}:${data.pub_key_Y}`;
      const result = MockStorageLayer[pointer];
      return { message: (result.set_data as { data: string; timestamp: string }).data, success: true };
    });
};

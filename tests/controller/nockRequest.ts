import { JRPCRequest } from "@toruslabs/openlogin-jrpc";
import log from "loglevel";
import nock from "nock";

import { WALLET_SUPPORTED_NETWORKS } from "@/utils/const";

import { mockData, OffChainMetaplexUri } from "./mockData";

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
      // log.error(body);
      return JSON.stringify(mockData.coingekco["usd-coin"]);
    });

  const nockBackend = nock("https://solana-api.tor.us").persist();
  nockBackend
    .get("/user")
    .delay(100)
    .query(true)
    .reply(200, (_uri) => {
      log.info(_uri);
      return JSON.stringify(mockData.backend.user);
    });

  nockBackend.get("/currency?fsym=SOL&tsyms=USD").reply(200, () => JSON.stringify(mockData.backend.currency));

  nockBackend.post("/auth/message").reply(200, () => JSON.stringify(mockData.backend.message));

  nockBackend.post("/auth/verify").reply(200, () => JSON.stringify(mockData.backend.verify));

  nockBackend.post("/user").reply(200, (_uri, _requestbody) => JSON.stringify(mockData.backend.user));

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

  nock("https://solana-openlogin-state.tor.us").persist().post("/set").reply(200, { message: "", success: true });
};

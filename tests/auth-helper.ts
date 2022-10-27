import { BrowserContext, Page } from "@playwright/test";
import { Keypair } from "@solana/web3.js";
import nacl from "@toruslabs/tweetnacl-js";
import axios from "axios";
import base58 from "bs58";
import { ec as EC } from "elliptic";
import { memoize } from "lodash-es";

import type { OpenLoginBackendState } from "@/utils/enums";
import TorusStorageLayer from "@/utils/tkey/storageLayer";

import { getBackendDomain, getDomain, getStateDomain } from "./utils";

const ec = new EC("secp256k1");
export const EPHEMERAL_KEYPAIR = ec.genKeyPair({ entropy: "ad1238470128347018934701983470183478sfa" });
// export const EPHEMERAL_SECRET_KEY = "JE6FauN4iF56b9aC8yrD314AYptuDHxzoChzkod5MxYR";

export const PUB_ADDRESS = "Bxfp7RZLPLEiJhSMiHb3JrLrNdop94gWY5NGhG9KepL9";
export const SECRET_KEY = "rJ2u984seEczhz7bRva9jn7E3RqaqzJpkh81Lmmnj6oAFMDfZqu2KGXLHo9MgmW6rFfPYsoDXtJsGbZojQhefcm";

export const IMPORT_ACC_ADDRESS = "H3N28hUVVRhZW1zyM8dGQTrKztRHhgbS1nJg9nSXghet";
export const IMPORT_ACC_SECRET_KEY = "4md5HAy1iZvyGVuwssQu8Kn78gnm7RHfpC8FLSHcsA1Wo1JwD6jNu8vHPLLSaFxXXD753vMaFBdbZYFvvmQtborU";

const storageLayer = new TorusStorageLayer({ hostUrl: getStateDomain() });
export const getJWT = memoize(async (): Promise<{ success: boolean; token: string }> => {
  const { message } = (
    await axios.post(`${getBackendDomain()}/auth/message`, {
      public_address: PUB_ADDRESS,
    })
  ).data;

  // SIGN THE MESSAGE USING PRIVATE KEY
  const kp = Keypair.fromSecretKey(base58.decode(SECRET_KEY));
  const signedMsg = nacl.sign.detached(Buffer.from(message, "utf8"), kp.secretKey);
  const signedMsgToString = Buffer.from(signedMsg).toString("hex");

  // SEND SIGNED MESSAGE AND GET JWT TOKEN
  return (
    await axios.post(`${getBackendDomain()}/auth/verify`, {
      public_address: PUB_ADDRESS,
      signed_message: signedMsgToString,
    })
  ).data;
});

const privKey = EPHEMERAL_KEYPAIR.getPrivate();

export const createRedisKey = memoize(async () => {
  const input: OpenLoginBackendState = {
    publicKey: PUB_ADDRESS,
    privateKey: SECRET_KEY,
    accounts: [
      {
        address: PUB_ADDRESS,
        solanaPrivKey: SECRET_KEY,
        privKey: "",
        app: "test app",
        name: "test app name",
      },
    ],
    userInfo: {
      email: "torussolanatesting@gmail.com",
      name: "Torus Testing",
      profileImage: "https://lh3.googleusercontent.com/a/AATXAJwH-UUrn4YSmInT-o8ptgLTq80TGs9lemvhzXXg=s96-c",
      aggregateVerifier: "tkey-google-lrc",
      verifier: "torus",
      verifierId: "torussolanatesting@gmail.com",
      typeOfLogin: "google",
    },
  };
  const params = storageLayer.generateMetadataParams(await TorusStorageLayer.serializeMetadataParamsInput(input, privKey), privKey);

  await axios.post(`${getStateDomain()}/set`, params);
});

export async function login(context: BrowserContext, browserName: "chromium" | "webkit" | "firefox"): Promise<Page> {
  await createRedisKey();
  const keyFunction = `window.localStorage.setItem(
    "controllerModule-ephemeral",
    JSON.stringify({
      "priv_key": "${EPHEMERAL_KEYPAIR.getPrivate("hex")}",
      "pub_key": "${EPHEMERAL_KEYPAIR.getPublic("hex")}",
    })
  )`;
  // const { token } = await getJWT();
  const stateFunction = `window.localStorage.setItem(
    "controllerModule",
    JSON.stringify({
      controllerModule: {
        backendRestored: false,
        torusState: {
          "AccountTrackerState": {
          },
          PreferencesControllerState: {
            identities: {
            },
            selectedAddress: "",
          },
          "CurrencyControllerState": {
            "conversionDate": "1665992173.474",
            "conversionRate": 0,
            "currentCurrency": "usd",
            "nativeCurrency": "sol",
            "ticker": "sol",
            "tokenPriceMap": {
              "solana": {
                "usd": 30.17,
                "aud": 48.35,
                "cad": 41.7,
                "eur": 30.98,
                "gbp": 26.8,
                "hkd": 236.87,
                "idr": 467704,
                "inr": 2485.86,
                "jpy": 4484.72,
                "php": 1779.78,
                "rub": 1876.1,
                "sgd": 43.06,
                "uah": 1113.3
              }
            },
            "loadState": "loaded"
          },
          "TokenInfoState": {
            "tokenInfoMap": {},
            "metaplexMetaMap": {},
            "unknownSPLTokenInfo": [],
            "unknownNFTs": [],
            "metaplexLoadingState": "loaded",
            "tokenInfoLoadingState": "loaded",
            "tokenPriceMap": {}
          },
        },
      },
    })
  )`;
  if (browserName === "chromium") {
    await context.grantPermissions(["clipboard-read"]);
  }
  await context.addInitScript({ content: keyFunction });
  await context.addInitScript({ content: stateFunction });
  const page = await context.newPage();
  await page.goto(getDomain());
  return page;
}

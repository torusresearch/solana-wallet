import { BrowserContext, Page } from "@playwright/test";
import { Keypair } from "@solana/web3.js";
import nacl from "@toruslabs/tweetnacl-js";
import axios from "axios";
import base58 from "bs58";
import { ec as EC } from "elliptic";

import TorusStorageLayer from "@/utils/tkey/storageLayer";

import { changeLanguage, getBackendDomain, getDomain, getStateDomain, wait } from "./utils";

const ec = new EC("secp256k1");
export const EPHEMERAL_KEYPAIR = ec.genKeyPair({ entropy: "ad1238470128347018934701983470183478sfa" });
// export const EPHEMERAL_SECRET_KEY = "JE6FauN4iF56b9aC8yrD314AYptuDHxzoChzkod5MxYR";

export const PUB_ADDRESS = "Bxfp7RZLPLEiJhSMiHb3JrLrNdop94gWY5NGhG9KepL9";
export const SECRET_KEY = "rJ2u984seEczhz7bRva9jn7E3RqaqzJpkh81Lmmnj6oAFMDfZqu2KGXLHo9MgmW6rFfPYsoDXtJsGbZojQhefcm";

export const IMPORT_ACC_ADDRESS = "H3N28hUVVRhZW1zyM8dGQTrKztRHhgbS1nJg9nSXghet";
export const IMPORT_ACC_SECRET_KEY = "4md5HAy1iZvyGVuwssQu8Kn78gnm7RHfpC8FLSHcsA1Wo1JwD6jNu8vHPLLSaFxXXD753vMaFBdbZYFvvmQtborU";

const storageLayer = new TorusStorageLayer({ hostUrl: getStateDomain() });
async function getJWT(): Promise<{ success: boolean; token: string }> {
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
}

const privKey = EPHEMERAL_KEYPAIR.getPrivate();

export async function createRedisKey() {
  const input = { publicKey: PUB_ADDRESS, privateKey: SECRET_KEY };
  const params = storageLayer.generateMetadataParams(await TorusStorageLayer.serializeMetadataParamsInput(input, privKey), privKey);

  await axios.post(`${getStateDomain()}/set`, params);
}

export async function login(context: BrowserContext, browserName: "chromium" | "webkit" | "firefox"): Promise<Page> {
  await createRedisKey();
  const keyFunction = `window.localStorage.setItem(
    "controllerModule-ephemeral-http://localhost:8080",
    JSON.stringify({
      "priv_key": "${EPHEMERAL_KEYPAIR.getPrivate("hex")}",
      "pub_key": "${EPHEMERAL_KEYPAIR.getPublic("hex")}",
    })
  )`;
  const { token } = await getJWT();
  const stateFunction = `window.localStorage.setItem(
    "controllerModule",
    JSON.stringify({
      controllerModule: {
        backendRestored: false,
        torusState: {
          "AccountTrackerState": {
            "accounts": {
              "${PUB_ADDRESS}": {
                "balance": "0"
              }
            }
          },
          PreferencesControllerState: {
            identities: {
              ${PUB_ADDRESS}: {
                jwtToken: "${token}",
                userInfo: {
                  email: "torussolanatesting@gmail.com",
                  name: "Torus Testing",
                  profileImage: "https://lh3.googleusercontent.com/a/AATXAJwH-UUrn4YSmInT-o8ptgLTq80TGs9lemvhzXXg=s96-c",
                  aggregateVerifier: "tkey-google-lrc",
                  verifier: "torus",
                  verifierId: "torussolanatesting@gmail.com",
                  typeOfLogin: "google",
                },
                currentNetworkTxsList: [],
                contacts: [],
                locale: "en",
              },
            },
            selectedAddress: "${PUB_ADDRESS}",
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
  await changeLanguage(page, "english");
  await wait(500);
  await page.locator("text=Account Balance").waitFor();
  return page;
}

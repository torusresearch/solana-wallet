import { BrowserContext, Page } from "@playwright/test";
import { Keypair } from "@solana/web3.js";
import eccrypto from "@toruslabs/eccrypto";
import nacl from "@toruslabs/tweetnacl-js";
import axios from "axios";
import BN from "bn.js";
import base58 from "bs58";
import { memoize } from "lodash-es";
import log from "loglevel";

import TorusStorageLayer from "@/utils/tkey/storageLayer";

import { changeLanguage, getBackendDomain, getDomain, getStateDomain, wait } from "./utils";

// export const EPHEMERAL_SECRET_KEY = "JE6FauN4iF56b9aC8yrD314AYptuDHxzoChzkod5MxYR";
const ecc_privateKey = eccrypto.generatePrivate();
const ecc_publicKey = eccrypto.getPublic(ecc_privateKey);
export const PUB_ADDRESS = "Bxfp7RZLPLEiJhSMiHb3JrLrNdop94gWY5NGhG9KepL9";
export const SECRET_KEY = "rJ2u984seEczhz7bRva9jn7E3RqaqzJpkh81Lmmnj6oAFMDfZqu2KGXLHo9MgmW6rFfPYsoDXtJsGbZojQhefcm";

export const IMPORT_ACC_ADDRESS = "H3N28hUVVRhZW1zyM8dGQTrKztRHhgbS1nJg9nSXghet";
export const IMPORT_ACC_SECRET_KEY = "4md5HAy1iZvyGVuwssQu8Kn78gnm7RHfpC8FLSHcsA1Wo1JwD6jNu8vHPLLSaFxXXD753vMaFBdbZYFvvmQtborU";

const storageLayer = new TorusStorageLayer({ hostUrl: getStateDomain() });

export const getJWT = memoize(async () => {
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

export const createRedisKey = memoize(async () => {
  const input = { publicKey: PUB_ADDRESS, privateKey: SECRET_KEY };
  const params = storageLayer.generateMetadataParams(
    await TorusStorageLayer.serializeMetadataParamsInput(input, new BN(ecc_privateKey)),
    new BN(ecc_privateKey)
  );
  await axios.post(`${getStateDomain()}/set`, params);
});

export async function login(context: BrowserContext, isMobile = false): Promise<Page> {
  await createRedisKey();
  const keyFunction = `window.localStorage.setItem(
    "controllerModule-ephemeral-http://localhost:8080",
    JSON.stringify({
      "priv_key": "${ecc_privateKey.toString("hex")}",
      "pub_key": "${ecc_publicKey.toString("hex")}",
    })
  )`;
  let token = "";
  try {
    token = (await getJWT()).token;

    log.info("Token generated token", token);
  } catch (e) {}
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
                "currentNetworkTxsList": [],
                "contacts": [],
                "locale": "en",
              },
            },
            selectedAddress: "${PUB_ADDRESS}",
          },
        },
      },
    })
  )`;
  await context.addInitScript({ content: keyFunction });
  await context.addInitScript({ content: stateFunction });
  await context.grantPermissions(["clipboard-read"]);
  const page = await context.newPage();
  await page.goto(getDomain());
  if (!isMobile) {
    await changeLanguage(page, "english");
    await wait(500);
    await page.locator("text=Account Balance").waitFor({ state: "visible" });
  }
  return page;
}

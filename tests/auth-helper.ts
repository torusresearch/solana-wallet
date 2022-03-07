import { BrowserContext, Page } from "@playwright/test";
import { Keypair } from "@solana/web3.js";
import nacl from "@toruslabs/tweetnacl-js";
import axios from "axios";
import base58 from "bs58";
import stringify from "safe-stable-stringify";

import { changeLanguage, getBackendDomain, getDomain, getStateDomain, wait } from "./utils";

export const EPHEMERAL_SECRET_KEY = "JE6FauN4iF56b9aC8yrD314AYptuDHxzoChzkod5MxYR";

export const PUB_ADDRESS = "Bxfp7RZLPLEiJhSMiHb3JrLrNdop94gWY5NGhG9KepL9";
export const SECRET_KEY = "rJ2u984seEczhz7bRva9jn7E3RqaqzJpkh81Lmmnj6oAFMDfZqu2KGXLHo9MgmW6rFfPYsoDXtJsGbZojQhefcm";

export const IMPORT_ACC_ADDRESS = "H3N28hUVVRhZW1zyM8dGQTrKztRHhgbS1nJg9nSXghet";
export const IMPORT_ACC_SECRET_KEY = "4md5HAy1iZvyGVuwssQu8Kn78gnm7RHfpC8FLSHcsA1Wo1JwD6jNu8vHPLLSaFxXXD753vMaFBdbZYFvvmQtborU";

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

export async function createRedisKey() {
  const nonce = nacl.randomBytes(24); // random nonce is required for encryption as per spec
  const stateString = stringify({ publicKey: PUB_ADDRESS, privateKey: SECRET_KEY });
  const stateByteArray = Buffer.from(stateString, "utf-8");
  const encryptedState = nacl.secretbox(stateByteArray, nonce, base58.decode(EPHEMERAL_SECRET_KEY).slice(0, 32)); // encrypt state with tempKey

  const timestamp = Date.now();
  const setData = { data: Buffer.from(encryptedState).toString("hex"), timestamp, nonce: Buffer.from(nonce).toString("hex") }; // tkey metadata structure
  const dataHash = nacl.hash(Buffer.from(stringify(setData), "utf-8"));
  const signature = nacl.sign.detached(dataHash, base58.decode(SECRET_KEY));
  const signatureString = Buffer.from(signature).toString("hex");

  await axios.post(`${getStateDomain()}/set`, { pub_key: PUB_ADDRESS, signature: signatureString, set_data: setData });
}

export async function login(context: BrowserContext): Promise<Page> {
  await createRedisKey();
  const keyFunction = `window.localStorage.setItem(
    "controllerModule-ephemeral",
    JSON.stringify({
      "priv_key": "${EPHEMERAL_SECRET_KEY}",
      "pub_key": "${PUB_ADDRESS}",
    })
  )`;
  const { token } = await getJWT();
  const stateFunction = `window.localStorage.setItem(
    "controllerModule",
    JSON.stringify({
      controllerModule: {
        backendRestored: false,
        torusState: {
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
  await context.addInitScript({ content: keyFunction });
  await context.addInitScript({ content: stateFunction });
  await context.grantPermissions(["clipboard-read"]);
  const page = await context.newPage();
  await page.goto(getDomain());
  await changeLanguage(page, "english");
  await wait(500);
  await page.locator("text=Account Balance").waitFor();
  return page;
}

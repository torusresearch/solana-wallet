import { BrowserContext, Page } from "@playwright/test";
import { Keypair } from "@solana/web3.js";
import nacl from "@toruslabs/tweetnacl-js";
import axios from "axios";
import base58 from "bs58";
import stringify from "safe-stable-stringify";

import { getBackendDomain, getDomain, getStateDomain } from "./utils";

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
  const { token } = await getJWT();
  const userInfo = (
    await axios.get(`${getBackendDomain()}/user?fetchTx=false`, {
      headers: {
        authorization: `Bearer ${token}`,
      },
    })
  ).data;
  const saveState = {
    touchIDPreference: "disabled",
    email: userInfo.data.verified_id,
    aggregateVerifier: "tkey-google-lrc",
    name: "Testing Account",
    profileImage: "https://lh3.googleusercontent.com/a/AATXAJzAoycX3Gsashp68ugbY1Fss8kpzSIwvfN5KIAr=s96-c",
    typeOfLogin: "google",
    verifier: userInfo.data.verifier,
    verifierId: userInfo.data.verifier_id,
    appState: "eyJpbnN0YW5jZUlkIjoieHIyM2YyMXRsbyJ9",
  };
  const nonce = nacl.randomBytes(24); // random nonce is required for encryption as per spec
  const stateString = stringify({ ...saveState, private_key: SECRET_KEY });
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
  const stateFunction = `window.localStorage.setItem(
    "controllerModule",
    JSON.stringify({
      "priv_key": "${EPHEMERAL_SECRET_KEY}",
      "pub_key": "${PUB_ADDRESS}",
    })
  )`;
  await context.addInitScript({ content: stateFunction });
  const page = await context.newPage();
  await page.goto(getDomain());

  await page.locator("text=Account Balance").waitFor();

  // await ensureTextualElementExists(page, "TOTAL VALUE");
  /*  await page.waitForFunction(
    () => {
      // eslint-disable-next-line no-underscore-dangle
      const { controllerModule } = (window as any).$store._state.data;
      if (controllerModule?.torusState?.PreferencesControllerState?.selectedAddress) return true;
      return false;
    },
    null,
    { polling: 500 }
  ); */
  return page;
}

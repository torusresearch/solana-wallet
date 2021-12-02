import { BrowserContext, Page } from "@playwright/test";
import { Keypair } from "@solana/web3.js";
import axios from "axios";
import base58 from "bs58";
// eslint-disable-next-line import/no-extraneous-dependencies
import nacl from "tweetnacl";

import { getBackendDomain, getDomain } from "./utils";

const PUB_ADDRESS = "Bxfp7RZLPLEiJhSMiHb3JrLrNdop94gWY5NGhG9KepL9";
const SECRET_KEY = "rJ2u984seEczhz7bRva9jn7E3RqaqzJpkh81Lmmnj6oAFMDfZqu2KGXLHo9MgmW6rFfPYsoDXtJsGbZojQhefcm";

async function getJWT(): Promise<{ success: boolean; token: string }> {
  const { message } = (await axios.post(`${getBackendDomain()}/auth/message`, { public_address: PUB_ADDRESS })).data;

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

export async function login(context: BrowserContext): Promise<Page> {
  const { token } = await getJWT();
  const stateFunction = `window.sessionStorage.setItem(
    "controllerModule",
    JSON.stringify({
      controllerModule: {
        torusState: {
          KeyringControllerState: {
            wallets: [
              {
                publicKey: "${PUB_ADDRESS}",
                privateKey: "${SECRET_KEY}",
                address: "${PUB_ADDRESS}",
              },
            ],
            keyrings: [],
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
              },
            },
            selectedAddress: "${PUB_ADDRESS}",
          },
        },
      },
    })
  )`;
  await context.addInitScript({ content: stateFunction });
  const page = await context.newPage();
  await page.goto(getDomain());
  return page;
}

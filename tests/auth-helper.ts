import { BrowserContext, Page } from "@playwright/test";

import { getDomain } from "./utils";

export async function login(context: BrowserContext): Promise<Page> {
  await context.addInitScript(() => {
    window.sessionStorage.setItem(
      "controllerModule",
      JSON.stringify({
        controllerModule: {
          torusState: {
            KeyringControllerState: {
              wallets: [
                {
                  publicKey: "Bxfp7RZLPLEiJhSMiHb3JrLrNdop94gWY5NGhG9KepL9",
                  privateKey: "rJ2u984seEczhz7bRva9jn7E3RqaqzJpkh81Lmmnj6oAFMDfZqu2KGXLHo9MgmW6rFfPYsoDXtJsGbZojQhefcm",
                  address: "Bxfp7RZLPLEiJhSMiHb3JrLrNdop94gWY5NGhG9KepL9",
                },
              ],
              keyrings: [],
            },
            PreferencesControllerState: {
              identities: {
                Bxfp7RZLPLEiJhSMiHb3JrLrNdop94gWY5NGhG9KepL9: {
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
              selectedAddress: "Bxfp7RZLPLEiJhSMiHb3JrLrNdop94gWY5NGhG9KepL9",
            },
          },
        },
      })
    );
  });
  const page = await context.newPage();
  await page.goto(getDomain());
  return page;
}

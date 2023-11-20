import { PopupWithBcHandler, randomId } from "@toruslabs/base-controllers";
import { JRPCEngine, SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import { LOGIN_PROVIDER_TYPE, safebtoa } from "@toruslabs/openlogin-utils";
import { Mutex } from "async-mutex";
import log from "loglevel";

import type { OpenLoginPopupResponse } from "@/utils/enums";

import config from "../config";

class OpenLoginHandler {
  private static mutex = new Mutex();

  nonce = randomId();

  windowId?: string;

  loginProvider: LOGIN_PROVIDER_TYPE;

  finalURL: URL = new URL(config.baseRoute);

  extraLoginOptions: Record<string, string> = {};

  constructor({
    windowId,
    loginProvider,
    extraLoginOptions,
  }: {
    windowId?: string;
    loginProvider: LOGIN_PROVIDER_TYPE;
    // Send login_hint here
    extraLoginOptions: Record<string, string>;
  }) {
    this.loginProvider = loginProvider;
    this.windowId = windowId;
    this.extraLoginOptions = extraLoginOptions;
    this.setFinalUrl();
  }

  get state(): string {
    log.info("state check", {
      instanceId: this.nonce,
    });
    return encodeURIComponent(
      safebtoa(
        JSON.stringify({
          instanceId: this.nonce,
        })
      )
    );
  }

  async handleLoginWindow({
    communicationEngine,
    communicationWindowManager,
  }: {
    communicationEngine?: JRPCEngine;
    communicationWindowManager?: SafeEventEmitter;
  } = {}): Promise<OpenLoginPopupResponse> {
    log.info("channel name", this.nonce);
    const verifierWindow = new PopupWithBcHandler<OpenLoginPopupResponse, never>({
      config: {
        dappStorageKey: config.dappStorageKey || undefined,
        communicationEngine,
        communicationWindowManager,
      },
      state: { url: this.finalURL, windowId: this.windowId },
      instanceId: this.nonce,
    });
    const result = await verifierWindow.handle();
    if (result.sessionId) {
      if (config.isStorageAvailable.localStorage) {
        const openloginStore = localStorage.getItem("openlogin_store");
        if (openloginStore) {
          const openloginStoreParsed = JSON.parse(openloginStore);
          openloginStoreParsed.sessionId = result.sessionId;
          localStorage.setItem("openlogin_store", JSON.stringify(openloginStoreParsed));
        } else {
          localStorage.setItem("openlogin_store", JSON.stringify({ sessionId: result.sessionId }));
        }
      }
    }
    return result;
  }

  private setFinalUrl(): void {
    const finalUrl = new URL(`${config.baseRoute}start`);
    finalUrl.searchParams.append("state", this.state);
    finalUrl.searchParams.append("loginProvider", this.loginProvider);
    Object.keys(this.extraLoginOptions).forEach((x) => {
      if (this.extraLoginOptions[x]) finalUrl.searchParams.append(x, this.extraLoginOptions[x]);
    });
    log.info(finalUrl.href);
    this.finalURL = finalUrl;
  }
}

export default OpenLoginHandler;

import { PopupWithBcHandler, randomId } from "@toruslabs/base-controllers";
import { LOGIN_PROVIDER_TYPE } from "@toruslabs/openlogin";
import { safebtoa } from "@toruslabs/openlogin-utils";
import log from "loglevel";

import config from "../config";
import type { OpenLoginPopupResponse } from "../utils/enums";

class OpenLoginHandler {
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

  async handleLoginWindow(): Promise<OpenLoginPopupResponse> {
    log.info("channel name", this.nonce);
    // TODO: send windowStream here
    const verifierWindow = new PopupWithBcHandler<OpenLoginPopupResponse, never>({
      config: { dappStorageKey: config.dappStorageKey || undefined, windowStream: undefined },
      state: { url: this.finalURL, windowId: this.windowId },
      instanceId: this.nonce,
    });
    const result = await verifierWindow.handle();
    return result;
  }
}

export default OpenLoginHandler;

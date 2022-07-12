import { concatSig, UserInfo } from "@toruslabs/base-controllers";
import { BroadcastChannel } from "@toruslabs/broadcast-channel";
import { post } from "@toruslabs/http-helpers";
import bowser from "bowser";
import copyToClipboard from "copy-to-clipboard";
import { ecsign, keccak, privateToAddress, toBuffer } from "ethereumjs-util";
import log from "loglevel";

import config from "@/config";
import { addToast } from "@/modules/app";

import { LOCALE_EN, LOGIN_CONFIG, STORAGE_TYPE } from "./enums";
import { LogoutMessage } from "./interfaces";

export function getStorage(key: STORAGE_TYPE): Storage | undefined {
  if (config.isStorageAvailable[key]) return window[key];
  return undefined;
}

export const isMain = window.self === window.top;

export const copyText = (text: string): void => {
  copyToClipboard(text);
  addToast({ message: "Copied", type: "success" });
};

export function promiseCreator<T>(): {
  resolve: ((value: T | PromiseLike<T>) => void) | null;
  reject: ((reason?: unknown) => void) | null;
  promise: Promise<T>;
} {
  let res: ((value: T | PromiseLike<T>) => void) | null = null;
  let rej: ((reason?: unknown) => void) | null = null;
  const promise = new Promise<T>((resolve, reject): void => {
    res = resolve;
    rej = reject;
  });
  return {
    resolve: res,
    reject: rej,
    promise,
  };
}
export function capitalizeFirstLetter(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}
export function thirdPartyAuthenticators(loginButtons: LOGIN_CONFIG[]): string {
  const finalAuthenticators: string[] = loginButtons
    .reduce((authenticators: string[], authenticator) => {
      if (Object.prototype.hasOwnProperty.call(authenticator, "jwtParameters")) {
        authenticators.push(capitalizeFirstLetter(authenticator.name));
      }
      return authenticators;
    }, [])
    .sort((a, b) => {
      if (a > b) return 1;
      if (a < b) return -1;
      return 0;
    });

  return finalAuthenticators.join(", ");
}

export const supportedCurrencies = (): string[] => {
  const returnArr = [...config.supportedCurrencies];
  // returnArr.unshift(ticker); // add sol in dropdown, disabled for now
  return returnArr;
};

export const normalizeJson = <T>(json: unknown): T => {
  return JSON.parse(JSON.stringify(json));
};

export function getDomainFromUrl(url: string): string {
  let domain: string;
  try {
    domain = new URL(url).hostname.replace("www.", "");
  } catch (e) {
    domain = "Invalid URL";
  }
  return domain;
}

export const getRelaySigned = async (gaslessHost: string, signedTx: string, blockhash: string): Promise<string> => {
  const resp = await fetch(gaslessHost, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({
      transaction: signedTx,
      recentBlockhash: blockhash,
    }),
  });
  const resJson = await resp.json();
  return resJson.transaction;
};

export const getUserLanguage = (): string => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let userLanguage = (window.navigator as any).userLanguage || window.navigator.language || "en-US";
  userLanguage = userLanguage.split("-");
  userLanguage = userLanguage[0] || LOCALE_EN;
  return userLanguage;
};
export function delay(ms: number) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise<void>((resolve) => setTimeout(() => resolve(), ms));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setFallbackImg(target: any, src: string) {
  // eslint-disable-next-line no-param-reassign
  (target as { src: string }).src = src;
}

export const debounceAsyncValidator = <T>(validator: (value: T, callback: () => Promise<void>) => Promise<boolean>, delayAmount: number) => {
  let currentTimer: NodeJS.Timeout | null = null;
  let currentPromiseReject: {
    (arg0: Error): void;
    (reason?: unknown): void;
  } | null = null;

  function debounce() {
    return new Promise<void>((resolve, reject) => {
      currentTimer = setTimeout(() => {
        currentTimer = null;
        currentPromiseReject = null;
        resolve();
      }, delayAmount);
      currentPromiseReject = reject;
    });
  }

  return function callback(value: T): Promise<boolean> {
    if (currentTimer) {
      currentPromiseReject?.(new Error("replaced"));
      clearTimeout(currentTimer);
      currentTimer = null;
    }
    return validator(value, debounce);
  };
};

export const getCustomDeviceInfo = (browser: any): any => {
  if ((navigator as any)?.brave) {
    return {
      browser: "Brave",
    };
  }
  return {
    browser: browser.getBrowserName(),
  };
};

export async function recordDapp(origin: string) {
  try {
    const browser = bowser.getParser(window.navigator.userAgent);
    const browserInfo = getCustomDeviceInfo(browser);
    const recordLoginPayload = {
      os: browser.getOSName(),
      os_version: browser.getOSVersion() || "unidentified",
      browser: browserInfo?.browser || "unidentified",
      browser_version: browser.getBrowserVersion() || "unidentified",
      platform: browser.getPlatform().type || "desktop",
      origin,
    };
    await post(`${config.api}/dapps/record`, { ...recordLoginPayload });
  } catch (e) {
    log.error(e, "ERROR RECORDING DAPP");
  }
}
export const backendStatePromise = promiseCreator();
export const getRandomWindowId = () => Math.random().toString(36).slice(2);

export const parseJwt = (token: string) => {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    Buffer.from(base64, "base64")
      .toString()
      .split("")
      .map((c) => {
        return `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`;
      })
      .join("")
  );

  return JSON.parse(jsonPayload);
};

// Get a sufficiently unique channel name for
// the current window
export const getLogoutBcChannelName = (origin: string, userInfo: UserInfo) => {
  const browser = bowser.getParser(window.navigator.userAgent);
  const browserId = `${browser.getBrowserName()}_${browser.getBrowserVersion}`;
  const platformId = `${browser.getOSName()}_${browser.getPlatformType()}`;
  const userId = `${userInfo.verifier}_${userInfo.verifierId}`;
  const id = `${userId}_${origin}_${browserId}_${platformId}`;
  const hash = keccak(Buffer.from(id)).toString("hex");
  return hash;
};

export const logoutWithBC = async (origin: string, _instanceId: string, userInfo: UserInfo) => {
  const channelName = getLogoutBcChannelName(origin, userInfo);
  const bc = new BroadcastChannel<LogoutMessage>(`${channelName}`, { server: { timeout: 5 } });
  const timestamp = new Date().getTime();
  const instanceId = _instanceId.slice(0, 8);
  bc.postMessage({ instanceId, timestamp })
    .then(() => bc.close())
    .catch((err) => log.error(err));
};

export function getBrowserKey() {
  let id = sessionStorage.getItem("bk");
  if (!id) {
    id = `${Date.now()}`;
    sessionStorage.setItem("bk", id);
  }
  return id;
}

export function getCrisp() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const crisp = window.$crisp;
  if (!crisp) return false;
  return crisp;
}
export function isCrispClosed() {
  const crisp = getCrisp();
  if (crisp) crisp.is("chat:closed");
  return false;
}
export function hideCrispButton() {
  const crisp = getCrisp();
  crisp.push(["do", "chat:hide"]);
}
export function showCrispButton() {
  const crisp = getCrisp();
  crisp.push(["do", "chat:show"]);
}
export function openCrispChat() {
  const crisp = getCrisp();
  crisp.push(["do", "chat:open"]);
}

export function getTorusMessage(message: Buffer): Buffer {
  const prefix = Buffer.from(`\u0019${window.location.hostname} Signed Message:\n${message.length.toString()}`, "utf8");
  return Buffer.concat([prefix, message]);
}

export function generateTorusAuthHeaders(privateKey: string) {
  const challenge = Date.now();
  const publicAddress = `0x${privateToAddress(Buffer.from(privateKey, "hex")).toString("hex")}`;
  const challengeString = ((challenge - (challenge % 1000)) / 1000).toString();
  const message = getTorusMessage(Buffer.from(challengeString, "utf8"));
  const hash = keccak(message);
  const messageSig = ecsign(hash, Buffer.from(privateKey, "hex"));
  const signature = concatSig(toBuffer(messageSig.v), messageSig.r, messageSig.s);
  const authHeaders = {
    "Auth-Challenge": challengeString,
    "Auth-Signature": signature,
    "Auth-Public-Address": publicAddress,
  };
  return authHeaders;
}

export function getImgProxyUrl(originalUrl?: string) {
  const proxyUrl = process.env.VUE_APP_IMGPROXY_URL || "";
  if (!originalUrl?.startsWith("http") || !proxyUrl.length) {
    return originalUrl;
  }

  return `${proxyUrl}/plain/${originalUrl}`;
}

import { PublicKey } from "@solana/web3.js";
import copyToClipboard from "copy-to-clipboard";
import log from "loglevel";

import config from "@/config";
import { addToast } from "@/modules/app";

import { DISCORD, GITHUB, GOOGLE, LOGIN_CONFIG, REDDIT, REDIRECT_FLOW_CONFIG, SOL, STORAGE_TYPE, TWITTER } from "./enums";
import { ClubbedNfts, SolAndSplToken } from "./interfaces";

export function getStorage(key: STORAGE_TYPE): Storage | undefined {
  if (config.isStorageAvailable[key]) return window[key];
  return undefined;
}

export const isMain = window.self === window.top;

export function ruleVerifierId(selectedTypeOfLogin: string, value: string): boolean {
  if (selectedTypeOfLogin === SOL) {
    try {
      new PublicKey(value);
      return true;
    } catch (e) {
      return false;
    }
  }

  if (selectedTypeOfLogin === GOOGLE) {
    return /^(([^\s"(),.:;<>@[\\\]]+(\.[^\s"(),.:;<>@[\\\]]+)*)|(".+"))@((\[(?:\d{1,3}\.){3}\d{1,3}])|(([\dA-Za-z-]+\.)+[A-Za-z]{2,}))$/.test(value);
  }
  if (selectedTypeOfLogin === REDDIT) {
    return /^[\w-]+$/.test(value) && !/\s/.test(value) && value.length >= 3 && value.length <= 20;
  }
  if (selectedTypeOfLogin === DISCORD) {
    return /^\d*$/.test(value) && value.length === 18;
  }

  if (selectedTypeOfLogin === TWITTER) {
    return /^@(\w){1,15}$/.test(value);
  }

  if (selectedTypeOfLogin === GITHUB) {
    return /^(?!.*(-{2}))(?!^-.*$)(?!^.*-$)[\w-]{1,39}$/.test(value);
  }

  return true;
}

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

export const supportedCurrencies = (ticker: string): string[] => {
  const returnArr = ["SOL", ...config.supportedCurrencies];
  if (ticker !== "SOL") returnArr.unshift(ticker);
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
  log.info(gaslessHost);
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
  log.info(resJson);
  return resJson.transaction;
};

export function delay(ms: number) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise<void>((resolve) => setTimeout(() => resolve(), ms));
}

export function getClubbedNfts(nfts: Partial<SolAndSplToken>[]): ClubbedNfts[] {
  const finalData: { [collectionName: string]: ClubbedNfts } = {};
  nfts.forEach((nft) => {
    const metaData = nft.metaplexData?.offChainMetaData;
    const collectionName = metaData?.collection?.family || metaData?.symbol || "unknown token";
    const elem = finalData[collectionName];
    if (elem) {
      finalData[collectionName] = { ...elem, title: metaData?.symbol || "", count: elem.count + 1 };
    } else {
      finalData[collectionName] = {
        title: metaData?.name || "",
        count: 1,
        description: metaData?.description || "",
        img: metaData?.image || "",
        mints: [],
        collectionName,
      };
    }
    finalData[collectionName].mints.push(`${nft?.mintAddress?.toString()}`);
  });
  return Object.values(finalData);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setFallbackImg(target: any, src: string) {
  // eslint-disable-next-line no-param-reassign
  (target as { src: string }).src = src;
}
// returns params object
export const groupParamsByKey = (params: URLSearchParams) =>
  [...params.entries()].reduce((acc: { [key: string]: any }, tuple) => { //eslint-disable-line
    // getting the key and value from each tuple
    const [key, val] = tuple;
    if (Object.prototype.hasOwnProperty.call(acc, key)) {
      // if the current key is already an array, we'll add the value to it
      if (Array.isArray(acc[key])) {
        // eslint-disable-next-line
      acc[key] = [...acc[key], val]
      } else {
        // if it's not an array, but contains a value, we'll convert it into an array
        // and add the current value to it
        acc[key] = [acc[key], val];
      }
    } else {
      // plain assignment if no special case is present
      acc[key] = val;
    }

    return acc;
  }, {});

export const getB64DecodedParams = (defaultParams?: unknown) => {
  let params;
  params = new URLSearchParams(window.location.hash.slice(1)).get("params");
  if (params) params = JSON.parse(Buffer.from(params, "base64").toString());
  else params = defaultParams || {};
  return params;
};

export const checkRedirectFlow = (): boolean => {
  return new URLSearchParams(window.location.search).get("useRedirectFlow") === "true";
};

export const checkRedirect = (): string | null => {
  const redirectTo = new URLSearchParams(window.location.search).get("redirectTo");
  return redirectTo;
};

export const getRedirectConfig = (method: string | null | undefined): { redirectPath: string; requiresLogin: boolean; shouldRedirect: boolean } => {
  const { redirectPath = "/", requiresLogin = true, shouldRedirect = true } = method ? REDIRECT_FLOW_CONFIG[method] : {};
  return { redirectPath, requiresLogin, shouldRedirect };
};

export const timeoutWindowClose = (): void => {
  setTimeout(window.close, 0);
};
// eslint-disable-next-line
export const redirectToResult = (method: string | null | undefined, result: any, resolveRoute: string | null): void => {
  const res = Buffer.from(JSON.stringify(result)).toString("base64");
  if (!resolveRoute) return timeoutWindowClose();
  if (resolveRoute.startsWith("http")) {
    window.location.href = `${resolveRoute}?method=${method || "NA"}#result=${res}`;
  } else {
    const elem = document.createElement("a");
    elem.href = `${resolveRoute}?method=${method || "NA"}&result=${res}`;
    elem.innerHTML = "Click here to return back to app!";
    // elem.click();
    elem.classList.add("back-nav");
    document.getElementById("app")?.appendChild(elem);
  }
};

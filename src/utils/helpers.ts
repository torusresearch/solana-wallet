import {
  Account,
  AccountLayout,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  MINT_SIZE,
  MintLayout,
  RawMint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Connection, LAMPORTS_PER_SOL, PublicKey, SimulatedTransactionResponse, Transaction } from "@solana/web3.js";
import { addressSlicer, concatSig } from "@toruslabs/base-controllers";
import { BroadcastChannel } from "@toruslabs/broadcast-channel";
import { post } from "@toruslabs/http-helpers";
import bowser from "bowser";
import copyToClipboard from "copy-to-clipboard";
import { ecsign, keccak, privateToAddress, toBuffer } from "ethereumjs-util";
import log from "loglevel";

import config from "@/config";
import { addToast } from "@/modules/app";

import { DISCORD, GITHUB, GOOGLE, LOCALE_EN, LOGIN_CONFIG, REDDIT, SOL, STORAGE_TYPE, TWITTER } from "./enums";
import { AccountEstimation, ClubbedNfts, SolAndSplToken } from "./interfaces";

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
    return /^@?(\w){1,15}$/.test(value);
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

export function getClubbedNfts(nfts: Partial<SolAndSplToken>[]): ClubbedNfts[] {
  const finalData: { [collectionName: string]: ClubbedNfts } = {};
  nfts.forEach((nft) => {
    const metaData = nft.metaplexData?.offChainMetaData;
    const collectionName = metaData?.collection?.family || metaData?.symbol || "unknown token";
    const elem = finalData[collectionName];
    if (elem) {
      finalData[collectionName] = {
        ...elem,
        title: metaData?.symbol || "",
        count: elem.count + 1,
      };
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
    post(`${config.api}/dapps/record`, { ...recordLoginPayload });
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

export const logoutWithBC = async () => {
  const bc = new BroadcastChannel("LOGOUT_WINDOWS_CHANNEL");
  await bc.postMessage("logout");
  bc.close();
};

export function getBrowserKey() {
  let id = sessionStorage.getItem("bk");
  if (!id) {
    id = `${Date.now()}`;
    sessionStorage.setItem("bk", id);
  }
  return id;
}

export function hideCrispButton() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.$crisp.push(["do", "chat:hide"]);
}
export function showCrispButton() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.$crisp.push(["do", "chat:show"]);
}
export function openCrispChat() {
  showCrispButton();
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  window.$crisp.push(["do", "chat:show"]);
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

// fee Estimation
// Generate Solana Transaction
export async function generateSPLTransaction(
  receiver: string,
  amount: number,
  selectedToken: Partial<SolAndSplToken>,
  sender: string,
  connection: Connection
): Promise<Transaction> {
  const transaction = new Transaction();
  const tokenMintAddress = selectedToken.mintAddress as string;
  const decimals = selectedToken.balance?.decimals || 0;
  const mintAccount = new PublicKey(tokenMintAddress);
  const signer = new PublicKey(sender); // add gasless transactions
  const sourceTokenAccount = await getAssociatedTokenAddress(mintAccount, signer, false);
  const receiverAccount = new PublicKey(receiver);

  let associatedTokenAccount = receiverAccount;
  try {
    associatedTokenAccount = await getAssociatedTokenAddress(new PublicKey(tokenMintAddress), receiverAccount, false);
  } catch (e) {
    log.warn("error getting associatedTokenAccount, account passed is possibly a token account");
  }

  const receiverAccountInfo = await connection.getAccountInfo(associatedTokenAccount);

  if (receiverAccountInfo?.owner?.toString() !== TOKEN_PROGRAM_ID.toString()) {
    const newAccount = await createAssociatedTokenAccountInstruction(
      new PublicKey(sender),
      associatedTokenAccount,
      receiverAccount,
      new PublicKey(tokenMintAddress)
    );
    transaction.add(newAccount);
  }
  const transferInstructions = createTransferCheckedInstruction(
    sourceTokenAccount,
    mintAccount,
    associatedTokenAccount,
    signer,
    amount,
    decimals,
    []
  );
  transaction.add(transferInstructions);

  transaction.recentBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
  transaction.feePayer = new PublicKey(sender);
  return transaction;
}

// Calculte balance changes after transaction simulation
export async function calculateChanges(
  connection: Connection,
  result: SimulatedTransactionResponse,
  selectedAddress: string,
  accountKeys: string[]
): Promise<AccountEstimation[]> {
  // filter out  address token (Token ProgramId ).
  // parse account data, filter selecteAddress as token holder
  const returnResult: AccountEstimation[] = [];
  const mintTokenAddress: string[] = [];
  const postTokenDetails: Account[] = [];

  // For all the accounts changes, filter out the token Account(post tx)
  result.accounts?.forEach((item, idx) => {
    if (!item) return;

    // there is possibility the account is a mintAccount which is also owned by TOKEN PROGRAM. Check data length to filter out
    if (TOKEN_PROGRAM_ID.equals(new PublicKey(item.owner)) && item.data[0].length > MINT_SIZE) {
      const rawAccount = AccountLayout.decode(Buffer.from(item.data[0], item.data[1] as BufferEncoding));
      const tokenDetail: Account = {
        address: new PublicKey(accountKeys[idx]),
        mint: rawAccount.mint,
        owner: rawAccount.owner,
        amount: rawAccount.amount,
        delegate: rawAccount.delegate,
        delegatedAmount: rawAccount.delegatedAmount,
        isInitialized: rawAccount.state > 0,
        isFrozen: rawAccount.state === 2,
        isNative: rawAccount.isNative > 0,
        closeAuthority: rawAccount.closeAuthority,
        /**
         * If the account is a native token account, it must be rent-exempt. The rent-exempt reserve is the amount that must
         * remain in the balance until the account is closed.
         */
        rentExemptReserve: null,
      };

      if (tokenDetail.owner.toBase58() === selectedAddress) {
        mintTokenAddress.push(tokenDetail.mint.toBase58());
        postTokenDetails.push(tokenDetail);
      }
    }
  });

  // Query current token accountInfo
  const queryPubKey = [
    new PublicKey(selectedAddress),
    ...mintTokenAddress.map((item) => new PublicKey(item)),
    ...postTokenDetails.map((item) => item.address),
  ];
  const queryAccounts = await connection.getMultipleAccountsInfo(queryPubKey);
  const signerAccount = queryAccounts[0];
  const mintAccounts = queryAccounts.slice(1, mintTokenAddress.length + 1);
  const tokenAccounts = queryAccounts.slice(mintTokenAddress.length + 1);

  const mintAccountInfos: RawMint[] = mintAccounts.map((item) => MintLayout.decode(Buffer.from(item?.data || [])));
  const preTokenDetails = tokenAccounts.map((item, _idx) => (item ? AccountLayout.decode(item.data) : null));

  // Check for holder's sol account balance changes
  const accIdx = accountKeys.findIndex((item) => item === selectedAddress);
  if (accIdx >= 0) {
    const solchanges = ((result.accounts?.at(accIdx)?.lamports || 0) - Number(signerAccount?.lamports)) / LAMPORTS_PER_SOL;
    returnResult.push({ changes: Number(solchanges.toFixed(7)), symbol: "SOL", mint: "", address: selectedAddress });
  }

  // calculate token account changes
  // compare post token account with current token account.
  postTokenDetails.forEach(async (item, idx) => {
    const mint = item.mint.toBase58();
    const symbol = addressSlicer(item.mint.toBase58());

    const { decimals } = mintAccountInfos[idx];
    const preTokenAmount = preTokenDetails[idx]?.amount || BigInt(0);
    const changes = Number(item.amount - preTokenAmount) / 10 ** decimals;

    returnResult.push({
      changes: Number(changes.toString()),
      symbol,
      mint,
      address: item.address.toBase58(),
    });
  });

  // add filter new interested program and its account
  log.info(returnResult);
  return returnResult;
}

// Simulate transaction's balance changes
export async function getEstimateBalanceChange(connection: Connection, tx: Transaction, signer: string): Promise<AccountEstimation[]> {
  try {
    // get writeable accounts from all instruction
    const accounts = tx.instructions.reduce((prev, current) => {
      // log.info(current.keys)
      current.keys.forEach((item) => {
        if (item.isWritable || item.isSigner) {
          prev.set(item.pubkey.toBase58(), item.pubkey);
        }
      });
      return prev;
    }, new Map<string, PublicKey>());

    log.info(tx instanceof Transaction);
    // add selected Account incase signer is just fee payer (instruction will not track fee payer)
    accounts.set(signer, new PublicKey(signer));

    // Simulate Transaction with Accounts
    const result = await connection.simulateTransaction(tx.compileMessage(), undefined, Array.from(accounts.values()));

    // calculate diff of the token and sol
    return calculateChanges(connection, result.value, signer, Array.from(accounts.keys()));
  } catch (e) {
    log.warn(e);
    // if ((e as Error).message.match("Too many accounts provided; max 0")) log.warn("Unable to estimate balances");
    throw new Error("Failed to simulate transaction for balance change", e as Error);
  }
}

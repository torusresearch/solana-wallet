import { expect, Page } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.testing" });

type Tabs = "home" | "transfer" | "topup" | "activity" | "settings";

export function getDomain(): string {
  return `${process.env.TESTING_DOMAIN}`;
}

export function getBackendDomain(): string {
  return `${process.env.BACKEND_DOMAIN}`;
}

export function getStateDomain(): string {
  return `${process.env.STATE_DOMAIN}`;
}

export function wait(millSeconds = 1000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("resolved");
    }, millSeconds);
  });
}

// the element should exactly match the textual content
export async function ensureTextualElementExists(page: Page, text: string) {
  expect(await page.locator(`text=${text}`)?.allInnerTexts()).toContain(text);
}

export async function getInnerText(page: Page, selector: string): Promise<string | undefined> {
  return page.locator(selector)?.first()?.innerText();
}

export async function switchTab(page: Page, tab: Tabs) {
  const tabHeaders = {
    home: "Account Balance",
    transfer: "Transfer Details",
    topup: "Select a Provider",
    activity: "Transaction Activities",
    settings: "Settings",
  };
  await page.click(`a[href='/wallet/${tab}']`);
  await wait(1000);
  expect(page.url().includes(`/wallet/${tab}`)).toBeTruthy();
  // ENSURE UI IS INTACT
  await ensureTextualElementExists(page, tabHeaders[tab]);
}

export async function switchNetwork(page: Page, network: "mainnet" | "testnet" | "devnet") {
  const networkLabels = {
    mainnet: "Solana Mainnet",
    testnet: "Solana Testnet",
    devnet: "Solana Devnet",
  };
  const currentTab = (await page.locator(".router-link-active").last().innerText()).toLowerCase() as Tabs;
  await switchTab(page, "settings");
  await page.click("button[id^='headlessui-listbox-button'] :text-matches('Solana .*net', 'i')");
  await page.click(`ul[role='listbox'] div >> text=${networkLabels[network]}`);
  await page.waitForSelector(`button[id^='headlessui-listbox-button'] :has-text('${networkLabels[network]}')`, { timeout: 5_000 });
  await switchTab(page, currentTab);
}

export async function changeLanguage(page: Page, language: "english" | "german" | "japanese" | "korean" | "mandarin" | "spanish") {
  const languageLabels = {
    english: "English",
    german: "German (Deutsch)",
    japanese: "Japanese (日本語)",
    korean: "Korean (한국어)",
    mandarin: "Mandarin (中文)",
    spanish: "Spanish (Español)",
  };

  await page.click("nav button[id^='headlessui-listbox-button'][aria-haspopup='true']");
  await page.click(`nav ul[role='listbox'] div >> text=${languageLabels[language]}`);
}

export async function importAccount(page: Page, privKey: string) {
  await page.click("nav >> text=Open User Menu");
  await page.click("nav >> text=Import Account");
  await page.fill("input[placeholder='Private Key']", privKey);
  await page.click("button >> text=Import");
  await wait(2000);
}

// TODO: Remove Dummy fn
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getControllerState(page: Page): Promise<any> {
  return {};
}

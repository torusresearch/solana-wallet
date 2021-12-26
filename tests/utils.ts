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

export function wait(millSeconds = 1000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("resolved");
    }, millSeconds);
  });
}

// the element should exactly match the textual content
export async function ensureTextualElementExists(page: Page, text: string) {
  expect(await page.locator(`text=${text}`)?.first().innerText()).toEqual(text);
}

export async function getInnerText(page: Page, selector: string): Promise<string | undefined> {
  await wait(200);
  return page.locator(selector)?.first()?.innerText();
}

export async function getControllerState(page: Page) {
  const sessionState = await page.evaluate(() => window.sessionStorage.getItem("controllerModule"));
  const localState = await page.evaluate(() => window.localStorage.getItem("controllerModule"));
  const state = sessionState || localState;
  if (state) return JSON.parse(state)?.controllerModule;
  return {};
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
  await page.click("#networkSelect");
  await page.click(`ul[role='listbox'] div >> text=${networkLabels[network]}`);
  await page.waitForSelector(`#networkSelect button >> text=${networkLabels[network]}`);
  await wait(1000);
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

  const languages = {
    english: "en",
    german: "de",
    japanese: "ja",
    korean: "ko",
    mandarin: "zh",
    spanish: "es",
  };

  await page.click("nav button[id^='headlessui-listbox-button'][aria-haspopup='true']");
  await page.click(`nav ul[role='listbox'] div >> text=${languageLabels[language]}`);
  await wait(1000);
  // confirm controller state change
  const controllerModule = await getControllerState(page);
  expect(
    controllerModule.torusState.PreferencesControllerState.identities[controllerModule.torusState.PreferencesControllerState.selectedAddress].locale
  ).toStrictEqual(languages[language]);
}

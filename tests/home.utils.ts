import { Page } from "@playwright/test";
import * as dotenv from "dotenv";

import { ensureTextualElementExists, wait } from "./utils";

dotenv.config({ path: ".env.testing" });

export async function clickTokenIfAvailable(page: Page) {
  // const token_locator = page.locator("//div/h2[contains(text(),'Tokens')]/..//span/p");
  const token_locator = page.locator("text=/\\s\\≈\\s/");
  if ((await token_locator.isVisible()) === true) {
    await token_locator.first().click();
    await wait(1000);
    await ensureTextualElementExists(page, "Transfer Details");
  }
}

export async function clickPubKeyIcon(page: Page) {
  await page.click("text=/\\w{5}\\.{3}\\w{5}/");
}

export async function ensureCopiedToastDisplayed(page: Page) {
  await page.locator("text=Copied").waitFor();
}

export async function clickTransferButton(page: Page) {
  await page.click("button >> text=Transfer");
}

export async function clickTopupButton(page: Page) {
  await page.click("button >> text=Top up");
}

export async function selectCurrency(page: Page, text: string) {
  await page.click("#currencySelector");
  await page.click(`li[role='option'] >> text=${text}`);
}

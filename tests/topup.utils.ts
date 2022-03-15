import { Page } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.testing" });

export async function switchCryptoCurrency(page: Page, cryptoCurrency: "USDC" | "SOL") {
  const cryptoLabels = {
    USDC: "USDC (SOL)",
    SOL: "SOL",
  };
  await page.click("button[id^='headlessui-listbox-button'] :has-text('SOL')");
  await page.click(`ul[role='listbox'] div >> text=${cryptoLabels[cryptoCurrency]}`);
  await page.waitForSelector(`button[id^='headlessui-listbox-button'] :has-text('${cryptoCurrency}')`, { timeout: 5_000 });
}

export async function changeFiatCurrency(page: Page, fiatCurrency: string) {
  const fiatBTN = page.locator("button :text-is('USD'), button :text-is('EUR'), button :text-is('GBP')");
  if ((await fiatBTN.isVisible()) === true) {
    await fiatBTN.click();
  }
  await page.locator(`ul[role="listbox"] div:has-text('${fiatCurrency}')`).click();
  await page.waitForSelector(`button[id^='headlessui-listbox-button'] :has-text('${fiatCurrency}')`, { timeout: 5_000 });
}

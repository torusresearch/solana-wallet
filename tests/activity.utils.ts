import { Locator, Page } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.testing" });

export async function getActivities(page: Page) {
  return page.locator(".transaction-activity");
}

// function to verify that clicking on activity takes to solana explorer page
export async function ensureActivityClickTakesToExplorer(page: Page, transaction: Locator) {
  const [page2] = await Promise.all([page.waitForEvent("popup"), transaction?.click()]);
  page2.close();
}

export async function selectTimeFilter(page: Page, filter: string) {
  const timeBTN = page.locator(
    "button :text-is('All'), button :text-is('Last 1 week'), button :text-is('Last 1 month'), button :text-is('Last 6 months')"
  );
  if ((await timeBTN.isVisible()) === true) {
    await timeBTN.click();
  }
  await page.locator(`header ul[role='listbox'] div >> text=${filter}`).click();
}

export async function selectTransactionTypeFilter(page: Page, filter: string) {
  const transactionBTN = page.locator(
    "button :text-is('All Transactions'), button :text-is('Send'), button :text-is('Receive'), button :text-is('Topup')"
  );
  if ((await transactionBTN.isVisible()) === true) {
    await transactionBTN.click();
  }
  await page.locator(`header ul[role='listbox'] div >> text=${filter}`).click();
}

export async function getDateOfActivities(page: Page) {
  return page.locator("text=/\\d{1,2}th\\s\\w{3}\\,\\s\\d{4}/");
}

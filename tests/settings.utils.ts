import { Page } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.testing" });

export async function getActivities(page: Page) {
  return page.locator(".transaction-activity");
}

export async function selectAddressBookFilter(page: Page, filter: string) {
  const transactionBTN = page.locator(
    "button.size-small :text-is('Filter by type'), button.size-small :text-is('All'), button.size-small :text-is('Solana address'), button.size-small :text-is('SOL Domain')"
  );
  if ((await transactionBTN.isVisible()) === true) {
    await transactionBTN.click();
  }
  await page.locator(`ul[role='listbox'] div :has-text("${filter}")`).click();
}

export async function isContactDeleted(page: Page, contact: string) {
  let contactDeleted = false;
  await page.waitForSelector("text=Successfully deleted contact", { timeout: 10_000 });
  try {
    await page.waitForSelector(`span >> text=${contact} PUB_ADDRESS,`, { timeout: 2_000 });
  } catch (e) {
    contactDeleted = true;
  }
  return contactDeleted;
}

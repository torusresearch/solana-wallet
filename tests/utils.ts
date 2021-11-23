import { expect, Page } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.testing" });

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
  expect(await (await page.$(`text=${text}`))?.innerText()).toEqual(text);
}

export async function getInnerText(page: Page, selector: string): Promise<string | undefined> {
  await wait(200);
  return (await page.$(selector))?.innerText();
}

/* eslint-disable no-await-in-loop */

import test, { expect, Page } from "@playwright/test";

import { login } from "../../auth-helper";
import { wait } from "../../utils";

test.describe("Mobile screens", async () => {
  const tabs = ["home", "nfts", "activity", "settings", "discover"];

  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await login(await browser.newContext());
    page.setViewportSize({ height: 667, width: 375 }); // iPhone SE
  });

  test.afterAll(() => {
    page.close();
  });

  test("Should have all the tabs", async () => {
    // eslint-disable-next-line no-restricted-syntax
    for (const key of tabs) {
      expect(await page.locator(`#${key}_test`).count()).toBeGreaterThan(0);
    }
  });

  test("Should do correct routing", async () => {
    // eslint-disable-next-line no-restricted-syntax
    for (const key of tabs) {
      const elem = await page.locator(`#${key}_test`).first();
      elem.click();
      await wait(2000);
      expect(await page.url().endsWith(key)).toBeTruthy();
    }
  });
});

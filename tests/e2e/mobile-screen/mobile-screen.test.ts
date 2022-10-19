/* eslint-disable no-await-in-loop */

import test, { expect, Page } from "@playwright/test";

import { login } from "../../auth-helper";
import { wait } from "../../utils";

test.describe("Mobile screens", async () => {
  const tabs = ["home", "nfts", "activity", "settings", "discover"];

  let page: Page;
  test.beforeAll(async ({ browser, browserName }) => {
    page = await login(await browser.newContext(), browserName);
    await wait(2000);
    page.setViewportSize({ height: 667, width: 375 }); // iPhone SE

    await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      window.$crisp.push(["do", "chat:hide"]);
    });
  });

  test.afterAll(() => {
    page.close();
  });

  test("Should have all the tabs", async () => {
    // eslint-disable-next-line no-restricted-syntax
    for (const key of tabs) {
      await wait(200);
      expect(await page.locator(`#${key}_link`).count()).toBeGreaterThan(0);
    }
  });

  test("Should do correct routing", async () => {
    // eslint-disable-next-line no-restricted-syntax
    for (const key of tabs) {
      global.console.log(`Clicking ${key}`);
      const elem = await page.locator(`#${key}_link`).first();
      elem.click();
      await wait(3000);
      global.console.log(`Ended up at ${page.url()}`, page.url().endsWith(key));
      expect(page.url().endsWith(key)).toBeTruthy();
    }
  });
});

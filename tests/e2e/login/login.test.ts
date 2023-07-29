// const { test} = require("@playwright/test");
import { expect } from "@playwright/test";

import { login } from "../../auth-helper";
import { wait } from "../../utils";
import test, { markResult, setBrowserStackTestTitle } from "../fixtures";

test.afterAll(markResult);
test.beforeEach(setBrowserStackTestTitle);
test("Should Login successfully", async ({ context, browserName }) => {
  // ------------ STEP1: Login -----------
  const page = await login(context, browserName);

  await page.click("text=Home");
  await wait(500);
  expect(page.url().includes("/wallet/home")).toBeTruthy();

  await page.click("text=NFTs");
  await wait(500);
  expect(page.url().includes("/wallet/nfts")).toBeTruthy();

  await page.click("text=Activity");
  await wait(500);
  expect(page.url().includes("/wallet/activity")).toBeTruthy();

  // Click text=Settings
  await page.click("text=Settings");
  await wait(500);
  expect(page.url().includes("/wallet/settings")).toBeTruthy();

  await page.click("text=Discover");
  await wait(500);
  expect(page.url().includes("/wallet/discover")).toBeTruthy();
  await page.close();
});

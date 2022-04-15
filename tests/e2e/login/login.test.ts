// const { test} = require("@playwright/test");
import test, { expect } from "@playwright/test";

import { login } from "../../auth-helper";
import { wait } from "../../utils";

test("Should Login successfully", async ({ context }) => {
  // ------------ STEP1: Login -----------
  const page = await login(context);

  // ------------ Check if navbar routing works-----------
  // Click text=Home
  await page.click("text=Home");
  await wait(1000);
  expect(page.url().endsWith("/wallet/home")).toBeTruthy();

  // Click text=Transfer
  await page.click("text=Transfer");
  await wait(1000);
  expect(page.url().endsWith("/wallet/transfer")).toBeTruthy();

  // Click text=Top up
  await page.click("text=Top up");
  await wait(1000);
  expect(page.url().includes("/wallet/topup")).toBeTruthy();

  // Click text=Top up
  await page.click("text=Activity");
  await wait(1000);
  expect(page.url().includes("/wallet/activity")).toBeTruthy();

  // Click text=Settings
  await page.click("text=Settings");
  await wait(1000);
  expect(page.url().includes("/wallet/settings")).toBeTruthy();
  page.close();
});

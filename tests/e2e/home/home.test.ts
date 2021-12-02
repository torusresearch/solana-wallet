// const { test} = require("@playwright/test");
import test, { expect } from "@playwright/test";

import { login } from "../../auth-helper";
import { ensureTextualElementExists, getInnerText, wait } from "../../utils";

test("Home Page Should render", async ({ context }) => {
  const page = await login(context);

  // // see navigation works correctly
  await page.click("text=Home");
  await expect(page.url().endsWith("/wallet/home")).toBeTruthy();

  // ENSURE UI IS INTACT
  await ensureTextualElementExists(page, "Account Balance");
  await ensureTextualElementExists(page, "Total Value");

  // ENSURE TopUp button click should take to correct route
  page.click("button:has-text('Top up')");
  await wait(1000);
  expect(page.url().includes("/wallet/topup")).toBeTruthy();
  await page.click("text=Home");

  // ENSURE Transfer button click should take to correct route
  page.click("button:has-text('Transfer')");
  await wait(1000);
  expect(page.url().endsWith("/wallet/transfer")).toBeTruthy();
  await page.click("text=Home");
  await wait(4000);

  // ENSURE On selecting EUR as currency, conversion rate has a positive value
  await page.click("#currencySelector");
  await page.click("li[role='option']:has-text('EUR')");
  await wait(1000);
  const eurRate = Number(await getInnerText(page, "#conversionRate"));
  expect(eurRate).toBeGreaterThan(0);

  // ENSURE On selecting USD as currency, conversion rate has a positive value
  await page.click("#currencySelector");
  await page.click("li[role='option']:has-text('USD')");
  await wait(1000);
  const usdRate = Number(await getInnerText(page, "#conversionRate"));
  expect(usdRate).toBeGreaterThan(0);

  // ENSURE the rate of EUR and USD are different, means the system working correctly
  expect(eurRate !== usdRate).toBeTruthy();
});

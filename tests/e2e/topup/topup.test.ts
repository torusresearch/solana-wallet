// const { test} = require("@playwright/test");
import test, { expect } from "@playwright/test";

import { login } from "../../auth-helper";
import { ensureTextualElementExists, getInnerText, wait } from "../../utils";

test("Popup Page Should render", async ({ context }) => {
  const page = await login(context);

  // // see navigation works correctly
  await page.click("text=Top Up");
  await wait(2000);
  expect(page.url().includes("/wallet/topup")).toBeTruthy();

  // ENSURE UI IS INTACT
  await ensureTextualElementExists(page, "Select a Provider");

  // RAMP TOPUP SHOULD WORK AS EXPECTED
  // set amount to be transfered as 100 US Dollars, expect a positive value for expected SOL
  await page.click("img[alt=Ramp]");
  await page.fill("input[type='number']", "100");
  const usdToSol100 = Number(await getInnerText(page, "#res_crypto_amt"));
  expect(usdToSol100).toBeGreaterThan(0);
  await wait(2000);

  // set amount to be transfered as 200 US Dollars, expect a positive value for expected SOL
  await page.fill("input[type='number']", "200");
  const usdToSol200 = Number(await getInnerText(page, "#res_crypto_amt"));
  expect(usdToSol200).toBeGreaterThan(0);

  // ensure that on clicking save, it is refirected to Ramp Payment page having torus logo
  await Promise.all([page.waitForEvent("popup"), page.click("text=Save")]);
  await expect((await page.$$("img[alt=Ramp]")).length).toEqual(1);
});

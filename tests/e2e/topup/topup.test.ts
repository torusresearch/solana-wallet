// const { test} = require("@playwright/test");
import test, { expect } from "@playwright/test";

import { login } from "../../auth-helper";
import { changeLanguage, ensureTextualElementExists, getInnerText, switchTab } from "../../utils";

test("Popup Page Should render", async ({ context }) => {
  const page = await login(context);

  // // see navigation works correctly
  await switchTab(page, "topup");

  // RAMP TOPUP SHOULD WORK AS EXPECTED
  // set amount to be transfered as 100 US Dollars, expect a positive value for expected SOL
  await page.click("img[alt=Ramp]");
  await page.fill("input[type='number']", "100");
  const usdToSol100 = Number(await getInnerText(page, "#resCryptoAmt"));
  expect(usdToSol100).toBeGreaterThan(0);

  // set amount to be transfered as 200 US Dollars, expect a positive value for expected SOL
  await page.fill("input[type='number']", "200");
  const usdToSol200 = Number(await getInnerText(page, "#resCryptoAmt"));
  expect(usdToSol200).toBeGreaterThan(0);

  // ensure that on clicking save, it is refirected to Ramp Payment page having torus logo
  await Promise.all([page.click("button:has-text('Top up')"), page.waitForEvent("popup")]);
  await expect((await page.$$("img[alt=Ramp]")).length).toEqual(1);
});

test("Language change should work", async ({ context }) => {
  const page = await login(context);
  await switchTab(page, "topup");

  await changeLanguage(page, "german");
  await ensureTextualElementExists(page, "Wählen Sie einen Anbieter");

  await changeLanguage(page, "japanese");
  await ensureTextualElementExists(page, "プロバイダーを選択");

  await changeLanguage(page, "korean");
  await ensureTextualElementExists(page, "공급자를 선택하십시오");

  await changeLanguage(page, "mandarin");
  await ensureTextualElementExists(page, "选择供应商");

  await changeLanguage(page, "spanish");
  await ensureTextualElementExists(page, "Selecciona un Proveedor");

  await changeLanguage(page, "english");
});

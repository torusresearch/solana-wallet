// const { test} = require("@playwright/test");
import test, { expect } from "@playwright/test";

import { login } from "../../auth-helper";
import { changeFiatCurrency, switchCryptoCurrency } from "../../topup.utils";
import { changeLanguage, ensureTextualElementExists, getInnerText, switchTab, wait } from "../../utils";

test("Popup Page Should render", async ({ context }) => {
  const page = await login(context);

  // // see navigation works correctly
  await switchTab(page, "topup");
  // ENSURE UI IS INTACT
  await ensureTextualElementExists(page, "Select a Provider");
  // MoonPay SHOULD WORK AS EXPECTED
  // set amount to be transferred as 100 US Dollars, expect a positive value for expected SOL
  await page.click("img[alt=moonpay]");
  await page.fill("input[type='number']", "100");
  const usdToSol100 = Number(await getInnerText(page, "#resCryptoAmt"));
  expect(usdToSol100).toBeGreaterThan(0);

  // set amount to be transferred as 200 US Dollars, expect a positive value for expected SOL
  await page.fill("input[type='number']", "200");
  const usdToSol200 = Number(await getInnerText(page, "#resCryptoAmt"));
  expect(usdToSol200).toBeGreaterThan(0);
  expect(usdToSol200).toBeGreaterThan(usdToSol100);

  // ensure that on clicking Top up, it is redirected to MoonPay Payment page
  const [page2] = await Promise.all([page.waitForEvent("popup"), page.click("button:has-text('Top up')")]);
  // closing moonpay page, will show an error on top up page
  page2.close();
  await wait(500);
  await ensureTextualElementExists(page, "Transaction could not complete.");
});

test("Changing of crypto/fiat currency changes the value you receive correctly", async ({ context }) => {
  const page = await login(context);

  // // see navigation works correctly
  await switchTab(page, "topup");

  // change crypto currency to USDC (SOL)
  const USDYouReceive = Number(await getInnerText(page, "#resCryptoAmt"));
  await switchCryptoCurrency(page, "USDC");
  const USDCYouReceive = Number(await getInnerText(page, "#resCryptoAmt"));
  // ensure USDCYouReceive value is greater than USDYouReceive
  expect(USDCYouReceive).toBeGreaterThan(USDYouReceive);
  await switchCryptoCurrency(page, "SOL");

  // change fiat currency EUR
  const USDFiatYouReceive = Number(await getInnerText(page, "#resCryptoAmt"));
  await changeFiatCurrency(page, "EUR");
  const EURFiatYouReceive = Number(await getInnerText(page, "#resCryptoAmt"));
  // ensure EURFiatYouReceive value is greater than USDFiatYouReceive
  expect(EURFiatYouReceive).toBeGreaterThan(USDFiatYouReceive);

  // change fiat currency GBP
  await changeFiatCurrency(page, "GBP");
  const GBPfiatYouReceive = Number(await getInnerText(page, "#resCryptoAmt"));
  // ensure GBPfiatYouReceive value is greater than EURFiatYouReceive
  expect(GBPfiatYouReceive).toBeGreaterThan(EURFiatYouReceive);

  await changeFiatCurrency(page, "USD");
});

test("Language change should work", async ({ context }) => {
  const page = await login(context);
  await switchTab(page, "topup");

  await changeLanguage(page, "german");
  await wait(500);
  await ensureTextualElementExists(page, "Wählen Sie einen Anbieter");

  await changeLanguage(page, "japanese");
  await wait(500);
  await ensureTextualElementExists(page, "プロバイダーを選択");

  await changeLanguage(page, "korean");
  await wait(500);
  await ensureTextualElementExists(page, "공급자를 선택하십시오");

  await changeLanguage(page, "mandarin");
  await wait(500);
  await ensureTextualElementExists(page, "选择供应商");

  await changeLanguage(page, "spanish");
  await wait(500);
  await ensureTextualElementExists(page, "Selecciona un Proveedor");

  await changeLanguage(page, "english");
});

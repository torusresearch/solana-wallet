// const { test} = require("@playwright/test");
import { expect, Page } from "@playwright/test";

import { login } from "../../auth-helper";
import { changeFiatCurrency, switchCryptoCurrency } from "../../topup.utils";
import { ensureTextualElementExists, getInnerText, wait } from "../../utils";
import test, { markResult, setBrowserStackTestTitle } from "../fixtures";

test.describe("Topup page", async () => {
  let page: Page;
  test.beforeEach(async ({ browser, browserName }) => {
    page = await login(await browser.newContext(), browserName);
  });
  test.afterAll(() => {
    page.close();
  });

  test.afterAll(markResult);
  test.beforeEach(setBrowserStackTestTitle);

  test("Topup Page Should render", async () => {
    // // see navigation works correctly
    await page.click("button:has-text('Top up')");
    // ENSURE UI IS INTACT
    await wait(500);
    await ensureTextualElementExists(page, "Select a Provider");
  });

  test("Changing amount changes received value", async () => {
    // // see navigation works correctly
    await page.click("button:has-text('Top up')");
    // MoonPay SHOULD WORK AS EXPECTED
    // set amount to be transferred as 100 US Dollars, expect a positive value for expected SOL
    await page.click("img[alt=moonpay]");
    await page.fill("input[type='number']", "100");
    const usdToSol100 = Number(await getInnerText(page, "#resCryptoAmt"));
    expect(usdToSol100).toBeGreaterThan(0);

    // set amount to be transferred as 200 US Dollars, expect a positive value for expected SOL
    await page.fill("input[type='number']", "200");
    const usdToSol200 = Number(await getInnerText(page, "#resCryptoAmt"));
    expect(usdToSol200).toBeGreaterThan(usdToSol100);
  });

  test("Pop up page should show for top up", async () => {
    // // see navigation works correctly
    await page.click("button:has-text('Top up')");
    // MoonPay SHOULD WORK AS EXPECTED
    // set amount to be transferred as 100 US Dollars, expect a positive value for expected SOL
    await page.click("img[alt=moonpay]");
    await page.fill("input[type='number']", "100");

    // ensure that on clicking Top up, it is redirected to MoonPay Payment page
    const [page2] = await Promise.all([page.waitForEvent("popup"), page.click("button:has-text('Top up')")]);
    // closing moonpay page, will show an error on top up page
    page2.close();
    await wait(1000);
    await ensureTextualElementExists(page, "Transaction could not complete.");
  });

  test("Changing of crypto/fiat currency changes the value you receive correctly", async () => {
    // see navigation works correctly
    await page.click("button:has-text('Top up')");
    // change crypto currency to SOL
    await switchCryptoCurrency(page, "SOL");
    // change fiat currency EUR
    const USDFiatYouReceive = Number(await getInnerText(page, "#resCryptoAmt"));
    await changeFiatCurrency(page, "EUR");
    const EURFiatYouReceive = Number(await getInnerText(page, "#resCryptoAmt"));
    // ensure EURFiatYouReceive value is not equal to USDFiatYouReceive
    expect(EURFiatYouReceive !== USDFiatYouReceive).toBeTruthy();
    await changeFiatCurrency(page, "USD");
  });

  // test("Language change should work", async () => {
  //   await switchTab(page, "topup");

  //   await changeLanguage(page, "german");
  //   await wait(500);
  //   await ensureTextualElementExists(page, "Wählen Sie einen Anbieter");

  //   await changeLanguage(page, "japanese");
  //   await wait(500);
  //   await ensureTextualElementExists(page, "プロバイダーを選択");

  //   await changeLanguage(page, "korean");
  //   await wait(500);
  //   await ensureTextualElementExists(page, "공급자를 선택하십시오");

  //   await changeLanguage(page, "mandarin");
  //   await wait(500);
  //   await ensureTextualElementExists(page, "选择供应商");

  //   await changeLanguage(page, "spanish");
  //   await wait(500);
  //   await ensureTextualElementExists(page, "Selecciona un Proveedor");

  //   await changeLanguage(page, "english");
  // });
});

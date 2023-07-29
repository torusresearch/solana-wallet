// const { test} = require("@playwright/test");
import { expect, Page } from "@playwright/test";

import { IMPORT_ACC_SECRET_KEY, login } from "../../auth-helper";
import {
  clickPubKeyIcon,
  clickTokenIfAvailable,
  clickTopupButton,
  clickTransferButton,
  ensureCopiedToastDisplayed,
  selectCurrency,
} from "../../home.utils";
import { ensureTextualElementExists, getInnerText, importAccount, switchNetwork, switchTab, wait } from "../../utils";
import test, { markResult, setBrowserStackTestTitle } from "../fixtures";

test.describe("Home Page", async () => {
  let page: Page;
  test.beforeEach(async ({ browser, browserName }) => {
    page = await login(await browser.newContext(), browserName);
  });
  test.afterAll(async () => {
    await page.close();
  });
  test.afterAll(markResult);
  test.beforeEach(setBrowserStackTestTitle);

  test("Home Page Should render", async () => {
    // see navigation works correctly
    await switchTab(page, "home");

    // ENSURE UI IS INTACT
    await ensureTextualElementExists(page, "Account Balance");
  });

  test("Topup Button click should take to topup page", async () => {
    // see navigation works correctly
    await switchTab(page, "home");

    // ENSURE TopUp button click should take to topup page
    // await clickTopupButton(page);
    await page.click("button >> text=Top up");
    await wait(1000);
    await ensureTextualElementExists(page, "Select a Provider");
  });

  test("Transfer button click should take to transfer page", async () => {
    // see navigation works correctly
    await switchTab(page, "home");

    // ENSURE Transfer button click should take to transfer page
    await clickTransferButton(page);
    await wait(1000);
    await ensureTextualElementExists(page, "Transfer Details");
  });

  test("Currency Change should work correctly", async () => {
    // see navigation works correctly
    await switchTab(page, "home");
    // Switching to testnet as it has > 0 balance
    await switchNetwork(page, "testnet");
    expect(await getInnerText(page, "#selected_network")).toContain("Solana Testnet");

    // ENSURE On selecting EUR as currency, conversion rate has a positive value
    await selectCurrency(page, "EUR");
    const eurRate = Number(await getInnerText(page, "#conversionRate"));
    expect(eurRate).toBeGreaterThan(0);

    // ENSURE On selecting USD as currency, conversion rate has a positive value
    await selectCurrency(page, "USD");
    const usdRate = Number(await getInnerText(page, "#conversionRate"));
    expect(usdRate).toBeGreaterThan(0);

    // ENSURE the rate of EUR and USD are different, means the system working correctly
    expect(eurRate !== usdRate).toBeTruthy();
  });

  test("Tokens should display and clicking should take to transfer page", async () => {
    // see navigation works correctly
    await switchTab(page, "home");
    // Switching to testnet as it has our nfts
    await switchNetwork(page, "testnet");
    // Ensure Tokens are displayed
    await ensureTextualElementExists(page, "Tokens");
    await clickTokenIfAvailable(page);
  });

  // test("Language change should work", async () => {
  //   // see navigation works correctly
  //   await switchTab(page, "home");

  //   await changeLanguage(page, "german");
  //   await wait(500);
  //   await ensureTextualElementExists(page, "Kontostand");

  //   await changeLanguage(page, "japanese");
  //   await wait(500);
  //   await ensureTextualElementExists(page, "残高");

  //   await changeLanguage(page, "korean");
  //   await wait(500);
  //   await ensureTextualElementExists(page, "계정 잔액");

  //   await changeLanguage(page, "mandarin");
  //   await wait(500);
  //   await ensureTextualElementExists(page, "账户余额");

  //   await changeLanguage(page, "spanish");
  //   await wait(500);
  //   await ensureTextualElementExists(page, "Balance de Cuenta");

  //   await changeLanguage(page, "english");
  //   await wait(500);
  // });

  test("clicking on public key icon copies public key to clipboard", async () => {
    // see navigation works correctly
    await switchTab(page, "home");
    // ENSURE clicking on public key icon on home page copies key to clipboard
    await clickPubKeyIcon(page);
    await ensureCopiedToastDisplayed(page);
  });
});

/** ************IMPORT ACCOUNT TESTS************************** */

test.skip("Home Page with Imported Account", async () => {
  let page: Page;
  test.beforeAll(async ({ browser, browserName }) => {
    page = await login(await browser.newContext(), browserName);
  });
  test.beforeEach(async () => {
    await importAccount(page, IMPORT_ACC_SECRET_KEY);
  });

  test("Home Page Should render", async () => {
    // see navigation works correctly
    await switchTab(page, "home");

    // ENSURE UI IS INTACT
    await ensureTextualElementExists(page, "Account Balance");
  });

  test("Topup Button click should take to topup page", async () => {
    // see navigation works correctly
    await switchTab(page, "home");

    // ENSURE TopUp button click should take to topup page
    await clickTopupButton(page);
    await wait(1000);
    await ensureTextualElementExists(page, "Select a Provider");
  });

  test("Transfer button click should take to transfer page", async () => {
    // see navigation works correctly
    await switchTab(page, "home");

    // ENSURE Transfer button click should take to transfer page
    await clickTransferButton(page);
    await wait(1000);
    await ensureTextualElementExists(page, "Transfer Details");
  });

  test("Currency Change should work correctly", async () => {
    // see navigation works correctly
    await switchTab(page, "home");
    // Switching to testnet as it has > 0 balance
    await switchNetwork(page, "testnet");
    expect(await getInnerText(page, "#selected_network")).toContain("Solana Testnet");

    // ENSURE On selecting EUR as currency, conversion rate has a positive value
    await selectCurrency(page, "EUR");
    await wait(1000);
    const eurRate = Number(await getInnerText(page, "#conversionRate"));
    expect(eurRate).toBeGreaterThan(0);

    // ENSURE On selecting USD as currency, conversion rate has a positive value
    await selectCurrency(page, "USD");
    await wait(1000);
    const usdRate = Number(await getInnerText(page, "#conversionRate"));
    expect(usdRate).toBeGreaterThan(0);

    // ENSURE the rate of EUR and USD are different, means the system working correctly
    expect(eurRate !== usdRate).toBeTruthy();
  });

  test("Tokens should display and clicking should take to transfer page", async () => {
    // see navigation works correctly
    await switchTab(page, "home");
    // Switching to testnet as it has our nfts
    await switchNetwork(page, "testnet");
    // Ensure Tokens are displayed
    await ensureTextualElementExists(page, "Tokens");
    await wait(1000);
    await clickTokenIfAvailable(page);
  });

  test("clicking on public key icon copies public key to clipboard", async () => {
    // see navigation works correctly
    await switchTab(page, "home");
    // ENSURE clicking on public key icon on home page copies key to clipboard
    await clickPubKeyIcon(page);
    await ensureCopiedToastDisplayed(page);
  });
});

// const { test} = require("@playwright/test");
import test, { expect, Page } from "@playwright/test";

import { IMPORT_ACC_SECRET_KEY, login } from "../../auth-helper";
import {
  changeLanguage,
  ensureTextualElementExists,
  getControllerState,
  getInnerText,
  importAccount,
  switchNetwork,
  switchTab,
  wait,
} from "../../utils";

test.describe("Home Page", async () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await login(await browser.newContext());
  });

  test("Home Page Should render", async () => {
    // see navigation works correctly
    await switchTab(page, "home");

    // ENSURE UI IS INTACT
    await ensureTextualElementExists(page, "TOTAL VALUE");
  });

  test("Topup Button click should take to correct route", async () => {
    // see navigation works correctly
    await switchTab(page, "home");

    // ENSURE TopUp button click should take to correct route
    await page.click("button >> text=Top up");
    await wait(1000);
    expect(page.url().includes("/wallet/topup")).toBeTruthy();
  });

  test("Transfer button click should take to correct route", async () => {
    // see navigation works correctly
    await switchTab(page, "home");

    // ENSURE Transfer button click should take to correct route
    page.click("button >> text=Transfer");
    await wait(1000);
    expect(page.url().endsWith("/wallet/transfer")).toBeTruthy();
  });

  test("Currency Change should work correctly", async () => {
    // see navigation works correctly
    await switchTab(page, "home");
    // Switching to testnet as it has > 0 balance
    await switchNetwork(page, "testnet");

    // ENSURE On selecting EUR as currency, conversion rate has a positive value
    await page.click("#currencySelector");
    await page.click("li[role='option'] >> text=EUR");
    await wait(1000);
    const eurRate = Number(await getInnerText(page, "#conversionRate"));
    expect(eurRate).toBeGreaterThan(0);

    // ENSURE On selecting USD as currency, conversion rate has a positive value
    await page.click("#currencySelector");
    await page.click("li[role='option'] >> text=USD");
    await wait(1000);
    const usdRate = Number(await getInnerText(page, "#conversionRate"));
    expect(usdRate).toBeGreaterThan(0);

    // ENSURE the rate of EUR and USD are different, means the system working correctly
    expect(eurRate !== usdRate).toBeTruthy();
  });

  test("Tokens and NFTs should display", async () => {
    // see navigation works correctly
    await switchTab(page, "home");
    // Switching to testnet as it has our nfts
    await switchNetwork(page, "testnet");
    const ControllerModule = await getControllerState(page);
    let tokens = ControllerModule.torusState.TokensTrackerState.tokens[ControllerModule.torusState.PreferencesControllerState.selectedAddress] as {
      isFungible: boolean;
      balance: {
        uiAmount: number;
      };
    }[];
    tokens = tokens.filter((token) => token.balance.uiAmount);
    const NFT = tokens.filter((token) => !token.isFungible);
    const SPL = tokens.filter((token) => token.isFungible);
    if (NFT.length) {
      const tokenTabs = page.locator(".tok-tab");
      await tokenTabs.first().click();
      const nft_count = (await page.locator("div.nft-item .token-desc.summary").allInnerTexts())
        .map((e) => parseInt(e.split(" ")[0], 10))
        .reduce((curr, prev) => curr + prev, 0);
      expect(nft_count).toStrictEqual(NFT.length);
    }

    if (SPL.length) {
      const tokenTabs = page.locator("div.tok-tab");
      await tokenTabs.last().click();
      expect(await page.locator("div.token-item").elementHandles()).toHaveLength(SPL.length);
    }
  });

  test("Clicking on NFT should navigate to nfts route", async () => {
    // see navigation works correctly
    await switchTab(page, "home");
    // Switching to testnet as it has our nfts
    await switchNetwork(page, "testnet");
    const ControllerModule = await getControllerState(page);
    let tokens = ControllerModule.torusState.TokensTrackerState.tokens[ControllerModule.torusState.PreferencesControllerState.selectedAddress] as {
      isFungible: boolean;
      balance: {
        uiAmount: number;
      };
    }[];
    tokens = tokens.filter((token) => token.balance.uiAmount);
    const NFT = tokens.filter((token) => !token.isFungible);
    if (NFT.length) {
      const tokenTabs = page.locator(".tok-tab");
      await tokenTabs.first().click();
      await page.click("div.nft-item");
      await wait(1000);
      expect(/.*\/wallet\/nfts\?mints=.*$/.test(page.url())).toBeTruthy();
      await page.click(".nft-item");
      await page.click(".nft-item button");
      await wait(1000);
      expect(/.*\/wallet\/transfer\?mint=.*$/.test(page.url())).toBeTruthy();
    }
  });

  test("Clicking on SPL token should navigate to transfer route with token selected", async () => {
    // see navigation works correctly
    await switchTab(page, "home");
    // Switching to testnet as it has our nfts
    await switchNetwork(page, "testnet");
    const ControllerModule = await getControllerState(page);
    let tokens = ControllerModule.torusState.TokensTrackerState.tokens[ControllerModule.torusState.PreferencesControllerState.selectedAddress] as {
      isFungible: boolean;
      balance: {
        uiAmount: number;
      };
    }[];
    tokens = tokens.filter((token) => token.balance.uiAmount);
    const SPL = tokens.filter((token) => token.isFungible);
    if (SPL.length) {
      const tokenTabs = page.locator(".tok-tab");
      await tokenTabs.last().click();
      await page.click("div.token-item");
      await wait(1000);
      expect(/.*\/wallet\/transfer\?mint=.*$/.test(page.url())).toBeTruthy();
    }
  });

  test("Language change should work", async () => {
    // see navigation works correctly
    await switchTab(page, "home");

    await changeLanguage(page, "german");
    await wait(400);
    await ensureTextualElementExists(page, "Kontostand");

    await changeLanguage(page, "japanese");
    await wait(400);
    await ensureTextualElementExists(page, "残高");

    await changeLanguage(page, "korean");
    await wait(400);
    await ensureTextualElementExists(page, "계정 잔액");

    await changeLanguage(page, "mandarin");
    await wait(400);
    await ensureTextualElementExists(page, "账户余额");

    await changeLanguage(page, "spanish");
    await wait(400);
    await ensureTextualElementExists(page, "Balance de Cuenta");

    await changeLanguage(page, "english");
  });
});

/** ************IMPORT ACCOUNT TESTS************************** */

test.describe("Home Page with Imported Account", async () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await login(await browser.newContext());
  });
  test.beforeEach(async () => {
    await importAccount(page, IMPORT_ACC_SECRET_KEY);
  });

  test("Home Page Should render", async () => {
    // see navigation works correctly
    await switchTab(page, "home");

    // ENSURE UI IS INTACT
    await ensureTextualElementExists(page, "TOTAL VALUE");
  });

  test("Topup Button click should take to correct route", async () => {
    // see navigation works correctly
    await switchTab(page, "home");

    // ENSURE TopUp button click should take to correct route
    await page.click("button >> text=Top up");
    await wait(1000);
    expect(page.url().includes("/wallet/topup")).toBeTruthy();
  });

  test("Transfer button click should take to correct route", async () => {
    // see navigation works correctly
    await switchTab(page, "home");

    // ENSURE Transfer button click should take to correct route
    page.click("button >> text=Transfer");
    await wait(1000);
    expect(page.url().endsWith("/wallet/transfer")).toBeTruthy();
  });

  test("Currency Change should work correctly", async () => {
    // see navigation works correctly
    await switchTab(page, "home");
    // Switching to testnet as it has > 0 balance
    await switchNetwork(page, "testnet");

    // ENSURE On selecting EUR as currency, conversion rate has a positive value
    await page.click("#currencySelector");
    await page.click("li[role='option'] >> text=EUR");
    await wait(1000);
    const eurRate = Number(await getInnerText(page, "#conversionRate"));
    expect(eurRate).toBeGreaterThan(0);

    // ENSURE On selecting USD as currency, conversion rate has a positive value
    await page.click("#currencySelector");
    await page.click("li[role='option'] >> text=USD");
    await wait(1000);
    const usdRate = Number(await getInnerText(page, "#conversionRate"));
    expect(usdRate).toBeGreaterThan(0);

    // ENSURE the rate of EUR and USD are different, means the system working correctly
    expect(eurRate !== usdRate).toBeTruthy();
  });

  test("Tokens and NFTs should display", async () => {
    // see navigation works correctly
    await switchTab(page, "home");
    // Switching to testnet as it has our nfts
    await switchNetwork(page, "testnet");
    const ControllerModule = await getControllerState(page);
    let tokens = ControllerModule.torusState.TokensTrackerState.tokens[ControllerModule.torusState.PreferencesControllerState.selectedAddress] as {
      isFungible: boolean;
      balance: {
        uiAmount: number;
      };
    }[];
    tokens = tokens.filter((token) => token.balance.uiAmount);
    const NFT = tokens.filter((token) => !token.isFungible);
    const SPL = tokens.filter((token) => token.isFungible);
    if (NFT.length) {
      const tokenTabs = page.locator(".tok-tab");
      await tokenTabs.first().click();
      const nft_count = (await page.locator("div.nft-item .token-desc.summary").allInnerTexts())
        .map((e) => parseInt(e.split(" ")[0], 10))
        .reduce((curr, prev) => curr + prev, 0);
      expect(nft_count).toStrictEqual(NFT.length);
    }

    if (SPL.length) {
      const tokenTabs = page.locator("div.tok-tab");
      await tokenTabs.last().click();
      expect(await page.locator("div.token-item").elementHandles()).toHaveLength(SPL.length);
    }
  });

  test("Clicking on NFT should navigate to nfts route", async () => {
    // see navigation works correctly
    await switchTab(page, "home");
    // Switching to testnet as it has our nfts
    await switchNetwork(page, "testnet");
    const ControllerModule = await getControllerState(page);
    let tokens = ControllerModule.torusState.TokensTrackerState.tokens[ControllerModule.torusState.PreferencesControllerState.selectedAddress] as {
      isFungible: boolean;
      balance: {
        uiAmount: number;
      };
    }[];
    tokens = tokens.filter((token) => token.balance.uiAmount);
    const NFT = tokens.filter((token) => !token.isFungible);
    if (NFT.length) {
      const tokenTabs = page.locator(".tok-tab");
      await tokenTabs.first().click();
      await page.click("div.nft-item");
      await wait(1000);
      expect(/.*\/wallet\/nfts\?mints=.*$/.test(page.url())).toBeTruthy();
      await page.click(".nft-item");
      await page.click(".nft-item button");
      await wait(1000);
      expect(/.*\/wallet\/transfer\?mint=.*$/.test(page.url())).toBeTruthy();
    }
  });

  test("Clicking on SPL token should navigate to transfer route with token selected", async () => {
    // see navigation works correctly
    await switchTab(page, "home");
    // Switching to testnet as it has our nfts
    await switchNetwork(page, "testnet");
    const ControllerModule = await getControllerState(page);
    let tokens = ControllerModule.torusState.TokensTrackerState.tokens[ControllerModule.torusState.PreferencesControllerState.selectedAddress] as {
      isFungible: boolean;
      balance: {
        uiAmount: number;
      };
    }[];
    tokens = tokens.filter((token) => token.balance.uiAmount);
    const SPL = tokens.filter((token) => token.isFungible);
    if (SPL.length) {
      const tokenTabs = page.locator(".tok-tab");
      await tokenTabs.last().click();
      await page.click("div.token-item");
      await wait(1000);
      expect(/.*\/wallet\/transfer\?mint=.*$/.test(page.url())).toBeTruthy();
    }
  });

  test("Language change should work", async () => {
    // see navigation works correctly
    await switchTab(page, "home");

    await changeLanguage(page, "german");
    await wait(400);
    await ensureTextualElementExists(page, "Kontostand");

    await changeLanguage(page, "japanese");
    await wait(400);
    await ensureTextualElementExists(page, "残高");

    await changeLanguage(page, "korean");
    await wait(400);
    await ensureTextualElementExists(page, "계정 잔액");

    await changeLanguage(page, "mandarin");
    await wait(400);
    await ensureTextualElementExists(page, "账户余额");

    await changeLanguage(page, "spanish");
    await wait(400);
    await ensureTextualElementExists(page, "Balance de Cuenta");

    await changeLanguage(page, "english");
  });
});

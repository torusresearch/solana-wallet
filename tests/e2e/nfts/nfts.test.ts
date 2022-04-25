// const { test} = require("@playwright/test");
import test, { expect, Page } from "@playwright/test";

import { login } from "../../auth-helper";
import { ensureTextualElementExists, switchNetwork, switchTab, wait } from "../../utils";

test.describe("Nfts Page", async () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await login(await browser.newContext());
    await switchNetwork(page, "mainnet");
  });
  test.beforeEach(async () => {
    await switchTab(page, "nfts", false);
    await wait(2000);
  });

  test.afterAll(() => {
    page.close();
  });

  test("NFTs Page Should render", async () => {
    // ENSURE UI IS INTACT
    await ensureTextualElementExists(page, "NFTs");
  });

  test("If no NFTs project eventually load popular NFTs project", async () => {
    await ensureTextualElementExists(page, "You might be keen to check out some of the popular NFT projects");
    expect(await page.locator(".popular-nft").count()).toBeGreaterThan(0);
  });

  test("If has NFTs project eventually load all NFTs", async () => {
    test.slow();
    await switchNetwork(page, "testnet");
    // on tesnet it sometimes takes a lot of time to load the NFTs.
    await wait(20000);
    expect(await page.locator(".nft-title").count()).toBe(1);
    const totalNfts = (await page.locator(".nft-title").innerText()).match(/\d+/)?.[0] || 0;
    expect(+totalNfts).toBeGreaterThan(0);
  });

  test("Click on NFT should open  page with correct information, clicking on Send should take on transfer page", async () => {
    await page.locator(".nft-item").first().click();
    await wait(2000);
    await page.locator(".send-nft").first().click();
    await wait(1000);
    await ensureTextualElementExists(page, "Transfer Details");
  });
});

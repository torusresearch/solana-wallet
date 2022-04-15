import test, { expect, Page } from "@playwright/test";

import { login, PUB_ADDRESS } from "../../auth-helper";
import { ensureFirstActivityIsRecentTransaction } from "../../transfer.utils";
import { changeLanguage, ensureTextualElementExists, switchNetwork, switchTab, wait } from "../../utils";

test.describe("Transfer page", async () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await login(await browser.newContext());
  });
  test.afterAll(() => {
    page.close();
  });

  test("Transfer Page Should render", async () => {
    // see navigation works correctly
    await switchTab(page, "transfer");

    // ENSURE UI IS INTACT
    await ensureTextualElementExists(page, "Transfer Details");
  });

  test("Checks before transaction should be correct", async () => {
    // see navigation works correctly
    await switchTab(page, "transfer");

    // if address is not a valid sol address, should show error
    await page.fill("input[type='text']", "asdasdasdasdasdasd");
    await page.fill("input[type='number']", "0.01");
    await page.click("button >> text=Transfer");
    expect(await page.locator("text=Invalid SOL Address").elementHandles()).toHaveLength(1);

    // using testnet as we poor on mainnet
    await switchNetwork(page, "testnet");
    // if address is a valid sol address, should show popup
    await page.fill("input[type='text']", PUB_ADDRESS);
    // if amount is not valid, should show error
    await page.fill("input[type='number']", "0");
    await page.click("button >> text=Transfer");
    await wait(1000);
    expect(await page.locator("text=Must be greater than 0.0001").elementHandles()).toHaveLength(1);
    // entering valid amount
    await page.fill("input[type='number']", "0.01");
    await page.click("button >> text=Transfer");
    await wait(1000);
    expect(await page.locator("text=Total Cost").elementHandles()).toHaveLength(1);
    await page.click("button >> text=Cancel");
    // entering no amount, empty field
    await page.fill("input[type='number']", "");
    await wait(1000);
    expect(await page.locator("text=Must be greater than 0.0001").elementHandles()).toHaveLength(1);
    expect(await page.locator("button >> text=Transfer").isDisabled()).toBeTruthy();
  });

  test("Transaction should happen correctly", async () => {
    test.slow();
    // see navigation works correctly
    await switchTab(page, "transfer");

    const transferAmount = (Math.random() / 100).toFixed(4);

    // using testnet as we poor on mainnet
    await switchNetwork(page, "testnet");

    // Click transfer tab
    await Promise.all([page.click("text=Transfer"), wait(1000)]);

    // Fill a valid sol address
    await page.fill(".combo-input-field[aria-label='Select field']", PUB_ADDRESS);

    // Fill a unique random amount
    await page.fill("input[type='number']", transferAmount);
    await wait(5000);
    // Click transfer, wait for popup
    await page.click("button >> text=Transfer");
    await page.waitForSelector("button:not([disabled]) >> text=Confirm", { timeout: 30_000 });
    // const total = (await page.locator("div >> text=/~ [0-9.].* SOL/").first().innerText()).split(" ")[1];
    // Click confirm, wait for navigation to activities page

    await page.click("button >> text=Confirm");

    await page.click("button >> text=Close");
    await wait(5000);
    // ensure first activity to be our recent transaction
    await ensureFirstActivityIsRecentTransaction(page, `Sent ${parseFloat(transferAmount)} SOL`);

    const [page2] = await Promise.all([page.waitForEvent("popup"), page.click(".transaction-activity")]);
    await page2.waitForEvent("load", { timeout: 10_000 });

    // see that the transaction is success and the amount transferred is same as intended
    // expect(await page2.locator(".badge.bg-success-soft").innerText()).toEqual("Success");
    // expect(Number((await page2.locator(".badge.bg-warning-soft").innerText()).replace(/[^0-9.]/g, ""))).toEqual(Number(total));
    await page2.close();
  });

  test("Transfer SPL token", async () => {
    test.slow();
    // see navigation works correctly
    await switchTab(page, "transfer");

    // using testnet as we poor on mainnet
    await switchNetwork(page, "testnet");
    await page.click("button >> text=Solana");
    await page.click("p >> text=USD Coin (USDC)");
    await page.fill("input.combo-input-field", PUB_ADDRESS);
    await wait(5000);

    await page.fill("input[type='number']", "0.01");
    await wait(5000);
    await page.click("button >> text=Transfer");
    await page.waitForSelector("button>> text=Confirm", { timeout: 30_000 });
    await page.click("button >> text=Confirm");
    await page.click("button >> text=Close");
    await wait(5000);
    // ensure first activity to be our recent transaction
    await ensureFirstActivityIsRecentTransaction(page, "Sent 0.01 USDC");
    const [page2] = await Promise.all([page.waitForEvent("popup"), page.click(".transaction-activity")]);
    await page2.waitForEvent("load", { timeout: 30_000 });
    // await page2.waitForSelector(".badge.bg-success-soft >> text=+0.01");
    await page2.close();
  });

  test.skip("Transfer NFT", async () => {
    test.slow();
    // see navigation works correctly
    await switchTab(page, "transfer");
    // using testnet as we poor on mainnet
    await switchNetwork(page, "testnet");
    await page.click("button >> text=Solana");
    const nft = page.locator("p >> text=I WANT UR NFT (WTB_NFT)").first();
    const nft_symbol = (await nft.innerText()).match(/\((.*)\)/)?.[1] as string;
    await nft.click();
    await page.fill("input.combo-input-field", PUB_ADDRESS);
    await page.click("button >> text=Transfer");
    await page.waitForSelector("button:not([disabled]) >> text=Confirm", { timeout: 10_000 });
    await page.click("button >> text=Confirm");
    await page.click("button >> text=Close");
    await wait(5000);
    // ensure first activity to be our recent transaction
    await ensureFirstActivityIsRecentTransaction(page, `Sent 1 ${nft_symbol}`);
    const [page2] = await Promise.all([page.waitForEvent("popup"), page.click(".transaction-activity")]);
    await page2.waitForEvent("load", { timeout: 10_000 });
    // await page2.waitForSelector(".badge.bg-success-soft >> text=+1");
    await page2.close();
  });

  test("Language change should work", async () => {
    // see navigation works correctly
    await switchTab(page, "transfer");

    await changeLanguage(page, "german");
    await wait(500);
    await ensureTextualElementExists(page, "Übertragungsdetails");

    await changeLanguage(page, "japanese");
    await wait(500);
    await ensureTextualElementExists(page, "送信内容の詳細");

    await changeLanguage(page, "korean");
    await wait(500);
    await ensureTextualElementExists(page, "전송 세부 사항");

    await changeLanguage(page, "mandarin");
    await wait(500);
    await ensureTextualElementExists(page, "转账明细");

    await changeLanguage(page, "spanish");
    await wait(500);
    await ensureTextualElementExists(page, "Detalles de Transferencia");

    await changeLanguage(page, "english");
  });

  test("Should show error for escrow accounts", async () => {
    test.slow();
    // see navigation works correctly
    await switchTab(page, "transfer");

    // using testnet as we poor on mainnet
    await switchNetwork(page, "mainnet");

    await page.click("button >> text=Solana");
    // TODO change this address to something more permanent
    await page.fill("input[type='text']", "butterchicken.sol");
    await wait(1000);
    await page.fill("input[type='number']", "0.01");
    await wait(1000);
    await page.click("button >> text=Transfer");
    await wait(1000);
    expect(await page.locator("text=Owner is an Escrow Account").elementHandles()).toHaveLength(1);
  });

  test("Should show error for invalid accounts.", async () => {
    test.slow();
    // see navigation works correctly
    await switchTab(page, "transfer");

    // using testnet as we poor on mainnet
    await switchNetwork(page, "mainnet");

    await page.click("button >> text=Solana");
    await page.fill("input[type='text']", "etyriuqtweryuitqerqtwiq.sol");
    await wait(1000);
    await page.fill("input[type='number']", "0.01");
    await wait(1000);
    await page.click("button >> text=Transfer");
    await wait(1000);
    expect(await page.locator("text=Account Does Not Exist").elementHandles()).toHaveLength(1);
  });

  test("Should resolve to correct address for NFT wrapped accounts.", async () => {
    test.slow();
    // see navigation works correctly
    await switchTab(page, "transfer");

    // using testnet as we poor on mainnet
    await switchNetwork(page, "mainnet");

    await page.click("button >> text=Solana");
    await page.fill("input[type='text']", "goishan.sol");
    await wait(1000);
    await page.fill("input[type='number']", "0.01");
    await wait(1000);
    await page.click("button >> text=Transfer");
    await wait(3000);
    expect(await page.locator("text=5YQHt...kQ9rF").elementHandles()).toHaveLength(1);
  });
});

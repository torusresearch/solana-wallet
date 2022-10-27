import { expect, Page } from "@playwright/test";

import { IMPORT_ACC_SECRET_KEY, login, PUB_ADDRESS } from "../../auth-helper";
import { ensureFirstActivityIsRecentTransaction } from "../../transfer.utils";
import { ensureTextualElementExists, importAccount, switchNetwork, wait } from "../../utils";
import test, { markResult, setBrowserStackTestTitle } from "../fixtures";

test.describe("Transfer page", async () => {
  let page: Page;
  test.beforeEach(async ({ browser, browserName }) => {
    page = await login(await browser.newContext(), browserName);
  });
  test.afterAll(async () => {
    await page.close();
  });
  test.afterAll(markResult);
  test.beforeEach(setBrowserStackTestTitle);

  test("Transfer Page Should render", async () => {
    // see navigation works correctly
    await page.click("button:has-text('Transfer')");
    await wait(1000);

    // ENSURE UI IS INTACT
    await ensureTextualElementExists(page, "Transfer Details");
  });

  test("Prevents transaction to an invalid solana address", async () => {
    // see navigation works correctly
    await page.click("button:has-text('Transfer')");
    await wait(1000);

    // if address is not a valid sol address, should show error
    await page.fill("input[type='text']", "asdasdasdasdasdasd");
    await page.fill("input[type='number']", "0.01");
    await page.click("button >> text=Transfer");
    expect(await page.locator("text=Invalid SOL Address").elementHandles()).toHaveLength(1);
  });

  test("Prevents sending zero value transactions", async () => {
    // see navigation works correctly
    await page.click("button:has-text('Transfer')");
    await wait(1000);
    // if address is a valid sol address, should show popup
    await page.fill("input[type='text']", PUB_ADDRESS);
    // if amount is not valid, should show error
    await page.fill("input[type='number']", "0");
    await wait(500);
    await page.click("button >> text=Transfer");
    await wait(1000);
    expect(await page.locator("text=Must be greater than 0.0001").elementHandles()).toHaveLength(1);
  });

  test.skip("Check if total cost is displayed before confirming", async () => {
    // see navigation works correctly
    await page.click("button:has-text('Transfer')");
    await page.fill("input[type='text']", PUB_ADDRESS);
    await page.fill("input[type='number']", "0.01");
    await page.click("button >> text=Transfer");
    await wait(1000);
    expect(await page.locator("text=Total Cost").elementHandles()).toHaveLength(1);
    await page.click("button >> text=Cancel");
  });

  test("Prevents empty field in the amount", async () => {
    // see navigation works correctly
    await page.click("button:has-text('Transfer')");
    // entering no amount, empty field
    await page.fill("input[type='text']", PUB_ADDRESS);
    await page.fill("input[type='number']", "");
    await page.click("button >> text=Transfer");
    expect(await page.locator("text=Must be greater than 0.0001").elementHandles()).toHaveLength(1);
    expect(await page.locator("button >> text=Transfer").isDisabled()).toBeTruthy();
  });

  test("Transaction should happen correctly", async () => {
    test.slow();
    // see navigation works correctly
    await page.click("button:has-text('Transfer')");
    await wait(1000);
    const transferAmount = (Math.random() / 100).toFixed(4);
    // global.console.log("amount to transfer is : ", transferAmount);

    // using testnet as we poor on mainnet
    await switchNetwork(page, "testnet");

    // Click transfer tab
    // await Promise.all([page.click("text=Transfer"), wait(1000)]);

    // Fill a valid sol address
    // await page.fill(".combo-input-field[aria-label='Select field']", PUB_ADDRESS);
    await page.fill("input[type='text']", PUB_ADDRESS);

    // Fill a unique random amount
    // await page.fill("input[type='number']", transferAmount);
    await page.fill("input[type='number']", transferAmount);

    // Click transfer, wait for popup
    await wait(3000);
    await page.click("button >> text=Transfer");
    await page.waitForSelector("button:not([disabled]) >> text=Confirm", { timeout: 20_000 });
    // const total = (await page.locator("div >> text=/~ [0-9.].* SOL/").first().innerText()).split(" ")[1];
    // Click confirm, wait for navigation to activities page

    await page.click("button >> text=Confirm");

    await page.click("button >> text=Close");

    await wait(1000);

    // ensure first activity to be our recent transaction
    await ensureFirstActivityIsRecentTransaction(page, `Sent ${parseFloat(transferAmount)} SOL`);

    const [page2] = await Promise.all([page.waitForEvent("popup"), page.click(".transaction-activity")]);
    await page2.waitForEvent("load", { timeout: 15_000 });

    // see that the transaction is success and the amount transferred is same as intended
    // expect(await page2.locator(".badge.bg-success-soft").innerText()).toEqual("Success");
    // expect(Number((await page2.locator(".badge.bg-warning-soft").innerText()).replace(/[^0-9.]/g, ""))).toEqual(Number(total));
    await page2.close();
  });

  test("Transfer SPL token", async () => {
    test.slow();
    // see navigation works correctly
    await page.click("button:has-text('Transfer')");
    await wait(1000);

    // using testnet as we poor on mainnet
    await switchNetwork(page, "testnet");
    await page.click("button >> text=Solana");
    await page.click("p >> text=USD Coin (USDC)");
    await page.fill("input.combo-input-field", PUB_ADDRESS);
    await page.fill("input[type='number']", "0.01");
    await wait(3000);
    await page.click("button >> text=Transfer");
    await page.waitForSelector("button:not([disabled]) >> text=Confirm", { timeout: 10_000 });
    await page.click("button >> text=Confirm");
    await page.click("button >> text=Close");
    await wait(1000);
    // ensure first activity to be our recent transaction
    await ensureFirstActivityIsRecentTransaction(page, "Sent 0.01 USDC");
    const [page2] = await Promise.all([page.waitForEvent("popup"), page.click(".transaction-activity")]);
    await page2.waitForEvent("load", { timeout: 15_000 });
    // await page2.waitForSelector(".badge.bg-success-soft >> text=+0.01");
    await page2.close();
  });

  // TODO : FIX TEST, SEE WHY THE NFTs are not being fetched reliably
  // LEADS : lot of CORS errors in the playwright chrome, none on the local.

  test.skip("Transfer NFT", async () => {
    test.slow();
    // see navigation works correctly
    await page.click("button:has-text('Transfer')");
    await wait(1000);
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
    // ensure first activity to be our recent transaction
    await ensureFirstActivityIsRecentTransaction(page, `Sent 1 ${nft_symbol}`);
    const [page2] = await Promise.all([page.waitForEvent("popup"), page.click(".transaction-activity")]);
    await page2.waitForEvent("load", { timeout: 10_000 });
    // await page2.waitForSelector(".badge.bg-success-soft >> text=+1");
    await page2.close();
  });

  // test("Language change should work", async () => {
  //   // see navigation works correctly
  //   await switchTab(page, "transfer");

  //   await changeLanguage(page, "german");
  //   await wait(500);
  //   await ensureTextualElementExists(page, "Übertragungsdetails");

  //   await changeLanguage(page, "japanese");
  //   await wait(500);
  //   await ensureTextualElementExists(page, "送信内容の詳細");

  //   await changeLanguage(page, "korean");
  //   await wait(500);
  //   await ensureTextualElementExists(page, "전송 세부 사항");

  //   await changeLanguage(page, "mandarin");
  //   await wait(500);
  //   await ensureTextualElementExists(page, "转账明细");

  //   await changeLanguage(page, "spanish");
  //   await wait(500);
  //   await ensureTextualElementExists(page, "Detalles de Transferencia");

  //   await changeLanguage(page, "english");
  // });
});

/** *****************IMPORT ACCOUNT TESTS********************** */

test.skip("Transfer page using imported account", async () => {
  let page: Page;
  test.beforeAll(async ({ browser, browserName }) => {
    page = await login(await browser.newContext(), browserName);
  });

  test.beforeEach(async () => {
    await importAccount(page, IMPORT_ACC_SECRET_KEY);
  });
  test("Checks before transaction should be correct", async () => {
    // see navigation works correctly
    await page.click("button:has-text('Transfer')");
    await wait(1000);

    // if address is not a valid sol address, should show error
    await page.fill("input[type='text']", "asdasdasdasdasdasd");
    await page.fill("input[type='number']", "0.01");
    await page.click("button >> text=Transfer");
    expect(await page.locator("text=Invalid SOL Address").elementHandles()).toHaveLength(1);

    // using testnet as we poor on mainnet
    await switchNetwork(page, "testnet");
    // if address is a valid sol address, should show popup
    await page.fill("input[type='text']", PUB_ADDRESS);
    await page.fill("input[type='number']", "0.01");
    await page.click("button >> text=Transfer");
    await wait(1000);
    expect(await page.locator("text=Total Cost").elementHandles()).toHaveLength(1);
    await page.click("button >> text=Cancel");
  });

  test.only("Transaction should happen correctly", async () => {
    test.slow();
    // see navigation works correctly
    await page.click("button:has-text('Transfer')");
    await wait(1000);

    const transferAmount = (Math.random() / 100).toFixed(4);

    // using testnet as we poor on mainnet
    await switchNetwork(page, "testnet");

    // Click transfer tab
    await Promise.all([page.click("text=Transfer"), wait(1000)]);

    // Fill a valid sol address
    await page.fill(".combo-input-field[aria-label='Select field']", PUB_ADDRESS);

    // Fill a unique random amount
    await page.fill("input[type='number']", transferAmount);

    // Click transfer, wait for popup
    await page.click("button >> text=Transfer");
    await page.waitForSelector("button:not([disabled]) >> text=Confirm", { timeout: 10_000 });
    // const total = (await page.locator("div >> text=/~ [0-9.].* SOL/").first().innerText()).split(" ")[1];
    // Click confirm, wait for navigation to activities page
    await page.click("button >> text=Confirm");

    await page.click("button >> text=Close");

    // wait for the first link to be our recent transaction
    await page.waitForFunction(
      (amount) => {
        const ele = document.querySelector(".transaction-activity");
        const text: string = (ele as any).innerText;
        const val = text.match(/ ([0-9.]*) SOL/)?.[1];
        if (Number(val) === Number(amount)) return true;
        return false;
      },
      transferAmount,
      { polling: 500 }
    );
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
    await page.click("button:has-text('Transfer')");
    await wait(1000);

    // using testnet as we poor on mainnet
    await switchNetwork(page, "testnet");

    await page.click("button >> text=Solana");
    await page.click("p >> text=USD Coin (USDC)");
    await page.fill("input.combo-input-field", PUB_ADDRESS);
    await page.fill("input[type='number']", "0.01");
    await page.click("button >> text=Transfer");
    await page.waitForSelector("button:not([disabled]) >> text=Confirm", { timeout: 10_000 });
    await page.click("button >> text=Confirm");
    await page.click("button >> text=Close");
    await page.waitForFunction(
      () => {
        const ele = document.querySelector(".transaction-activity");
        const text: string = (ele as any).innerText;
        const val = text.match(/ ([0-9.]*) USDC/)?.[1];
        if (Number(val) === 0.01) return true;
        return false;
      },
      { polling: 500 }
    );
    const [page2] = await Promise.all([page.waitForEvent("popup"), page.click(".transaction-activity")]);
    await page2.waitForEvent("load", { timeout: 10_000 });
    // await page2.waitForSelector(".badge.bg-success-soft >> text=+0.01");
    await page2.close();
  });

  test("Transfer NFT", async () => {
    test.slow();
    // see navigation works correctly
    await page.click("button:has-text('Transfer')");
    await wait(1000);

    // using testnet as we poor on mainnet
    await switchNetwork(page, "testnet");

    await page.click("button >> text=Solana");
    const nft = page.locator(".nft-group + li").first();
    const nft_symbol = (await nft.innerText()).match(/\((.*)\)/)?.[1] as string;
    await nft.click();
    await page.fill("input.combo-input-field", PUB_ADDRESS);
    await page.click("button >> text=Transfer");
    await page.waitForSelector("button:not([disabled]) >> text=Confirm", { timeout: 10_000 });
    await page.click("button >> text=Confirm");
    await page.click("button >> text=Close");

    await page.waitForFunction(
      (symbol) => {
        const ele = document.querySelector(".transaction-activity");
        const text: string = (ele as any).innerText;
        const nftSent = text.includes(`Sent 1 ${symbol}`);
        if (nftSent) return true;
        return false;
      },
      nft_symbol,
      { polling: 500 }
    );
    const [page2] = await Promise.all([page.waitForEvent("popup"), page.click(".transaction-activity")]);
    await page2.waitForEvent("load", { timeout: 10_000 });
    // await page2.waitForSelector(".badge.bg-success-soft >> text=+1");
    await page2.close();
  });
});

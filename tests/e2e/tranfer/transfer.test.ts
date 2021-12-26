import test, { expect, Page } from "@playwright/test";

import { login } from "../../auth-helper";
import { switchNetwork, switchTab, wait } from "../../utils";

test.describe("Transfer page", async () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await login(await browser.newContext());
  });
  test("Checks before transaction should be correct", async () => {
    // see navigation works correctly
    await switchTab(page, "transfer");

    // if address is not a valid sol address, should show error
    await page.fill("input[type='text']", "asdasdasdasdasdasd");
    await page.fill("input[type='number']", "1");
    await page.click("button:has-text('Transfer')");
    expect(await page.locator("text=Invalid SOL Address").elementHandles()).toHaveLength(1);

    // using testnet as we poor on mainnet
    await switchNetwork(page, "testnet");
    // if address is a valid sol address, should show popup
    await page.fill("input[type='text']", "5YQHtZcg8EQo3rjVL2PmFwFix1x8i3PjDsyuW6kkQ9rF");
    await page.fill("input[type='number']", "1");
    await page.click("button:has-text('Transfer')");
    await wait(1000);
    expect(await page.locator("text=Total Cost").elementHandles()).toHaveLength(1);
    await page.click("button >> text=Cancel");
  });
  test("Transaction should happen correctly", async () => {
    // see navigation works correctly
    await switchTab(page, "transfer");

    const transferAmount = (Math.random() / 100).toFixed(4);

    // using testnet as we poor on mainnet
    await switchNetwork(page, "testnet");

    // Click transfer tab
    await Promise.all([page.click("text=Transfer"), wait(1500)]);

    // Fill a valid sol address
    await page.fill(".combo-input-field[aria-label='Select field']", "5YQHtZcg8EQo3rjVL2PmFwFix1x8i3PjDsyuW6kkQ9rF");

    // Fill a unique random amount
    await page.fill("input[type='number']", transferAmount);

    // Click transfer, wait for popup
    await Promise.all([page.click("button:has-text('Transfer')"), wait(5000)]);
    const total = (await page.locator("div >> text=/~ [0-9.].* SOL/").first().innerText()).split(" ")[1];
    // Click confirm, wait for navigation to activities page
    await page.click("button:has-text('Confirm')");

    await page.click("button >> text=Close");

    // click on the first transaction, which takes to the sol explorer
    await wait(2000);
    await page.reload();
    await switchNetwork(page, "testnet");
    await wait(3000);
    const [page2] = await Promise.all([page.waitForEvent("popup"), page.click(".transaction-activity")]);
    await page2.waitForEvent("load");

    // see that the transaction is success and the amount transferred is same as intended
    expect(await page2.locator(".badge.bg-success-soft").innerText()).toEqual("Success");

    expect((await page2.locator(".badge.bg-warning-soft").innerText()).replace(/[^0-9.]/g, "")).toEqual(Number(total));
    await page2.close();
  });
});

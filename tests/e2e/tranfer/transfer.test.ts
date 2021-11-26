import test, { expect, Page } from "@playwright/test";

import { login } from "../../auth-helper";
import { ensureTextualElementExists, wait } from "../../utils";

test.describe("Transfer page", async () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await login(await browser.newContext());
  });

  test("Checks before transaction should be correct", async () => {
    // see navigation works correctly
    await page.click("text=Transfer");
    await wait(1000);
    await expect(page.url().endsWith("/wallet/transfer")).toBeTruthy();

    // ENSURE UI IS INTACT
    await ensureTextualElementExists(page, "Transfer Details");

    // if address is not a valid sol address, should show error
    await page.fill("input[type='text']", "asdasdasdasdasdasd");
    await page.fill("input[type='number']", "1");
    await page.click("button:has-text('Transfer')");
    await expect((await page.$$("text=Invalid SOL Address")).length).toEqual(1);

    // if address is a valid sol address, should show popup
    await page.fill("input[type='text']", "5YQHtZcg8EQo3rjVL2PmFwFix1x8i3PjDsyuW6kkQ9rF");
    await page.fill("input[type='number']", "1");
    await page.click("button:has-text('Transfer')");
    await wait(1000);
    await expect((await page.$$("text=Total Cost")).length).toEqual(1);
    page.click("button:has-text('Cancel')");
  });
  test("Transaction should happen correctly", async () => {
    const transferAmount = (Math.random() / 1000).toFixed(8);
    // Click settings tab
    await Promise.all([page.click("text=Settings"), wait(1500)]);

    // Switch network to solana testnet
    await page.click("#networkSelect");
    await page.click("ul[role='listbox'] div:has-text('Solana Testnet')");

    // Click transfer tab
    await Promise.all([page.click("text=Transfer"), wait(1500)]);

    // Fill a valid sol address
    await page.fill("[aria-label='text field']", "5YQHtZcg8EQo3rjVL2PmFwFix1x8i3PjDsyuW6kkQ9rF");

    // Fill a unique random amount
    await page.fill("input[type='number']", transferAmount);

    // Click transfer, wait for popup
    await Promise.all([page.click("button:has-text('Transfer')"), wait(1000)]);

    // Click confirm, wait for navigation to activities page
    await Promise.all([page.click("button:has-text('Confirm')"), wait(4000)]);

    // click on the first transaction, which takes to the sol explorer
    const [page2] = await Promise.all([page.waitForEvent("popup"), page.click(".transaction-activity")]);
    await wait(8000);

    // see that the transaction is success and the amount transferred is same as intended
    const successMessages = await Promise.all((await page2.$$(".badge-soft-success")).map((el) => el.innerText()));
    expect(successMessages[0].includes("Success")).toBeTruthy();
    expect(successMessages[1].includes(transferAmount)).toBeTruthy();
  });
});

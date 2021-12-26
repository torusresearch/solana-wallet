// const { test} = require("@playwright/test");
import test, { expect, Page } from "@playwright/test";

import { login, SECRET_KEY } from "../../auth-helper";
import { ensureTextualElementExists, switchNetwork, switchTab, wait } from "../../utils";

test.describe("Settings Page", async () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await login(await browser.newContext());
  });
  test("Settings Page Should render", async () => {
    // // see navigation works correctly
    await switchTab(page, "settings");

    // ENSURE UI IS INTACT
    await ensureTextualElementExists(page, "Settings");
    await ensureTextualElementExists(page, "Privacy and Security");
    await ensureTextualElementExists(page, "Network");
    await ensureTextualElementExists(page, "Display");
    await ensureTextualElementExists(page, "Crash Reporting");
  });
  test("Network Change should work", async () => {
    // // see navigation works correctly
    await switchTab(page, "settings");

    // **************NETWORK CHANGES********
    // NETWORK CHANGES TESTING : MAINNET
    await switchNetwork(page, "mainnet");

    // NETWORK CHANGES TESTING : TESTNET
    await switchNetwork(page, "testnet");

    // NETWORK CHANGES TESTING : DEVNET
    await switchNetwork(page, "devnet");
  });
  test("Theme Change should work", async () => {
    // // see navigation works correctly
    await switchTab(page, "settings");

    // **************DISPLAY CHANGES********
    // CHOOSE LIGHT
    await page.click("text=Light");
    await wait(2000);
    await expect(await page.locator(".dark").elementHandles()).toHaveLength(0);

    // CHOOSE DARK
    await page.click("text=Dark");
    await wait(2000);
    await expect(await page.locator(".dark").elementHandles()).toHaveLength(1);
  });
  test("Private key should be available", async () => {
    // // see navigation works correctly
    await switchTab(page, "settings");

    await page.click("text=Account Details");
    await page.click("#headlessui-portal-root button>svg");
    const data = await page.locator(`div >> text=${SECRET_KEY}`)?.first()?.innerText();
    expect(data).toBeTruthy();
    await page.click("button >> text=Close");
  });
  test("Contact should be added and then deleted", async () => {
    // // see navigation works correctly
    await switchTab(page, "settings");

    await page.fill("input[placeholder='Enter Contact Name']", "TestContact1");
    await page.fill("input[placeholder='Enter SOL Public Key']", "5ToWXBQJPWFYzckSuGQC64J5GBUhFsyxKLygsww36RZe");
    await page.click("text=Add Contact");
    await wait(1000);
    await page.waitForSelector("text=Successfully added contact", { timeout: 5000 });
    expect(page.locator("span >> text=5ToWXBQJPWFYzckSuGQC64J5GBUhFsyxKLygsww36RZe").first()).toBeTruthy();
    await page.click("li>div>svg");
    await wait(2000);
    let contactDeleted = false;
    await page.waitForSelector("text=Successfully deleted contact");
    try {
      await page.waitForSelector("span >> text=5ToWXBQJPWFYzckSuGQC64J5GBUhFsyxKLygsww36RZe", { timeout: 2000 });
    } catch (e) {
      contactDeleted = true;
    }
    expect(contactDeleted).toBeTruthy();
  });
  test("Crash reporting should update", async () => {
    // // see navigation works correctly
    await switchTab(page, "settings");

    await page.click("button[role='switch']");
    await page.waitForSelector("text=Successfully updated crash reporting", { timeout: 5000 });
    await page.click("button[role='switch']");
    await page.waitForSelector("text=Successfully updated crash reporting", { timeout: 5000 });
  });
});

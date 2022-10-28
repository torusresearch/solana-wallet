// const { test} = require("@playwright/test");
import { expect, Page } from "@playwright/test";

import { IMPORT_ACC_ADDRESS, IMPORT_ACC_SECRET_KEY, login, PUB_ADDRESS, SECRET_KEY } from "../../auth-helper";
import { isContactDeleted, selectAddressBookFilter } from "../../settings.utils";
import { changeLanguage, ensureTextualElementExists, importAccount, switchNetwork, switchTab, wait } from "../../utils";
import test, { markResult, setBrowserStackTestTitle } from "../fixtures";

test.describe("Settings Page", async () => {
  let page: Page;
  test.beforeEach(async ({ browser, browserName }) => {
    page = await login(await browser.newContext(), browserName);
  });
  test.afterAll(async () => {
    await page.close();
  });
  test.afterAll(markResult);
  test.beforeEach(setBrowserStackTestTitle);

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
    await wait(1000);

    // **************DISPLAY CHANGES********
    // CHOOSE LIGHT
    await page.click("text=Light");
    await expect(await page.locator(".light").elementHandles()).toHaveLength(0);
    await wait(1000);
    // CHOOSE DARK
    await page.click("text=Dark");
    await wait(1000);
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
    // if contact already exists, delete it
    const elemCount = await page.locator(`span >> text=${IMPORT_ACC_ADDRESS}`).count();
    if (elemCount > 0) {
      await page.click("li>div>svg");
      expect(await isContactDeleted(page, IMPORT_ACC_ADDRESS)).toBeTruthy();
    }
    await page.fill("input[placeholder='Enter Contact Name']", "ImportAcc");
    await page.fill("input[placeholder='Enter SOL Public Key']", IMPORT_ACC_ADDRESS);
    await page.click("text=Add Contact");
    await page.waitForSelector("text=Successfully added contact", { timeout: 10_000 });
    expect(page.locator(`span >> text=${IMPORT_ACC_ADDRESS} PUB_ADDRESS,`).first()).toBeTruthy();
    await page.click("li>div>svg");
    expect(await isContactDeleted(page, IMPORT_ACC_ADDRESS)).toBeTruthy();
  });

  test("Crash reporting should update", async () => {
    // see navigation works correctly
    await switchTab(page, "settings");

    await page.click("button[role='switch']");
    await page.waitForSelector("text=Successfully updated crash reporting", { timeout: 10_000 });
    await page.click("button[role='switch']");
    await page.waitForSelector("text=Successfully updated crash reporting", { timeout: 10_000 });
  });

  test("Search address book should work", async () => {
    // see navigation works correctly
    await switchTab(page, "settings");
    const elemCount = await page.locator(`span >> text=${IMPORT_ACC_ADDRESS}`).count();
    if (elemCount === 0) {
      await page.fill("input[placeholder='Enter Contact Name']", "ImportAcc");
      await page.fill("input[placeholder='Enter SOL Public Key']", IMPORT_ACC_ADDRESS);
      await page.click("text=Add Contact");
      await page.waitForSelector("text=Successfully added contact", { timeout: 10_000 });
    }
    // Searching with added account name
    await page.fill("input[placeholder='Search by name']", "ImportAcc");
    await expect(page.locator(`span >> text=${IMPORT_ACC_ADDRESS}`)).toHaveCount(1);
    // Searching with non-existing account name
    await page.fill("input[placeholder='Search by name']", "non-existing");
    await expect(page.locator(`span >> text=${IMPORT_ACC_ADDRESS}`)).toHaveCount(0);
    // Searching with added account name again
    await page.fill("input[placeholder='Search by name']", "ImportAcc");
    await expect(page.locator(`span >> text=${IMPORT_ACC_ADDRESS}`)).toHaveCount(1);
    await page.fill("input[placeholder='Search by name']", "");
    // Deleting address as cleanup
    await page.click("li>div>svg");
    expect(await isContactDeleted(page, IMPORT_ACC_ADDRESS)).toBeTruthy();
  });

  test("Address book filter should work", async () => {
    // see navigation works correctly
    await switchTab(page, "settings");
    const elemCount = await page.locator(`span >> text=${IMPORT_ACC_ADDRESS}`).count();
    if (elemCount === 0) {
      await page.fill("input[placeholder='Enter Contact Name']", "ImportAcc");
      await page.fill("input[placeholder='Enter SOL Public Key']", IMPORT_ACC_ADDRESS);
      await page.click("text=Add Contact");
      await page.waitForSelector("text=Successfully added contact", { timeout: 10_000 });
    }

    // Solana Address filter by All
    await selectAddressBookFilter(page, "All");
    // ensure All addresses are displayed
    await expect(page.locator(`span >> text=${IMPORT_ACC_ADDRESS}`)).toHaveCount(1);
    // Solana Address filter by Solana address
    await selectAddressBookFilter(page, "Solana address");
    // ensure only Solana address is displayed
    await expect(page.locator(`span >> text=${IMPORT_ACC_ADDRESS}`)).toHaveCount(1);
    // Solana Address filter by SOL Domain
    await selectAddressBookFilter(page, "All");
    await page.click("li>div>svg");
    expect(await isContactDeleted(page, IMPORT_ACC_ADDRESS)).toBeTruthy();
  });

  test("Language change should work", async () => {
    // see navigation works correctly
    await switchTab(page, "settings");
    await changeLanguage(page, "german");
    await wait(500);
    await ensureTextualElementExists(page, "die Einstellungen");
    await changeLanguage(page, "japanese");
    await wait(500);
    await ensureTextualElementExists(page, "設定");
    await changeLanguage(page, "korean");
    await wait(500);
    await ensureTextualElementExists(page, "설정");
    await changeLanguage(page, "mandarin");
    await wait(500);
    await ensureTextualElementExists(page, "设定");
    await changeLanguage(page, "spanish");
    await wait(500);
    await ensureTextualElementExists(page, "Configuraciones");
    await changeLanguage(page, "english");
  });
});

/** ************************IMPORT ACCOUNT TESTS ****************************** */
// Skipped because "Import Account" feature is no more supported
test.skip("Settings Page using imported account", async () => {
  let page: Page;
  test.beforeAll(async ({ browser, browserName }) => {
    page = await login(await browser.newContext(), browserName);
  });
  test.beforeEach(async () => {
    await importAccount(page, IMPORT_ACC_SECRET_KEY);
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
    await wait(1000);
    await expect(await page.locator(".dark").elementHandles()).toHaveLength(0);

    // CHOOSE DARK
    await page.click("text=Dark");
    await wait(1000);
    await expect(await page.locator(".dark").elementHandles()).toHaveLength(1);
  });

  test("Private key should be available", async () => {
    // // see navigation works correctly
    await switchTab(page, "settings");

    await page.click("text=Account Details");
    await page.click("#headlessui-portal-root button>svg");
    const data = await page.locator(`div >> text=${IMPORT_ACC_SECRET_KEY}`)?.first()?.innerText();
    expect(data).toBeTruthy();
    await page.click("button >> text=Close");
  });

  test("Contact should be added and then deleted", async () => {
    // // see navigation works correctly
    await switchTab(page, "settings");
    // if contact already exists, delete it
    const elemCount = await page.locator(`span >> text=${PUB_ADDRESS}`).count();
    if (elemCount > 0) {
      await page.click("li>div>svg");
      expect(await isContactDeleted(page, PUB_ADDRESS)).toBeTruthy();
    }
    await page.fill("input[placeholder='Enter Contact Name']", "MainTestAcc");
    await page.fill("input[placeholder='Enter SOL Public Key']", PUB_ADDRESS);
    await page.click("text=Add Contact");
    await page.waitForSelector("text=Successfully added contact", { timeout: 10_000 });
    expect(page.locator(`span >> text=${PUB_ADDRESS} PUB_ADDRESS,`).first()).toBeTruthy();
    await page.click("li>div>svg");
    expect(await isContactDeleted(page, PUB_ADDRESS)).toBeTruthy();
  });

  test("Crash reporting should update", async () => {
    // see navigation works correctly
    await switchTab(page, "settings");

    await page.click("button[role='switch']");
    await page.waitForSelector("text=Successfully updated crash reporting", { timeout: 10_000 });
    await page.click("button[role='switch']");
    await page.waitForSelector("text=Successfully updated crash reporting", { timeout: 10_000 });
  });

  test("Search address book should work", async () => {
    // see navigation works correctly
    await switchTab(page, "settings");
    const elemCount = await page.locator(`span >> text=${PUB_ADDRESS}`).count();
    if (elemCount === 0) {
      await page.fill("input[placeholder='Enter Contact Name']", "MainTestAcc");
      await page.fill("input[placeholder='Enter SOL Public Key']", PUB_ADDRESS);
      await page.click("text=Add Contact");
      await page.waitForSelector("text=Successfully added contact", { timeout: 10_000 });
    }
    // Searching with added account name
    await page.fill("input[placeholder='Search by name']", "MainTestAcc");
    await expect(page.locator(`span >> text=${PUB_ADDRESS}`)).toHaveCount(1);
    // Searching with non-existing account name
    await page.fill("input[placeholder='Search by name']", "non-existing");
    await expect(page.locator(`span >> text=${PUB_ADDRESS}`)).toHaveCount(0);
    // Searching with added account name again
    await page.fill("input[placeholder='Search by name']", "MainTestAcc");
    await expect(page.locator(`span >> text=${PUB_ADDRESS}`)).toHaveCount(1);
    // Deleting address as cleanup
    await page.click("li>div>svg");
    expect(await isContactDeleted(page, PUB_ADDRESS)).toBeTruthy();
  });

  test("Address book filter should work", async () => {
    // see navigation works correctly
    await switchTab(page, "settings");
    const elemCount = await page.locator(`span >> text=${PUB_ADDRESS}`).count();
    if (elemCount === 0) {
      await page.fill("input[placeholder='Enter Contact Name']", "MainTestAcc");
      await page.fill("input[placeholder='Enter SOL Public Key']", PUB_ADDRESS);
      await page.click("text=Add Contact");
      await page.waitForSelector("text=Successfully added contact", { timeout: 10_000 });
    }

    // Solana Address filter by All
    await selectAddressBookFilter(page, "All");
    // ensure All addresses are displayed
    await expect(page.locator(`span >> text=${PUB_ADDRESS}`)).toHaveCount(1);
    // Solana Address filter by Solana address
    await selectAddressBookFilter(page, "Solana address");
    // ensure only Solana address is displayed
    await expect(page.locator(`span >> text=${PUB_ADDRESS}`)).toHaveCount(1);
    // Solana Address filter by SOL Domain
    await selectAddressBookFilter(page, "SOL Domain");
    // ensure nothing is displayed as there is no Solana Domain added
    await expect(page.locator(`span >> text=${PUB_ADDRESS}`)).toHaveCount(0);
    await selectAddressBookFilter(page, "All");
    await page.click("li>div>svg");
    expect(await isContactDeleted(page, PUB_ADDRESS)).toBeTruthy();
  });
});

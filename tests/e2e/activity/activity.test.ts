// const { test} = require("@playwright/test");
import test, { expect, Page } from "@playwright/test";

import { IMPORT_ACC_SECRET_KEY, login } from "../../auth-helper";
import { changeLanguage, ensureTextualElementExists, getControllerState, importAccount, switchNetwork, switchTab } from "../../utils";

test.describe("Activity Page", async () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await login(await browser.newContext());
  });

  test("Activity Page Should render", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");

    // Ensure controllerModule is set in local/session  storage
    const ControllerModule = await getControllerState(page);

    expect(Object.keys(ControllerModule).length).toBeTruthy();
  });

  test("Activities should work with network=mainnet", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");

    const ControllerModule = await getControllerState(page);
    const no_activities = Object.keys(
      ControllerModule.torusState.PreferencesControllerState.identities[ControllerModule.torusState.PreferencesControllerState.selectedAddress]
        .displayActivities
    ).length;
    if (no_activities > 0) {
      // wait for transaction activity to load
      await page.waitForSelector(".transaction-activity");
    }
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_activities);
  });

  test("Activities should work with network=testnet", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");
    await switchNetwork(page, "testnet");

    const ControllerModule = await getControllerState(page);
    const no_activities = Object.keys(
      ControllerModule.torusState.PreferencesControllerState.identities[ControllerModule.torusState.PreferencesControllerState.selectedAddress]
        .displayActivities
    ).length;

    if (no_activities > 0) {
      // wait for transaction activity to load
      await page.waitForSelector(".transaction-activity", { timeout: 5_000 });
    }

    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_activities);
  });

  test("Activities should work with network=devnet", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");
    await switchNetwork(page, "devnet");

    const ControllerModule = await getControllerState(page);
    const no_activities = Object.keys(
      ControllerModule.torusState.PreferencesControllerState.identities[ControllerModule.torusState.PreferencesControllerState.selectedAddress]
        .displayActivities
    ).length;

    if (no_activities > 0) {
      // wait for transaction activity to load
      await page.waitForSelector(".transaction-activity", { timeout: 5_000 });
    }

    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_activities);
  });

  test("Clicking Activity opens solana explorer", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");
    await switchNetwork(page, "testnet");

    const transaction = page.locator(".transaction-activity").first();
    const [page2] = await Promise.all([page.waitForEvent("popup"), transaction?.click()]);
    // checks on sol explorer if transaction is valid
    await page2.waitForEvent("load", { timeout: 10_000 });
    // const result = await page2.locator("td >> text=Result").elementHandle();
    // expect(result).toBeTruthy();
    page2.close();
  });

  test("Changing Transaction Time filter works", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");

    const ControllerModule = await getControllerState(page);

    const activities =
      ControllerModule.torusState.PreferencesControllerState.identities[ControllerModule.torusState.PreferencesControllerState.selectedAddress]
        .displayActivities;
    const activities_array = Object.entries(activities).map((keyValPair) => keyValPair[1]) as { rawDate: string }[];
    const no_1week_activities = activities_array.filter((activity) => {
      const minDate = new Date();
      minDate.setDate(minDate.getDate() - 7);
      const txDate = new Date(activity.rawDate);
      if (txDate >= minDate) return true;
      return false;
    }).length;

    const no_1month_activities = activities_array.filter((activity) => {
      const minDate = new Date();
      minDate.setMonth(minDate.getMonth() - 1);
      const txDate = new Date(activity.rawDate);
      if (txDate >= minDate) return true;
      return false;
    }).length;

    const no_6month_activities = activities_array.filter((activity) => {
      const minDate = new Date();
      minDate.setMonth(minDate.getMonth() - 6);
      const txDate = new Date(activity.rawDate);
      if (txDate >= minDate) return true;
      return false;
    }).length;

    const timeBTN = page.locator("header button[id^='headlessui-listbox-button'][aria-haspopup='true']").last();

    // send activities filter
    await timeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=Last 1 week").click();
    if (no_1week_activities > 0) {
      await page.waitForSelector(".transaction-activity", { timeout: 5_000 });
    }
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_1week_activities);

    // receive activities filter
    await timeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=Last 1 month").click();
    if (no_1month_activities > 0) {
      await page.waitForSelector(".transaction-activity", { timeout: 5_000 });
    }
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_1month_activities);

    // topup activities filter
    await timeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=Last 6 months").click();
    if (no_6month_activities > 0) {
      await page.waitForSelector(".transaction-activity", { timeout: 5_000 });
    }
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_6month_activities);

    await timeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=All").click();
  });

  test("Changing Transaction Type Filter works", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");

    const ControllerModule = await getControllerState(page);

    const activities =
      ControllerModule.torusState.PreferencesControllerState.identities[ControllerModule.torusState.PreferencesControllerState.selectedAddress]
        .displayActivities;
    const activities_array = Object.entries(activities).map((keyValPair) => keyValPair[1]) as { action: string }[];
    const no_send_activities = activities_array.filter((activity) => activity.action === "walletActivity.send").length;
    const no_receive_activities = activities_array.filter((activity) => activity.action === "walletActivity.receive").length;
    const no_topup_activities = activities_array.filter((activity) => activity.action === "walletActivity.topup").length;

    const typeBTN = page.locator("header button[id^='headlessui-listbox-button'][aria-haspopup='true']").first();

    // send activities filter
    await typeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=Send").click();
    if (no_send_activities > 0) {
      await page.waitForSelector(".transaction-activity", { timeout: 5_000 });
    }
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_send_activities);

    // receive activities filter
    await typeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=Receive").click();
    if (no_receive_activities > 0) {
      await page.waitForSelector(".transaction-activity", { timeout: 5_000 });
    }
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_receive_activities);

    // topup activities filter
    await typeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=Topup").click();
    if (no_topup_activities > 0) {
      await page.waitForSelector(".transaction-activity", { timeout: 5_000 });
    }
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_topup_activities);

    await typeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=All Transactions").click();
  });

  test("Transaction activities are parsed correctly", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");
    await page.waitForSelector(".transaction-activity", { timeout: 10_000 });
    expect(await page.locator("div >> text=Unknown").elementHandles()).toHaveLength(0);
  });

  test("Language Change Works Correctly", async () => {
    await switchTab(page, "activity");
    await changeLanguage(page, "german");
    await ensureTextualElementExists(page, "Transaktionsaktivitäten");
    await changeLanguage(page, "japanese");
    await ensureTextualElementExists(page, "トランザクション履歴");
    await changeLanguage(page, "korean");
    await ensureTextualElementExists(page, "거래 활동");
    await changeLanguage(page, "mandarin");
    await ensureTextualElementExists(page, "交易活动");
    await changeLanguage(page, "spanish");
    await ensureTextualElementExists(page, "Actividades de transacción");
    await changeLanguage(page, "english");
  });
});

/** *******************************IMPORTED ACC TESTS***************************************** */

test.describe("Activity Page with Imported Account", async () => {
  let page: Page;
  test.beforeAll(async ({ browser }) => {
    page = await login(await browser.newContext());
  });
  test.beforeEach(async () => {
    await importAccount(page, IMPORT_ACC_SECRET_KEY);
  });

  test("Activity Page Should render", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");

    // Ensure controllerModule is set in local/session  storage
    const ControllerModule = await getControllerState(page);

    expect(Object.keys(ControllerModule).length).toBeTruthy();
  });

  test("Activities should work with network=mainnet", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");

    const ControllerModule = await getControllerState(page);
    const no_activities = Object.keys(
      ControllerModule.torusState.PreferencesControllerState.identities[ControllerModule.torusState.PreferencesControllerState.selectedAddress]
        .displayActivities
    ).length;
    if (no_activities > 0) {
      // wait for transaction activity to load
      await page.waitForSelector(".transaction-activity", { timeout: 5_000 });
    }
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_activities);
  });

  test("Activities should work with network=testnet", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");
    await switchNetwork(page, "testnet");

    const ControllerModule = await getControllerState(page);
    const no_activities = Object.keys(
      ControllerModule.torusState.PreferencesControllerState.identities[ControllerModule.torusState.PreferencesControllerState.selectedAddress]
        .displayActivities
    ).length;
    if (no_activities > 0) {
      // wait for transaction activity to load
      await page.waitForSelector(".transaction-activity", { timeout: 5_000 });
    }
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_activities);
  });

  test("Activities should work with network=devnet", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");
    await switchNetwork(page, "devnet");

    const ControllerModule = await getControllerState(page);
    const no_activities = Object.keys(
      ControllerModule.torusState.PreferencesControllerState.identities[ControllerModule.torusState.PreferencesControllerState.selectedAddress]
        .displayActivities
    ).length;
    if (no_activities > 0) {
      // wait for transaction activity to load
      await page.waitForSelector(".transaction-activity", { timeout: 5_000 });
    }
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_activities);
  });

  test("Clicking Activity opens sol explorer", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");
    await switchNetwork(page, "testnet");

    const transaction = page.locator(".transaction-activity").first();
    const [page2] = await Promise.all([page.waitForEvent("popup"), transaction?.click()]);
    // checks on sol explorer if transaction is valid
    await page2.waitForEvent("load", { timeout: 10_000 });
    // const result = await page2.locator("td >> text=Result").elementHandle();
    // expect(result).toBeTruthy();
    page2.close();
  });

  test("Changing Transaction Time Filter works", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");

    const ControllerModule = await getControllerState(page);

    const activities =
      ControllerModule.torusState.PreferencesControllerState.identities[ControllerModule.torusState.PreferencesControllerState.selectedAddress]
        .displayActivities;
    const activities_array = Object.entries(activities).map((keyValPair) => keyValPair[1]) as { rawDate: string }[];
    const no_1week_activities = activities_array.filter((activity) => {
      const minDate = new Date();
      minDate.setDate(minDate.getDate() - 7);
      const txDate = new Date(activity.rawDate);
      if (txDate >= minDate) return true;
      return false;
    }).length;

    const no_1month_activities = activities_array.filter((activity) => {
      const minDate = new Date();
      minDate.setMonth(minDate.getMonth() - 1);
      const txDate = new Date(activity.rawDate);
      if (txDate >= minDate) return true;
      return false;
    }).length;

    const no_6month_activities = activities_array.filter((activity) => {
      const minDate = new Date();
      minDate.setMonth(minDate.getMonth() - 6);
      const txDate = new Date(activity.rawDate);
      if (txDate >= minDate) return true;
      return false;
    }).length;

    const timeBTN = page.locator("header button[id^='headlessui-listbox-button'][aria-haspopup='true']").last();

    // send activities filter
    await timeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=Last 1 week").click();
    if (no_1week_activities > 0) {
      // wait for transaction activity to load
      await page.waitForSelector(".transaction-activity", { timeout: 5_000 });
    }
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_1week_activities);

    // receive activities filter
    await timeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=Last 1 month").click();
    if (no_1month_activities > 0) {
      // wait for transaction activity to load
      await page.waitForSelector(".transaction-activity", { timeout: 5_000 });
    }
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_1month_activities);

    // topup activities filter
    await timeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=Last 6 months").click();
    if (no_6month_activities > 0) {
      // wait for transaction activity to load
      await page.waitForSelector(".transaction-activity", { timeout: 5_000 });
    }
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_6month_activities);

    await timeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=All").click();
  });

  test("Changing Transaction Type Filter works", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");

    const ControllerModule = await getControllerState(page);

    const activities =
      ControllerModule.torusState.PreferencesControllerState.identities[ControllerModule.torusState.PreferencesControllerState.selectedAddress]
        .displayActivities;
    const activities_array = Object.entries(activities).map((keyValPair) => keyValPair[1]) as { action: string }[];
    const no_send_activities = activities_array.filter((activity) => activity.action === "walletActivity.send").length;
    const no_receive_activities = activities_array.filter((activity) => activity.action === "walletActivity.receive").length;
    const no_topup_activities = activities_array.filter((activity) => activity.action === "walletActivity.topup").length;

    const typeBTN = page.locator("header button[id^='headlessui-listbox-button'][aria-haspopup='true']").first();

    // send activities filter
    await typeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=Send").click();
    if (no_send_activities > 0) {
      // wait for transaction activity to load
      await page.waitForSelector(".transaction-activity", { timeout: 5_000 });
    }
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_send_activities);

    // receive activities filter
    await typeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=Receive").click();
    if (no_receive_activities > 0) {
      // wait for transaction activity to load
      await page.waitForSelector(".transaction-activity", { timeout: 5_000 });
    }
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_receive_activities);

    // topup activities filter
    await typeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=Topup").click();
    if (no_topup_activities > 0) {
      // wait for transaction activity to load
      await page.waitForSelector(".transaction-activity", { timeout: 5_000 });
    }
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_topup_activities);

    await typeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=All Transactions").click();
  });

  test("Transaction activities are parsed correctly", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");
    await page.waitForSelector(".transaction-activity", { timeout: 10_000 });
    expect(await page.locator("div >> text=Unknown").elementHandles()).toHaveLength(0);
  });
});

// const { test} = require("@playwright/test");
import test, { expect, Page } from "@playwright/test";

import { IMPORT_ACC_SECRET_KEY, login } from "../../auth-helper";
import { changeLanguage, ensureTextualElementExists, getControllerState, importAccount, switchNetwork, switchTab, wait } from "../../utils";

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

    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_activities);
  });

  test("Clicking Activity opens solana explorer", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");
    await switchNetwork(page, "testnet");

    const transaction = page.locator(".transaction-activity").first();
    const [page2] = await Promise.all([page.waitForEvent("popup"), transaction?.click()]);
    // checks on sol explorer if transaction is valid
    await page2.waitForEvent("load");
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
    await wait(1000);
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_1week_activities);

    // receive activities filter
    await timeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=Last 1 month").click();
    await wait(1000);
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_1month_activities);

    // topup activities filter
    await timeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=Last 6 months").click();
    await wait(1000);
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_6month_activities);

    await timeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=All").click();
    await wait(1000);
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
    await wait(1000);
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_send_activities);

    // receive activities filter
    await typeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=Receive").click();
    await wait(1000);
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_receive_activities);

    // topup activities filter
    await typeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=Topup").click();
    await wait(1000);
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_topup_activities);

    await typeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=All Transactions").click();
    await wait(1000);
  });

  test("Transaction activities are parsed correctly", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");
    expect(await page.locator("div >> text=Unknown").elementHandles()).toHaveLength(0);
  });

  test("Language Change Works Correctly", async () => {
    await switchTab(page, "activity");
    await changeLanguage(page, "german");
    await wait(500);
    await ensureTextualElementExists(page, "Transaktionsaktivitäten");
    await wait(500);
    await changeLanguage(page, "japanese");
    await ensureTextualElementExists(page, "トランザクション履歴");
    await wait(500);
    await changeLanguage(page, "korean");
    await wait(500);
    await ensureTextualElementExists(page, "거래 활동");
    await changeLanguage(page, "mandarin");
    await wait(500);
    await ensureTextualElementExists(page, "交易活动");
    await changeLanguage(page, "spanish");
    await wait(500);
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

    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_activities);
  });

  test("Clicking Activity opens sol explorer", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");
    await switchNetwork(page, "testnet");

    const transaction = page.locator(".transaction-activity").first();
    const [page2] = await Promise.all([page.waitForEvent("popup"), transaction?.click()]);
    // checks on sol explorer if transaction is valid
    await page2.waitForEvent("load");
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
    await wait(1000);
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_1week_activities);

    // receive activities filter
    await timeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=Last 1 month").click();
    await wait(1000);
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_1month_activities);

    // topup activities filter
    await timeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=Last 6 months").click();
    await wait(1000);
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_6month_activities);

    await timeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=All").click();
    await wait(1000);
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
    await wait(1000);
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_send_activities);

    // receive activities filter
    await typeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=Receive").click();
    await wait(1000);
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_receive_activities);

    // topup activities filter
    await typeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=Topup").click();
    await wait(1000);
    expect(await page.locator(".transaction-activity").elementHandles()).toHaveLength(no_topup_activities);

    await typeBTN.click();
    await page.locator("header ul[role='listbox'] div >> text=All Transactions").click();
    await wait(1000);
  });

  test("Transaction activities are parsed correctly", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");
    expect(await page.locator("div >> text=Unknown").elementHandles()).toHaveLength(0);
  });
});

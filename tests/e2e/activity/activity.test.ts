// const { test} = require("@playwright/test");
import { expect, Page } from "@playwright/test";

import {
  ensureActivityClickTakesToExplorer,
  getActivities,
  getDateOfActivities,
  selectTimeFilter,
  selectTransactionTypeFilter,
} from "../../activity.utils";
import { IMPORT_ACC_SECRET_KEY, login } from "../../auth-helper";
import {
  changeLanguage,
  ensureTextualElementExists,
  getLastWeeksDate,
  getOlderDate,
  importAccount,
  switchNetwork,
  switchTab,
  wait,
} from "../../utils";
import test, { markResult, setBrowserStackTestTitle } from "../fixtures";

test.describe("Activity Page", async () => {
  let page: Page;
  test.beforeAll(async ({ browser, browserName }) => {
    page = await login(await browser.newContext(), browserName);
  });
  test.afterAll(markResult);
  test.beforeEach(setBrowserStackTestTitle);

  test("Activity Page Should render", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");

    // ENSURE Activity page is opened
    await ensureTextualElementExists(page, "Transaction Activities");
  });

  test("Activities should work with network=mainnet", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");
    await wait(1000);
    // getting list of activities on activity page
    const activities = await getActivities(page);

    // if activities are available, clicking on them should take to solana explorer
    if ((await activities.count()) > 0) {
      // Ensure clicking on an activity takes to solana explorer page
      await ensureActivityClickTakesToExplorer(page, activities.first());
    }
  });

  test("Activities should work with network=testnet", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");
    await switchNetwork(page, "testnet");
    await wait(1000);
    // getting list of activities on activity page
    const activities = await getActivities(page);

    // if activities are available, clicking on them should take to solana explorer
    if ((await activities.count()) > 0) {
      // Ensure clicking on an activity takes to solana explorer page
      await ensureActivityClickTakesToExplorer(page, activities.first());
    }
  });

  test("Activities should work with network=devnet", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");
    await switchNetwork(page, "devnet");
    await wait(1000);
    // getting list of activities on activity page
    const activities = await getActivities(page);

    // if activities are available, clicking on them should take to solana explorer
    if ((await activities.count()) > 0) {
      // Ensure clicking on an activity takes to solana explorer page
      await ensureActivityClickTakesToExplorer(page, activities.first());
    }
  });

  test("Changing Transaction Time filter works", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");
    // Last 1 week filter
    await selectTimeFilter(page, "Last 1 week");
    await wait(1000);
    // getting list of dates on activity page
    let activityDates = await getDateOfActivities(page);
    let elements = await activityDates.elementHandles();
    await Promise.all(
      elements.map(async function ensureActivityFilteredCorrectly(element) {
        const elementDateText = await element.innerText();
        const date = elementDateText.split("\n")[0].replace(/(\d+)(st|nd|rd|th)/g, "$1");
        const elementDate = new Date(date);
        const lastOneWeekDate = await getLastWeeksDate();
        expect(elementDate > lastOneWeekDate).toBeTruthy();
      })
    );

    // Last 1 month filter
    await selectTimeFilter(page, "Last 1 month");
    await wait(1000);
    // getting list of dates on activity page
    activityDates = await getDateOfActivities(page);
    elements = await activityDates.elementHandles();
    await Promise.all(
      elements.map(async function ensureActivityFilteredCorrectly(element) {
        const elementDateText = await element.innerText();
        const date = elementDateText.split("\n")[0].replace(/(\d+)(st|nd|rd|th)/g, "$1");
        const elementDate = new Date(date);
        const lastOneMonthDate = await getOlderDate(1);
        expect(elementDate > lastOneMonthDate).toBeTruthy();
      })
    );

    // Last 6 months filter
    await selectTimeFilter(page, "Last 6 months");
    await wait(1000);
    // getting list of dates on activity page
    activityDates = await getDateOfActivities(page);
    elements = await activityDates.elementHandles();
    await Promise.all(
      elements.map(async function ensureActivityFilteredCorrectly(element) {
        const elementDateText = await element.innerText();
        const date = elementDateText.split("\n")[0].replace(/(\d+)(st|nd|rd|th)/g, "$1");
        const elementDate = new Date(date);
        const lastOneMonthDate = await getOlderDate(6);
        expect(elementDate > lastOneMonthDate).toBeTruthy();
      })
    );
    await selectTimeFilter(page, "All");
  });

  test("Changing Transaction Type Filter works", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");

    // Send filter
    await selectTransactionTypeFilter(page, "Send");
    await wait(1000);
    // getting list on activities
    let activitiesList = await getActivities(page);
    let elements = await activitiesList.elementHandles();
    // ensure that only sent activities are displayed
    await Promise.all(
      elements.map(async function ensureActivityFilteredCorrectly(element) {
        const elementText = await element.textContent();
        expect(elementText).toContain("Sent");
      })
    );

    // Receive filter
    await selectTransactionTypeFilter(page, "Receive");
    await wait(1000);
    // getting list on activities
    activitiesList = await getActivities(page);
    elements = await activitiesList.elementHandles();
    // ensure only received activities are displayed
    await Promise.all(
      elements.map(async function ensureActivityFilteredCorrectly(element) {
        const elementText = await element.textContent();
        expect(elementText).toContain("Received");
      })
    );

    // Topup filter
    await selectTransactionTypeFilter(page, "Topup");
    await wait(1000);
    // getting list on activities
    activitiesList = await getActivities(page);
    elements = await activitiesList.elementHandles();
    // ensure only received activities are displayed
    await Promise.all(
      elements.map(async function ensureActivityFilteredCorrectly(element) {
        const elementText = await element.textContent();
        expect(elementText).toContain("Topup");
      })
    );
    await selectTransactionTypeFilter(page, "All Transactions");
  });

  // Re Add when parser works for 100% of txs.
  // test("Transaction activities are parsed correctly", async () => {
  //   // see navigation works correctly
  //   await switchTab(page, "activity");
  //   // getting list of activities on activity page
  //   await wait(1000);
  //   const activities = await getActivities(page);

  //   if ((await activities.count()) > 0) {
  //     // Ensure that there are no unknown activities
  //     expect(await page.locator("div >> text=Unknown").elementHandles()).toHaveLength(0);
  //   }
  // });

  test("Language Change Works Correctly", async () => {
    await switchTab(page, "activity");
    await changeLanguage(page, "german");
    await wait(500);
    await ensureTextualElementExists(page, "Transaktionsaktivitäten");
    await changeLanguage(page, "japanese");
    await wait(500);
    await ensureTextualElementExists(page, "トランザクション履歴");
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

test.skip("Activity Page with Imported Account", async () => {
  let page: Page;
  test.beforeAll(async ({ browser, browserName }) => {
    page = await login(await browser.newContext(), browserName);
  });
  test.beforeEach(async () => {
    await importAccount(page, IMPORT_ACC_SECRET_KEY);
  });

  test("Activity Page Should render", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");

    // ENSURE Activity page is opened
    await ensureTextualElementExists(page, "Transaction Activities");
  });

  test("Activities should work with network=mainnet", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");
    await wait(1000);
    // getting list of activities on activity page
    const activities = await getActivities(page);

    // if activities are available, clicking on them should take to solana explorer
    if ((await activities.count()) > 0) {
      // Ensure clicking on an activity takes to solana explorer page
      await ensureActivityClickTakesToExplorer(page, activities.first());
    }
  });

  test("Activities should work with network=testnet", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");
    await switchNetwork(page, "testnet");
    await wait(1000);
    // getting list of activities on activity page
    const activities = await getActivities(page);

    // if activities are available, clicking on them should take to solana explorer
    if ((await activities.count()) > 0) {
      // Ensure clicking on an activity takes to solana explorer page
      await ensureActivityClickTakesToExplorer(page, activities.first());
    }
  });

  test("Activities should work with network=devnet", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");
    await switchNetwork(page, "devnet");
    await wait(1000);
    // getting list of activities on activity page
    const activities = await getActivities(page);

    // if activities are available, clicking on them should take to solana explorer
    if ((await activities.count()) > 0) {
      // Ensure clicking on an activity takes to solana explorer page
      await ensureActivityClickTakesToExplorer(page, activities.first());
    }
  });

  test("Changing Transaction Time filter works", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");
    // Last 1 week filter
    await selectTimeFilter(page, "Last 1 week");
    await wait(1000);
    // getting list of dates on activity page
    let activityDates = await getDateOfActivities(page);
    let elements = await activityDates.elementHandles();
    await Promise.all(
      elements.map(async function ensureActivityFilteredCorrectly(element) {
        const elementDateText = await element.innerText();
        const date = elementDateText.split("\n")[0].replace(/(\d+)(st|nd|rd|th)/g, "$1");
        const elementDate = new Date(date);
        const lastOneWeekDate = await getLastWeeksDate();
        expect(elementDate > lastOneWeekDate).toBeTruthy();
      })
    );

    // Last 1 month filter
    await selectTimeFilter(page, "Last 1 month");
    await wait(1000);
    // getting list of dates on activity page
    activityDates = await getDateOfActivities(page);
    elements = await activityDates.elementHandles();
    await Promise.all(
      elements.map(async function ensureActivityFilteredCorrectly(element) {
        const elementDateText = await element.innerText();
        const date = elementDateText.split("\n")[0].replace(/(\d+)(st|nd|rd|th)/g, "$1");
        const elementDate = new Date(date);
        const lastOneMonthDate = await getOlderDate(1);
        expect(elementDate > lastOneMonthDate).toBeTruthy();
      })
    );

    // Last 6 months filter
    await selectTimeFilter(page, "Last 6 months");
    await wait(1000);
    // getting list of dates on activity page
    activityDates = await getDateOfActivities(page);
    elements = await activityDates.elementHandles();
    await Promise.all(
      elements.map(async function ensureActivityFilteredCorrectly(element) {
        const elementDateText = await element.innerText();
        const date = elementDateText.split("\n")[0].replace(/(\d+)(st|nd|rd|th)/g, "$1");
        const elementDate = new Date(date);
        const lastOneMonthDate = await getOlderDate(6);
        expect(elementDate > lastOneMonthDate).toBeTruthy();
      })
    );
    await selectTimeFilter(page, "All");
  });

  test("Changing Transaction Type Filter works", async () => {
    // see navigation works correctly
    await switchTab(page, "activity");

    // Send filter
    await selectTransactionTypeFilter(page, "Send");
    await wait(1000);
    // getting list on activities
    let activitiesList = await getActivities(page);
    let elements = await activitiesList.elementHandles();
    // ensure that only sent activities are displayed
    await Promise.all(
      elements.map(async function ensureActivityFilteredCorrectly(element) {
        const elementText = await element.textContent();
        expect(elementText).toContain("Sent");
      })
    );

    // Receive filter
    await selectTransactionTypeFilter(page, "Receive");
    await wait(1000);
    // getting list on activities
    activitiesList = await getActivities(page);
    elements = await activitiesList.elementHandles();
    // ensure only received activities are displayed
    await Promise.all(
      elements.map(async function ensureActivityFilteredCorrectly(element) {
        const elementText = await element.textContent();
        expect(elementText).toContain("Received");
      })
    );

    // Topup filter
    await selectTransactionTypeFilter(page, "Topup");
    await wait(1000);
    // getting list on activities
    activitiesList = await getActivities(page);
    elements = await activitiesList.elementHandles();
    // ensure only received activities are displayed
    await Promise.all(
      elements.map(async function ensureActivityFilteredCorrectly(element) {
        const elementText = await element.textContent();
        expect(elementText).toContain("Topup");
      })
    );
    await selectTransactionTypeFilter(page, "All Transactions");
  });
  // Re Add when parser works for 100% of txs.
  // test("Transaction activities are parsed correctly", async () => {
  //   // see navigation works correctly
  //   await switchTab(page, "activity");
  //   // getting list of activities on activity page
  //   await wait(1000);
  //   const activities = await getActivities(page);

  //   if ((await activities.count()) > 0) {
  //     // Ensure that there are no unknown activities
  //     expect(await page.locator("div >> text=Unknown").elementHandles()).toHaveLength(0);
  //   }
  // });
});

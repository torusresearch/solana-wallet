import { Page, PlaywrightTestArgs, PlaywrightWorkerArgs, test as base, TestInfo } from "@playwright/test";
import bs from "browserstack-local";
import cp from "child_process";

import * as pkg from "../../package.json";

interface BrowserStackCapabillies {
  "browserstack.playwrightVersion": string;
  "browserstack.username": string;
  "browserstack.accessKey": string;
  "client.playwrightVersion": string;
  os: string;
  os_version?: string;
  browser: string;
  browser_version?: string;
  name?: string;
  build?: string;
  project?: string;
}

const clientPlaywrightVersion = cp.execSync("npx playwright --version").toString().trim().split(" ")[1];

const DEFAULT_CAPS = {
  "browserstack.playwrightVersion": "1.latest",
  "browserstack.username": process.env.BROWSERSTACK_USERNAME || "",
  "browserstack.accessKey": process.env.BROWSERSTACK_ACCESS_KEY || "",
  "browserstack.networkLogs": true,
  "browserstack.console": "errors",
  "browserstack.local": true, // Test using localhost
  "client.playwrightVersion": clientPlaywrightVersion,
  name: "Solana wallet tests",
  project: pkg.app.name,
  browser: "chrome",
  os: "osx",
  os_version: "catalina",
  build: "solana-wallet-build-1",
};

function generateCapabilities(projectName: string, testTitle?: string) {
  const combination = projectName.split(/@browserstack/)[0];
  const [browerCaps, osCaps] = combination.split(/:/);
  const [browser, browser_version] = browerCaps.split(/@/);
  const osCapsSplit = osCaps.split(/ /);
  const os = osCapsSplit.shift();
  const os_version = osCapsSplit.join(" ");

  // const [browser_caps, os_caps] = projectName.split(":");
  // const [browser, browser_version] = browser_caps.split("@");
  // const [os, os_version] = os_caps.split("@");

  const caps: BrowserStackCapabillies = {
    ...DEFAULT_CAPS,
    build: `Solana wallet: ${pkg.version}`,
    os: os || "osx",
    os_version: os_version || "catalina",
    browser_version: browser_version || "latest",
    browser: browser || "chrome",
  };

  if (testTitle) caps.name = testTitle;

  if (!browser.includes("webkit")) {
    caps.browser_version = browser_version ?? "latest";
  }

  return caps;
}

async function getRemoteBrowser(playwright: PlaywrightWorkerArgs["playwright"], projectName: string, testTitle?: string) {
  // Generate params required for browserstack
  const caps = generateCapabilities(projectName, testTitle);

  // Connect to BrowserStack session
  const wsEndpoint = `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify(caps))}`;
  return playwright.chromium.connect(wsEndpoint);
}

async function setBrowserstackResult(page: Page, testInfo: TestInfo) {
  const testResult = {
    action: "setSessionStatus",
    arguments: {
      status: testInfo.status === testInfo.expectedStatus ? "passed" : "failed",
      reason: "",
    },
  };

  // Print the error to console
  if (testInfo.error) {
    // eslint-disable-next-line no-console
    console.log(testInfo.error.stack);
    testResult.arguments.reason = `${process.env.CURRENT_TEST_TITLE ?? "beforeAll"} failed`;
  }

  // Execute BrowserStack's result executor

  const result = await page.evaluate(() => {}, `browserstack_executor: ${JSON.stringify(testResult)}`);
  return result;
}

// Extend the "page" and "browser" fixtures
const test = base.extend({
  page: async ({ page, playwright }, use, testInfo) => {
    if (!testInfo.project.name.match(/browserstack/)) {
      // Use original page object if not meant for browserstack
      use(page);
    } else {
      const browser = await getRemoteBrowser(playwright, testInfo.project.name);
      const remotePage = await browser.newPage(testInfo.project.use);

      // Use the page
      // await use(remotePage);
      use(remotePage)
        .then(() => {
          return true;
        })
        .finally(async () => {
          // Set result in browserstack
          await setBrowserstackResult(remotePage, testInfo);
          await remotePage.close();
          await browser.close();
        })
        .catch((error) => {
          return error;
        });
    }
  },
  browser: async ({ browser, playwright }, use, testInfo) => {
    if (!testInfo.project.name.match(/browserstack/)) {
      use(browser);
    } else {
      const remoteBrowser = await getRemoteBrowser(playwright, testInfo.project.name);
      use(remoteBrowser);
    }
  },
});

export async function markResult({ browser }: PlaywrightTestArgs & PlaywrightWorkerArgs, testInfo: TestInfo) {
  if (testInfo.project.name.match(/browserstack/)) {
    const page = await browser.newPage();
    await setBrowserstackResult(page, testInfo);
  }
}

// eslint-disable-next-line no-empty-pattern
export function setBrowserStackTestTitle({}: PlaywrightTestArgs, testInfo: TestInfo) {
  const titlePath = [...testInfo.titlePath];
  titlePath.shift();
  process.env.CURRENT_TEST_TITLE = titlePath.join(" > ");
}

export const browserstack = new bs.Local();
export default test;

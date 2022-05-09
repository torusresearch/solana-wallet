import { PlaywrightWorkerArgs, test as base } from "@playwright/test";
import bs from "browserstack-local";

interface BrowserStackCapabillies {
  "browserstack.playwrightVersion": string;
  "browserstack.username": string;
  "browserstack.accessKey": string;
  "client.playwrightVersion": string;
  os: string;
  os_version?: string;
  browser: string;
  browser_version?: string;
}

const DEFAULT_CAPS = {
  "browserstack.playwrightVersion": "1.latest",
  "browserstack.username": process.env.BROWSERSTACK_USERNAME || "",
  "browserstack.accessKey": process.env.BROWSERSTACK_ACCESS_KEY || "",
  "browserstack.networkLogs": true,
  "browserstack.console": "errors",
  "browserstack.local": true, // Test using localhost
  "client.playwrightVersion": "1.21.1",
};

function generateCapabilities(name: string) {
  const [browser_caps, os_caps] = name.split(":");
  const [browser, browser_version] = browser_caps.split("@");
  const [os, os_version] = os_caps.split("@");

  const caps: BrowserStackCapabillies = {
    ...DEFAULT_CAPS,
    os,
    os_version,
    browser,
  };

  if (!browser.includes("webkit")) {
    caps.browser_version = browser_version ?? "latest";
  }

  return caps;
}

async function getRemoteBrowser(playwright: PlaywrightWorkerArgs["playwright"], projectName: string) {
  // Generate params required for browserstack
  const caps = generateCapabilities(projectName);

  // Connect to BrowserStack session
  const wsEndpoint = `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify(caps))}`;

  // const browser = await playwright.chromium.connect(wsEndpoint);
  const browser = await playwright.chromium.connect(wsEndpoint);

  // console.log("Connected to BrowserStack session");
  return browser;
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
      await use(remotePage);

      // Set result in browserstack
      const testResult = {
        action: "setSessionStatus",
        arguments: {
          status: testInfo.status,
          reason: testInfo?.error?.message,
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      await remotePage.evaluate(() => {}, `browserstack_executor: ${JSON.stringify(testResult)}`);

      // Close the session
      await remotePage.close();
      await browser.close();
    }
  },
  browser: async ({ browser, playwright }, use, testInfo) => {
    if (!testInfo.project.name.match(/browserstack/)) {
      use(browser);
    } else {
      const remoteBrowser = await getRemoteBrowser(playwright, testInfo.project.name);
      await use(remoteBrowser);
      await remoteBrowser.close();
    }
  },
});

export const browserstack = new bs.Local();
export default test;

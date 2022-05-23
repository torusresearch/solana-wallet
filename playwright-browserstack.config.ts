// eslint-disable-next-line import/no-extraneous-dependencies
import { devices, PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  timeout: 80_000,
  testDir: "tests/e2e",
  globalSetup: "tests/e2e/browserstack-setup.ts",
  globalTeardown: "tests/e2e/browserstack-teardown.ts",
  use: {
    viewport: null,
  },
  // name format: browser[@version]:os@version:browserstack
  projects: [
    // {
    //   name: "chrome@latest:Windows@10:browserstack",
    //   use: {
    //     browserName: "chromium",
    //     ...devices["Desktop Chrome"],
    //   },
    // },
    {
      name: "chrome@latest-beta:OSX Big Sur@browserstack",
      use: {
        browserName: "chromium",
        channel: "chrome",
      },
    },
    {
      name: "playwright-webkit@latest:OSX Big Sur@browserstack",
      use: {
        browserName: "webkit",
        ...devices["Desktop Safari"],
        // channel: "chrome",
      },
    },
    // {
    //   name: "playwright-webkit@latest:OSX Big Sur@browserstack",
    //   use: {
    //     browserName: "webkit",
    //     ...devices["iPhone 12 Pro Max"],
    //   },
    // },
  ],
};
export default config;

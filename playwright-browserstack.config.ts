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
    {
      name: "edge@latest:Windows@10:browserstack",
      use: {
        browserName: "chromium",
        ...devices["Desktop Chrome"],
      },
    },
  ],
};
export default config;

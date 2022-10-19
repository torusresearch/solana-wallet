// eslint-disable-next-line import/no-extraneous-dependencies
import { devices, PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  timeout: 30_000,
  testDir: "tests/e2e",
  projects: [
    {
      name: "Chrome Stable",
      use: {
        browserName: "chromium",
        channel: "chrome",
        // video: "retain-on-failure",
        // screenshot: "only-on-failure",
      },
    },
    {
      name: "iOS Safari",
      use: {
        ...devices["iPad Pro 11 landscape"],
        // trace: "retain-on-failure",
        // video: "retain-on-failure",
        // screenshot: "only-on-failure",
      },
    },
  ],
};
export default config;

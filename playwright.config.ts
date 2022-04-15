// eslint-disable-next-line import/no-extraneous-dependencies
import { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  timeout: 50_000,
  projects: [
    {
      name: "Chrome Stable",
      use: {
        browserName: "chromium",
        channel: "chrome",
      },
      testDir: "tests/e2e",
    },
  ],
  reporter: [["dot"], ["json", { outputFile: "test-result.json" }]],
};
export default config;

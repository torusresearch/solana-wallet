// eslint-disable-next-line import/no-extraneous-dependencies
import { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  timeout: 250000,
  projects: [
    {
      name: "Chrome Stable",
      use: {
        browserName: "chromium",
        channel: "chrome",
      },
    },
  ],
};
export default config;

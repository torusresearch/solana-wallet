import dotenv from "dotenv";

import { wait } from "../utils";
import { browserstack } from "./fixtures";

dotenv.config({ path: ".env.testing" });

async function setup() {
  // eslint-disable-next-line no-console
  console.log("BrowserStackLocal starting...");
  const args = {
    key: process.env.BROWSERSTACK_ACCESS_KEY,
  };
  let responseReceived = false;

  browserstack.start(args, (error?: Error) => {
    if (error) {
      // eslint-disable-next-line no-console
      console.error(error.message);
    } else {
      // eslint-disable-next-line no-console
      console.log("BrowserStackLocal started!");
    }
    responseReceived = true;
  });

  while (!responseReceived) {
    // eslint-disable-next-line no-await-in-loop
    await wait(1_000);
  }
}

export default setup;

import { wait } from "../utils";
import { browserstack } from "./fixtures";

async function teardown() {
  if (browserstack?.isRunning()) {
    let stopped = false;
    browserstack.stop(() => {
      stopped = true;
      // eslint-disable-next-line no-console
      console.log("BrowserStackLocal stopped.");
    });

    while (!stopped) {
      // eslint-disable-next-line no-await-in-loop
      await wait(1_000);
    }
  }
}

export default teardown;

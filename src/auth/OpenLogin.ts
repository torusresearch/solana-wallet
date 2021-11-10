import OpenLogin from "@toruslabs/openlogin";
import { Mutex } from "async-mutex";
import log from "loglevel";

import config from "@/config";

class OpenLoginFactory {
  private static _instance: OpenLogin;

  private static mutex = new Mutex();

  public static async getInstance(): Promise<OpenLogin> {
    if (!OpenLoginFactory._instance) {
      const releaseLock = await this.mutex.acquire();
      try {
        const instance = new OpenLogin({
          clientId: config.openLoginClientId,
          network: config.torusNetwork,
          whiteLabel: config.openLoginWhiteLabel,
          redirectUrl: `${config.baseRoute}end`,
          replaceUrlOnRedirect: true,
          uxMode: "redirect",
        });
        await instance.init();
        // eslint-disable-next-line require-atomic-updates
        OpenLoginFactory._instance = instance;
      } catch (error) {
        log.error(error, "Unable to create openlogin instance");
        throw error;
      } finally {
        releaseLock();
      }
    }
    return OpenLoginFactory._instance;
  }
}
export default OpenLoginFactory;

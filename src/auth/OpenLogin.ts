import OpenLogin from "@toruslabs/openlogin";
import { Mutex } from "async-mutex";
import log from "loglevel";

import config from "@/config";

class OpenLoginFactory {
  private static instance: OpenLogin;

  private static mutex = new Mutex();

  public static async getInstance(): Promise<OpenLogin> {
    const releaseLock = await this.mutex.acquire();
    try {
      if (!OpenLoginFactory.instance) {
        const instance = new OpenLogin({
          clientId: config.openLoginClientId,
          network: config.torusNetwork,
          whiteLabel: config.openLoginWhiteLabel,
          redirectUrl: `${config.baseRoute}end`,
          replaceUrlOnRedirect: true,
          uxMode: "redirect",
          originData: {
            [window.location.origin]: config.openLoginOriginSig as string,
          },
          sessionTime: 3 * 86400,
        });
        await instance.init();

        OpenLoginFactory.instance = instance;
      }
    } catch (error) {
      log.error(error, "Unable to create openlogin instance");
      throw error;
    } finally {
      releaseLock();
    }
    return OpenLoginFactory.instance;
  }
}
export default OpenLoginFactory;

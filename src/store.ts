import { storageAvailable } from "@toruslabs/openlogin";
import { pick } from "lodash";
import log from "loglevel";
import { createStore } from "vuex";
import { config } from "vuex-module-decorators";
import VuexPersistence from "vuex-persist";

import appConfig from "./config";
import { CONTROLLER_MODULE_KEY, ControllerModuleState, LOCAL_STORAGE_KEY, SESSION_STORAGE_KEY } from "./utils/enums";

config.rawError = true;

const pluginsArray = [];

interface VuexState {
  [CONTROLLER_MODULE_KEY]: ControllerModuleState;
}

if (storageAvailable(appConfig.dappStorageKey ? LOCAL_STORAGE_KEY : SESSION_STORAGE_KEY)) {
  const vuexPersist = new VuexPersistence<VuexState>({
    key: appConfig.dappStorageKey || "casper-app",
    storage: appConfig.dappStorageKey ? window[LOCAL_STORAGE_KEY] : window[SESSION_STORAGE_KEY],
    reducer: (state: VuexState) => {
      // Store only the keys i care about
      log.info(state);
      const cMoState = state[CONTROLLER_MODULE_KEY];
      return {
        ...state,
        [CONTROLLER_MODULE_KEY]: pick(cMoState, ["torusState"]),
      };
    },
  });
  pluginsArray.push(vuexPersist.plugin);
}

const store = createStore<VuexState>({
  modules: {},
  plugins: pluginsArray,
});

export default store;

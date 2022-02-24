import { createStore } from "vuex";
import { config } from "vuex-module-decorators";

import { CONTROLLER_MODULE_KEY, ControllerModuleState } from "./utils/enums";

config.rawError = true;

interface VuexState {
  [CONTROLLER_MODULE_KEY]: ControllerModuleState;
}

const store = createStore<VuexState>({});
export default store;

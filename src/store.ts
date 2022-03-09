import { createStore } from "vuex";
import { config } from "vuex-module-decorators";

// eslint-disable-next-line import/no-cycle
import vuexSharedMutations from "./plugins/vuexSharedMutations";
import { CONTROLLER_MODULE_KEY, ControllerModuleState } from "./utils/enums";

config.rawError = true;

export interface VuexState {
  [CONTROLLER_MODULE_KEY]: ControllerModuleState;
}

const store = createStore<VuexState>({
  plugins: [vuexSharedMutations()],
});

export default store;

import { cloneDeep } from "lodash";
import log from "loglevel";
import { Action, getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";

import TorusController, { DEFAULT_CONFIG, DEFAULT_STATE } from "@/controllers/TorusController";
import { CONTROLLER_MODULE_KEY, TorusControllerState } from "@/utils/enums";

import store from "../store";

@Module({
  name: CONTROLLER_MODULE_KEY,
  namespaced: true,
  dynamic: true,
  store,
})
class ControllerModule extends VuexModule {
  public torus = new TorusController({ config: DEFAULT_CONFIG, state: DEFAULT_STATE });

  public torusState: TorusControllerState = cloneDeep(DEFAULT_STATE);

  @Mutation
  public updateTorusState(state: TorusControllerState): void {
    this.torusState = { ...state };
  }

  /**
   * Call once on refresh
   */
  @Action
  public init(): void {
    this.torus.init({ config: DEFAULT_CONFIG, state: this.torusState });
    this.torus.subscribe((state) => {
      log.info(state);
      this.updateTorusState(state);
    });
    // this.torus.setupUntrustedCommunication();
  }

  // @Action
  // async triggerLogin() {}
}

export default getModule(ControllerModule);

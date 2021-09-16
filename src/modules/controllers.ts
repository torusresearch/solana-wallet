import { LOGIN_PROVIDER, LOGIN_PROVIDER_TYPE, OpenloginUserInfo } from "@toruslabs/openlogin";
import { cloneDeep } from "lodash";
import log from "loglevel";
import { Action, getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";

import OpenLoginHandler from "@/auth/OpenLoginHandler";
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

  public userInfo: OpenloginUserInfo = {
    aggregateVerifier: "",
    email: "",
    name: "",
    profileImage: "",
    typeOfLogin: LOGIN_PROVIDER.GOOGLE,
    verifier: "",
    verifierId: "",
  };

  @Mutation
  public updateTorusState(state: TorusControllerState): void {
    this.torusState = { ...state };
  }

  @Mutation
  public update(state: OpenloginUserInfo): void {
    this.userInfo = { ...state };
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

  @Action
  async triggerLogin({ loginProvider, login_hint }: { loginProvider: LOGIN_PROVIDER_TYPE; login_hint?: string }): Promise<void> {
    const handler = new OpenLoginHandler({
      loginProvider,
      extraLoginOptions: login_hint ? { login_hint: login_hint } : {},
    });
    const result = await handler.handleLoginWindow();
    const { privKey, userInfo } = result;
    this.update(userInfo);
    const address = await this.torus.addAccount(privKey);
    this.torus.setSelectedAccount(address);
  }
}

export default getModule(ControllerModule);

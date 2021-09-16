import { LOGIN_PROVIDER_TYPE, OpenloginUserInfo } from "@toruslabs/openlogin";
import { cloneDeep, omit } from "lodash";
import log from "loglevel";
import { Action, getModule, Module, Mutation, VuexModule } from "vuex-module-decorators";

import OpenLoginHandler from "@/auth/OpenLoginHandler";
import config from "@/config";
import TorusController, { DEFAULT_CONFIG, DEFAULT_STATE } from "@/controllers/TorusController";
import installStorePlugin from "@/plugins/persistPlugin";
import { CONTROLLER_MODULE_KEY, DEFAULT_USER_INFO, LOCAL_STORAGE_KEY, SESSION_STORAGE_KEY, TorusControllerState } from "@/utils/enums";

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

  public userInfo: OpenloginUserInfo = cloneDeep(DEFAULT_USER_INFO);

  @Mutation
  public updateTorusState(state: TorusControllerState): void {
    this.torusState = { ...state };
  }

  @Mutation
  public update(state: OpenloginUserInfo): void {
    this.userInfo = { ...state };
  }

  @Mutation
  public resetTorusController(): void {
    this.torus = new TorusController({ config: DEFAULT_CONFIG, state: DEFAULT_STATE });
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

  @Action
  logout(): void {
    this.update(DEFAULT_USER_INFO);
    this.updateTorusState(cloneDeep(DEFAULT_STATE));
    this.resetTorusController();
  }
}

const module = getModule(ControllerModule);

installStorePlugin({
  key: CONTROLLER_MODULE_KEY,
  storage: config.dappStorageKey ? LOCAL_STORAGE_KEY : SESSION_STORAGE_KEY,
  saveState: (key: string, state: Record<string, unknown>, storage?: Storage) => {
    const requiredState = omit(state, [`${CONTROLLER_MODULE_KEY}.torus`]);
    storage?.setItem(key, JSON.stringify(requiredState));
  },
  restoreState: (key: string, storage?: Storage) => {
    const value = storage?.getItem(key);
    if (typeof value === "string") {
      // If string, parse, or else, just return
      const parsedValue = JSON.parse(value || "{}");
      return {
        [CONTROLLER_MODULE_KEY]: {
          torus: new TorusController({ config: DEFAULT_CONFIG, state: DEFAULT_STATE }),
          ...(parsedValue[CONTROLLER_MODULE_KEY] || {}),
        },
      };
    } else {
      return value || {};
    }
  },
});

export default module;

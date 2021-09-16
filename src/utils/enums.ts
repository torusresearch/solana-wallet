import {
  AccountTrackerConfig,
  AccountTrackerState,
  BaseConfig,
  BaseCurrencyControllerConfig,
  BaseCurrencyControllerState,
  BaseState,
  KeyringControllerState,
  NetworkConfig,
  NetworkState,
  PreferencesConfig,
  PreferencesState,
  // SafeEventEmitterProvider,
} from "@toruslabs/base-controllers";
import { CasperBlock } from "@toruslabs/casper-controllers";
import { LOGIN_PROVIDER, OpenloginUserInfo } from "@toruslabs/openlogin";
import { ArrowBoldForvardIcon } from "@toruslabs/vue-icons/arrows";
import { ListIcon, PlusIcon, SettingsIcon } from "@toruslabs/vue-icons/basic";
import { DatabaseIcon } from "@toruslabs/vue-icons/software";

export const LOCAL_STORAGE_KEY = "localStorage";
export const SESSION_STORAGE_KEY = "sessionStorage";
export type STORAGE_TYPE = typeof LOCAL_STORAGE_KEY | typeof SESSION_STORAGE_KEY;

export type OpenLoginPopupResponse = {
  userInfo: OpenloginUserInfo;
  privKey: string;
};

export interface TorusControllerState extends BaseState {
  NetworkControllerState: NetworkState;
  CurrencyControllerState: BaseCurrencyControllerState;
  PreferencesControllerState: PreferencesState;
  AccountTrackerState: AccountTrackerState;
  KeyringControllerState: KeyringControllerState;
}

export interface TorusControllerConfig extends BaseConfig {
  NetworkControllerConfig: NetworkConfig;
  CurrencyControllerConfig: BaseCurrencyControllerConfig;
  PreferencesControllerConfig: PreferencesConfig;
  AccountTrackerConfig: AccountTrackerConfig<CasperBlock>;
  KeyringControllerConfig: BaseConfig;
}

export const CONTROLLER_MODULE_KEY = "controllerModule";

export interface ControllerModuleState {
  torusState: TorusControllerState;
}

export const NAVIGATION_LIST = {
  home: {
    name: "Home",
    title: "Account Balance",
    route: "home",
    icon: PlusIcon,
  },
  transfer: {
    name: "Transfer",
    title: "Transfer Details",
    route: "transfer",
    icon: ArrowBoldForvardIcon,
  },
  topup: {
    name: "Top Up",
    title: "Select a Provider",
    route: "topup",
    icon: DatabaseIcon,
  },
  activity: {
    name: "Activity",
    title: "Transaction Activities",
    route: "activity",
    icon: ListIcon,
  },
  settings: {
    name: "Settings",
    title: "Settings",
    route: "settings",
    icon: SettingsIcon,
  },
};

export const DEFAULT_USER_INFO = {
  aggregateVerifier: "",
  email: "",
  name: "",
  profileImage: "",
  typeOfLogin: LOGIN_PROVIDER.GOOGLE,
  verifier: "",
  verifierId: "",
};

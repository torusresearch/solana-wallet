import { Transaction } from "@solana/web3.js";
import {
  AccountTrackerConfig,
  AccountTrackerState,
  BaseConfig,
  BaseCurrencyControllerConfig,
  BaseCurrencyControllerState,
  BaseEmbedControllerState,
  BaseState,
  KeyringControllerState,
  NetworkConfig,
  NetworkState,
  ProviderConfig,
  // PreferencesConfig,
  // PreferencesState,
  // SafeEventEmitterProvider,
  TransactionConfig,
  TransactionState,
} from "@toruslabs/base-controllers";
import { LOGIN_PROVIDER, OpenloginUserInfo } from "@toruslabs/openlogin";
import { SolanaBlock } from "@toruslabs/solana-controllers";
import { SolanaPreferencesConfig, SolanaPreferencesState } from "@toruslabs/solana-controllers";
import { TokensTrackerConfig, TokensTrackerState } from "@toruslabs/solana-controllers/types/src/Tokens/TokensTrackerController";
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
  PreferencesControllerState: SolanaPreferencesState;
  AccountTrackerState: AccountTrackerState;
  KeyringControllerState: KeyringControllerState;
  TransactionControllerState: TransactionState<Transaction>;
  EmbedControllerState: BaseEmbedControllerState;
  TokensTrackerState: TokensTrackerState;
}

export interface TorusControllerConfig extends BaseConfig {
  NetworkControllerConfig: NetworkConfig;
  CurrencyControllerConfig: BaseCurrencyControllerConfig;
  PreferencesControllerConfig: SolanaPreferencesConfig;
  AccountTrackerConfig: AccountTrackerConfig<SolanaBlock>;
  KeyringControllerConfig: BaseConfig;
  TransactionControllerConfig: TransactionConfig;
  TokensTrackerConfig: TokensTrackerConfig;
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
  // topup: {
  //   name: "Top Up",
  //   title: "Select a Provider",
  //   route: "topup",
  //   icon: DatabaseIcon,
  // },
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

export const SOL = "sol";
export const ENS = "ens";
export const GOOGLE = "google";
export const REDDIT = "reddit";
export const DISCORD = "discord";
export const GITHUB = "github";
export const TWITTER = "twitter";

export interface TransferType {
  label: string;
  value: string;
}

export const ALLOWED_VERIFIERS: TransferType[] = [
  {
    label: "Solana address",
    value: SOL,
  },
  {
    label: "ENS domain",
    value: ENS,
  },
  {
    label: "Google account",
    value: GOOGLE,
  },
  {
    label: "Twitter handle",
    value: TWITTER,
  },
  {
    label: "Reddit username",
    value: REDDIT,
  },
  {
    label: "Discord ID",
    value: DISCORD,
  },
];

export const ALLOWED_VERIFIERS_ERRORS: Record<string, string> = {
  [SOL]: "Invalid SOL Address",
  [GOOGLE]: "Invalid Email Address",
  [REDDIT]: "Invalid Reddit username",
  [DISCORD]: "Invalid Discord ID",
  [TWITTER]: `Twitter username begins with "@"`,
  [GITHUB]: "Invalid GitHub username",
  [ENS]: "Invalid ENS address",
};

export const STATUS_SUCCESS = "success";
export const STATUS_WARNING = "warning";
export const STATUS_ERROR = "error";
export const STATUS_INFO = "info";
export type STATUS_TYPE = typeof STATUS_SUCCESS | typeof STATUS_WARNING | typeof STATUS_ERROR | typeof STATUS_INFO;
// export type TX_TYPE = "Transfer" | "Deploy" | "Buy Crypto";

export const BUTTON_POSITION = {
  BOTTOM_LEFT: "bottom-left",
  TOP_LEFT: "top-left",
  BOTTOM_RIGHT: "bottom-right",
  TOP_RIGHT: "top-right",
} as const;

export type BUTTON_POSITION_TYPE = typeof BUTTON_POSITION[keyof typeof BUTTON_POSITION];

export interface EmbedInitParams {
  buttonPosition: BUTTON_POSITION_TYPE;
  torusWidgetVisibility: boolean;
  apiKey: string;
  network: ProviderConfig;
}

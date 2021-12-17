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
import { SolanaBlock, SolanaPreferencesConfig, SolanaPreferencesState } from "@toruslabs/solana-controllers";
import { TokenInfoState, TokensInfoConfig } from "@toruslabs/solana-controllers/dist/types/Tokens/TokenInfoController";
import { TokensTrackerConfig, TokensTrackerState } from "@toruslabs/solana-controllers/dist/types/Tokens/TokensTrackerController";
import { ArrowBoldForvardIcon } from "@toruslabs/vue-icons/arrows";
import { ListIcon, PlusIcon, SettingsIcon } from "@toruslabs/vue-icons/basic";
import { DatabaseIcon } from "@toruslabs/vue-icons/software";

export const LOCAL_STORAGE_KEY = "localStorage";
export const SESSION_STORAGE_KEY = "sessionStorage";
export type STORAGE_TYPE = typeof LOCAL_STORAGE_KEY | typeof SESSION_STORAGE_KEY;

export const RAMPNETWORK = "rampnetwork";

export const FEATURES_DEFAULT_POPUP_WINDOW = "directories=0,titlebar=0,toolbar=0,status=0,location=0,menubar=0,height=700,width=1200";

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
  TokenInfoState: TokenInfoState;
  RelayMap: { [relay: string]: string };
  RelayKeyHostMap: { [Pubkey: string]: string };
}

export interface TorusControllerConfig extends BaseConfig {
  NetworkControllerConfig: NetworkConfig;
  CurrencyControllerConfig: BaseCurrencyControllerConfig;
  PreferencesControllerConfig: SolanaPreferencesConfig;
  AccountTrackerConfig: AccountTrackerConfig<SolanaBlock>;
  KeyringControllerConfig: BaseConfig;
  TransactionControllerConfig: TransactionConfig;
  TokensTrackerConfig: TokensTrackerConfig;
  TokensInfoConfig: TokensInfoConfig;
  RelayHost: { [relay: string]: string };
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
  // {
  //   label: "ENS domain",
  //   value: ENS,
  // },
  // {
  //   label: "Google account",
  //   value: GOOGLE,
  // },
  // {
  //   label: "Twitter handle",
  //   value: TWITTER,
  // },
  // {
  //   label: "Reddit username",
  //   value: REDDIT,
  // },
  // {
  //   label: "Discord ID",
  //   value: DISCORD,
  // },
];

export const ALLOWED_VERIFIERS_ERRORS: Record<string, string> = {
  [SOL]: "Invalid SOL Address",
  [GOOGLE]: "Invalid Email Address",
  [REDDIT]: "Invalid Reddit username",
  [DISCORD]: "Invalid Discord ID",
  [TWITTER]: "Twitter username begins with '@'",
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
  isIFrameFullScreen: boolean;
  apiKey: string;
  network: ProviderConfig;
  dappMetadata: {
    name: string;
    icon: string;
  };
  extraParams?: { [keyof: string]: string };
}

export type TransactionChannelDataType = {
  type: string;
  message?: string;
  origin: string;
  signer: string;
  balance: string;
  selectedCurrency: string;
  currencyRate: string;
  jwtToken: string;
  network: string;
  networkDetails: ProviderConfig;
};

// export type SignMessageChannelDataType = Omit<TransactionChannelDataType, "message"> & {
export type SignMessageChannelDataType = TransactionChannelDataType & {
  data?: string;
  display?: string;
};

export interface LOGIN_CONFIG {
  loginProvider: string;
  name: string;
  description: string;
  logoHover: string;
  logoLight: string;
  logoDark: string;
  showOnModal: boolean;
  mainOption: boolean;
  showOnDesktop: boolean;
  showOnMobile: boolean;
  hasLightLogo: boolean;
  buttonDescription: string;
}

export enum NFT_CARD_MODE {
  SUMMARY = "summary",
  LARGE = "large",
  EXPANDED = "expanded",
}
export const REDIRECT_FLOW_CONFIG: { [keyof: string]: { redirectPath: string; requiresLogin: boolean; shouldRedirect: boolean } } = {
  logout: {
    redirectPath: "/logout",
    requiresLogin: false,
    shouldRedirect: true,
  },
  login: {
    redirectPath: "/login",
    requiresLogin: false,
    shouldRedirect: true,
  },
  wallet_instance_id: {
    redirectPath: "/",
    requiresLogin: true,
    shouldRedirect: false,
  },
  set_provider: {
    redirectPath: "/providerchange",
    requiresLogin: true,
    shouldRedirect: true,
  },
  topup: {
    redirectPath: "/",
    requiresLogin: false,
    shouldRedirect: false,
  },
  get_provider_state: {
    redirectPath: "/",
    requiresLogin: true,
    shouldRedirect: false,
  },
  wallet_get_provider_state: {
    redirectPath: "/",
    requiresLogin: true,
    shouldRedirect: false,
  },
  send_transaction: {
    redirectPath: "/confirm",
    requiresLogin: true,
    shouldRedirect: true,
  },
  sign_transaction: {
    redirectPath: "/confirm",
    requiresLogin: true,
    shouldRedirect: true,
  },
  sign_all_transaction: {
    redirectPath: "/confirm",
    requiresLogin: true,
    shouldRedirect: true,
  },
  sign_message: {
    redirectPath: "/confirm_message",
    requiresLogin: true,
    shouldRedirect: true,
  },
  connect: {
    redirectPath: "/",
    requiresLogin: false,
    shouldRedirect: false,
  },
  user_info: {
    redirectPath: "/",
    requiresLogin: true,
    shouldRedirect: false,
  },
  get_gasless_public_key: {
    redirectPath: "/",
    requiresLogin: true,
    shouldRedirect: false,
  },
  getAccounts: {
    redirectPath: "/",
    requiresLogin: true,
    shouldRedirect: false,
  },
  solana_requestAccounts: {
    redirectPath: "/",
    requiresLogin: true,
    shouldRedirect: false,
  },
  nft_list: {
    redirectPath: "/",
    requiresLogin: true,
    shouldRedirect: false,
  },
  nft_transfer: {
    redirectPath: "/confirm-nft",
    requiresLogin: true,
    shouldRedirect: true,
  },
};

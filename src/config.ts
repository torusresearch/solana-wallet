import { LOGIN_PROVIDER, OPENLOGIN_NETWORK_TYPE, storageAvailable } from "@toruslabs/openlogin";
import type { WhiteLabelData } from "@toruslabs/openlogin-jrpc";
import log, { LogLevelDesc } from "loglevel";

import { LOCAL_STORAGE_KEY, SESSION_STORAGE_KEY } from "./utils/enums";

const { VUE_APP_TORUS_NETWORK, NODE_ENV, VUE_APP_MODE } = process.env;

const baseUrl = window.location.origin;

const baseRoute = baseUrl + process.env.BASE_URL;

const redirectURI = `${baseUrl}/redirect`;

const { hash } = window.location;
const hashParams = new URLSearchParams(hash.slice(1));
const dappStorageKey = hashParams.get("dappStorageKey");

let logLevel: LogLevelDesc;
switch (NODE_ENV) {
  case "development":
    logLevel = "debug";
    break;
  case "production":
    if (VUE_APP_MODE === "testing") logLevel = "debug";
    else logLevel = "error";
    break;
  default:
    logLevel = "error";
    break;
}
log.setLevel(logLevel);

export default {
  baseUrl,
  baseRoute,
  commonApiHost: "https://common-api.tor.us",
  metadataHost: "https://metadata.tor.us",
  api: "https://solana-api.tor.us",
  redirect_uri: redirectURI,
  dappStorageKey,

  supportedCurrencies: ["USD", "AUD", "CAD", "EUR", "GBP", "HKD", "IDR", "INR", "JPY", "PHP", "RUB", "SGD", "UAH"],
  logosUrl: "https://images.toruswallet.io",

  isStorageAvailable: {
    [LOCAL_STORAGE_KEY]: storageAvailable(LOCAL_STORAGE_KEY),
    [SESSION_STORAGE_KEY]: storageAvailable(SESSION_STORAGE_KEY),
  },

  torusNetwork: VUE_APP_TORUS_NETWORK as OPENLOGIN_NETWORK_TYPE,
  openLoginClientId: "BImWlKqOHk90Eth1F7sq29AbQQWsPDBCbKPbTpbPR7KcUzdNO8DkqlTQoOyIlzK_QVGChKft-1QRjc8yrF7mEVE",
  openLoginWhiteLabel: {
    dark: false,
    name: "Solana Wallet",
    theme: {
      primary: "#9945ff",
    },
  } as WhiteLabelData,

  // Topup
  rampApiHost: "https://ramp-network-api.tor.us",
  rampApiQuoteHost: "https://api-instant.ramp.network/api/host-api/assets",
  rampAPIKEY: "dw9fe8drpzmdfuks79ub5hvmqzuyjbme4kwkwkqf",

  rampHost: "https://widget-instant.ramp.network",

  // key is the login provider
  loginConfig: {
    [LOGIN_PROVIDER.GOOGLE]: {
      loginProvider: LOGIN_PROVIDER.GOOGLE,
      name: "Google",
      description: "login.verifier-google-desc",
      logoHover: "",
      logoLight: "",
      logoDark: "",
      showOnModal: true,
      mainOption: true,
      showOnDesktop: true,
      showOnMobile: true,
      // For torus only
      hasLightLogo: false,
      buttonDescription: "",
    },
    [LOGIN_PROVIDER.FACEBOOK]: {
      loginProvider: LOGIN_PROVIDER.FACEBOOK,
      description: "",
      name: "Facebook",
      logoHover: "",
      logoLight: "",
      logoDark: "",
      showOnModal: true,
      mainOption: true,
      showOnDesktop: true,
      showOnMobile: true,
      // For torus only
      hasLightLogo: false,
      buttonDescription: "",
    },
    [LOGIN_PROVIDER.TWITTER]: {
      loginProvider: LOGIN_PROVIDER.TWITTER,
      description: "",
      name: "Twitter",
      logoHover: "",
      logoLight: "",
      logoDark: "",
      showOnModal: true,
      mainOption: true,
      showOnDesktop: true,
      showOnMobile: true,
      // For torus only
      hasLightLogo: false,
      buttonDescription: "",
    },
    [LOGIN_PROVIDER.DISCORD]: {
      loginProvider: LOGIN_PROVIDER.DISCORD,
      description: "",
      name: "Discord",
      logoHover: "",
      logoLight: "",
      logoDark: "",
      showOnModal: true,
      mainOption: true,
      showOnDesktop: true,
      showOnMobile: true,
      // For torus only
      hasLightLogo: false,
      buttonDescription: "",
    },
    [LOGIN_PROVIDER.LINE]: {
      loginProvider: LOGIN_PROVIDER.LINE,
      description: "",
      name: "LINE",
      logoHover: "",
      logoLight: "",
      logoDark: "",
      mainOption: false,
      showOnModal: true,
      showOnDesktop: true,
      showOnMobile: true,
      // For torus only
      hasLightLogo: false,
      buttonDescription: "",
    },
    [LOGIN_PROVIDER.REDDIT]: {
      loginProvider: LOGIN_PROVIDER.REDDIT,
      description: "",
      name: "Reddit",
      logoHover: "",
      logoLight: "",
      logoDark: "",
      mainOption: false,
      showOnModal: false,
      showOnDesktop: false,
      showOnMobile: false,
      // For torus only
      hasLightLogo: false,
      buttonDescription: "",
    },
    [LOGIN_PROVIDER.APPLE]: {
      loginProvider: LOGIN_PROVIDER.APPLE,
      description: "",
      name: "Apple",
      logoHover: "",
      logoLight: "",
      logoDark: "",
      mainOption: false,
      showOnModal: true,
      showOnDesktop: true,
      showOnMobile: true,
      // For torus only
      hasLightLogo: true,
      buttonDescription: "",
    },
    [LOGIN_PROVIDER.GITHUB]: {
      loginProvider: LOGIN_PROVIDER.GITHUB,
      description: "",
      name: "GitHub",
      logoHover: "",
      logoLight: "",
      logoDark: "",
      mainOption: false,
      showOnModal: true,
      showOnDesktop: true,
      showOnMobile: true,
      // For torus only
      hasLightLogo: true,
      buttonDescription: "",
    },
    [LOGIN_PROVIDER.TWITCH]: {
      loginProvider: LOGIN_PROVIDER.TWITCH,
      description: "",
      name: "Twitch",
      logoHover: "",
      logoLight: "",
      logoDark: "",
      mainOption: false,
      showOnModal: true,
      showOnDesktop: true,
      showOnMobile: true,
      // For torus only
      hasLightLogo: false,
      buttonDescription: "",
    },
    [LOGIN_PROVIDER.LINKEDIN]: {
      loginProvider: LOGIN_PROVIDER.LINKEDIN,
      description: "",
      name: "LinkedIn",
      logoHover: "",
      logoLight: "",
      logoDark: "",
      mainOption: false,
      showOnModal: true,
      showOnDesktop: true,
      showOnMobile: true,
      // For torus only
      hasLightLogo: false,
      buttonDescription: "",
    },
    [LOGIN_PROVIDER.WECHAT]: {
      loginProvider: LOGIN_PROVIDER.WECHAT,
      description: "",
      name: "WeChat",
      logoHover: "",
      logoLight: "",
      logoDark: "",
      mainOption: false,
      showOnModal: true,
      showOnDesktop: true,
      showOnMobile: false,
      // For torus only
      hasLightLogo: false,
      buttonDescription: "",
    },
    [LOGIN_PROVIDER.KAKAO]: {
      loginProvider: LOGIN_PROVIDER.KAKAO,
      description: "",
      name: "Kakao",
      logoHover: "",
      logoLight: "",
      logoDark: "",
      mainOption: false,
      showOnModal: true,
      showOnDesktop: true,
      showOnMobile: true,
      // For torus only
      hasLightLogo: false,
      buttonDescription: "",
    },
    [LOGIN_PROVIDER.EMAIL_PASSWORDLESS]: {
      loginProvider: LOGIN_PROVIDER.EMAIL_PASSWORDLESS,
      description: "login.verifier-email-desc",
      name: "email",
      logoHover: "",
      logoLight: "",
      logoDark: "",
      mainOption: false,
      showOnModal: true,
      showOnDesktop: true,
      showOnMobile: true,
      // For torus only
      hasLightLogo: true,
      buttonDescription: "Sign up/in with Email",
    },
  },
};

import { event } from "vue-gtag";

export function trackUserClick(payload: string) {
  event("user_clicks", { clicked_on: payload });
}
export const googleAnalyticsDirective = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  created(el: any, binding: any) {
    el.addEventListener("click", () => {
      trackUserClick(binding.value);
    });
  },
};

export enum LoginInteractions {
  LOGIN_GOOGLE = "login with google",
  LOGIN_FACEBOOK = "login with facebook",
  LOGIN_TWITTER = "login with twitter",
  LOGIN_DISCORD = "login with discord",
  LOGIN_EMAIL = "login with email",
}
export enum HomePageInteractions {
  TOPUP = "home page - topup button",
  TRANSFER = "home page - transfer button",
  COPY_PUB = "home page - copied pub key",
  REFRESH = "home page - refresh tokens",
  SPL_TOKENS = "home page - spl token",
  IMPORT_TOKENS = "home page - import tokens",
  SOLANA_PAY = "home page - solana pay",
}

export enum TransferPageInteractions {
  TOKEN_SELECT = "transfer page - selected token:",
  SEND_TO = "transfer page - sendto changed to:",
  // TRANSFER_AMOUNT = "transfer page - amount changed to:",
  CURRENCY_TOGGLE = "transfer page - set unit of amount to:",
  INITIATE = "transfer page - transfer button",
  CONFIRM = "transfer page - confirm transfer button",
  CANCEL = "transfer page - cancelled the transaction",
}
export enum TopupPageInteractions {
  PROVIDER_SELECT = "topup page - selected topup provider: ",
  SELECTED_CRYPTO = "topup page - selected crypto currency: ",
  SELECTED_FIAT = "topup page - selected fiat currency: ",
  AMOUNT = "topup page - fiat amount entered: ",
  CONFIRM = "topup page - topup button",
}

export enum NftsPageInteractions {
  SELECT = "nfts page - selected nft: ",
  SEND = "nfts page - send button clicked for nft: ",
  SOLSCAN = "nfts page - views solscan for nft: ",
  OPEN_COLLECTION = "nfts page - opened collection:  ",
}

export enum ActivityPageInteractions {
  ACTIVITY_DETAIL = "activities page - opened activity detail on link :",
  FILTER_TRANSACTION_TYPE = "activities page - selected activity type filter :",
  FILTER_TRANSACTION_TIME = "activities page - selected activity time filter :",
}
export enum SettingsPageInteractions {
  LANGAUGE = "settings page - selected language :",
  NETWORK = "settings page - selected network :",
  DISPLAY = "settings page - selected display theme :",
  ACCOUNT_DETAILS = "settings page - account details :",
  // SHOW_PRIV = "settings page - show private key",
  COPY_PRIV = "settings page - copy private key",
}

export enum GeneralInteractions {
  GENERAL_LANGUAGE = "header - selected language:",
  GENERAL_PUB_KEY = "header - copied pub key ",
  GENERAL_LOGOUT = "header - logout ",
  GENERAL_CHANGE_CURRENCY = "changed currency to : ",
}

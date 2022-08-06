import { PaymentParams, significantDigits } from "@toruslabs/base-controllers";
import { get } from "@toruslabs/http-helpers";
import { helpers, maxValue, minValue, required } from "@vuelidate/validators";
import log from "loglevel";

// import RampLogo from "@/assets/rampnetwork-logo.svg";
// import RampLogoLight from "@/assets/rampnetwork-logo-white.svg";
import { QuoteApiResponse, QuoteAsset, QuoteResponse, RequestObject } from "@/components/topup/gateways/types";
import config from "@/config";

import { TOPUP, TopUpProvider } from "./interface";

// const rampApiHost = "https://ramp-network-api.tor.us";
const rampApiQuoteHost = "https://api-instant.ramp.network/api/host-api/assets";
// const rampAPIKEY = "dw9fe8drpzmdfuks79ub5hvmqzuyjbme4kwkwkqf";
// const rampHost: "https://widget-instant.ramp.network";

async function getQuote(requestObject: RequestObject): Promise<QuoteResponse> {
  const rampSymbol = requestObject.digital_currency;

  let response: Promise<QuoteApiResponse>;
  try {
    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };
    response = get<QuoteApiResponse>(`${rampApiQuoteHost}`, options);
  } catch (error) {
    log.error(error);
    throw error;
  }
  const asset = await response;
  const selected_asset = asset.assets.find((item) => item.symbol === rampSymbol) as QuoteAsset; // the ramp asset object
  const amount = Number(requestObject.requested_amount);
  const cryptoAmount = amount / selected_asset.price[requestObject.fiat_currency];
  return {
    fee: asset.maxFeePercent,
    rate: selected_asset.price[requestObject.fiat_currency],
    decimals: selected_asset.decimals,
    cryptoAmount: Number(significantDigits(cryptoAmount, false, 4)),
  };
}

const configDetails: TopUpProvider = {
  name: TOPUP.RAMPNETWORK,
  description: "Rampnetwork",
  paymentMethod: "Credit / Debit / Apple Pay",
  fee: "0.62% to 2.9%",
  limit: "5,000€/purchase, 20,000€/mo",
  // logo: (darkMode?: boolean) => {
  //   return darkMode ? RampLogoLight : RampLogo;
  // },
  validCryptocurrencies: [
    {
      value: "SOL",
      label: "SOL",
      symbol: "SOLANA_SOL",
    },
    //  {
    //    value: "USDT",
    //    label: "USDT",
    //    symbol: "SOLANA_USDT",
    //  },
    //  {
    //    value: "KIN",
    //    label: "KIN",
    //    symbol: "SOLANA_KIN",
    //  },
    //  {
    //    value: "USDC",
    //    label: "USDC",
    //    symbol: "SOLANA_USDC",
    //  },
  ],
  validCurrencies: ["USD", "EUR", "GBP", "PLN"].map((k) => {
    return { value: k, label: k };
  }),

  orderUrl: async (
    state: { selectedAddress: string; email: string },
    params: PaymentParams,
    instanceId: string,
    redirectFlow?: boolean,
    redirectURL?: string
  ): Promise<URL> => {
    const instanceState = encodeURIComponent(
      window.btoa(
        JSON.stringify({
          instanceId,
          provider: "RAMP_NETWORK",
        })
      )
    );
    const parameters = {
      userAddress: params.selectedAddress || state.selectedAddress || undefined,
      userEmailAddress: state.email || undefined,
      swapAsset: params.selectedCryptoCurrency || "SOLANA_SOL" || undefined,
      swapAmount: params.cryptoAmount || undefined,
      fiatValue: params.fiatValue || undefined,
      fiatCurrency: params.selectedCurrency || undefined,
      variant: "hosted-auto",
      webhookStatusUrl: `${config.rampApiHost}/transaction`,
      hostUrl: "https://app.tor.us",
      hostLogoUrl: "https://app.tor.us/images/torus-logo-blue.svg",
      hostAppName: "Torus",
      hostApiKey: config.rampAPIKEY,
      finalUrl: redirectFlow
        ? `${config.baseRoute}redirect?topup=success&method=topup&resolveRoute=${redirectURL}`
        : `${config.baseRoute}redirect?state=${instanceState}`, // redirect url
      //   : `${config.baseRoute}redirect?instanceId=${instanceId}&topup=success`, // redirect url
    };

    // const redirectUrl = new URL(`${config.baseRoute}/redirect?instanceId=${windowId}&integrity=true&id=${windowId}`);
    const parameterString = new URLSearchParams(JSON.parse(JSON.stringify(parameters)));
    const finalUrl = new URL(`${config.rampHost}?${parameterString.toString()}`);

    // testnet
    // const finalUrl = new URL(`https://ri-widget-staging.firebaseapp.com/?${parameterString.toString()}`);
    return finalUrl;
  },

  // getLogoUrl: (darkMode?: boolean) => {
  //   return darkMode ? RampLogoLight : RampLogo;
  // },
  getQuoteOnAmount: getQuote,
  getQuoteOnCrypto: getQuote,
  getQuoteOnFiat: getQuote,

  rules: {
    amount: {
      required: helpers.withMessage("Required", required),
      minValue: helpers.withMessage("Minimum transaction amount is 10.", minValue(10)),
      maxValue: helpers.withMessage("Maximum transaction amount is 20,000.", maxValue(20000)),
    },
  },
};

export default configDetails;

import { PaymentParams } from "@toruslabs/base-controllers";

import RampLogo from "@/assets/rampnetwork-logo.svg";
import RampLogoLight from "@/assets/rampnetwork-logo-white.svg";
import config from "@/config";

import { TOPUP, TopupProviderDetails } from "./interface";

const configDetails: TopupProviderDetails = {
  name: TOPUP.RAMPNETWORK,
  description: "Rampnetwork",
  paymentMethod: "Credit / Debit / Apple Pay",
  fee: "0.62% to 2.9%",
  limit: "5,000€/purchase, 20,000€/mo",
  logo: (darkMode?: boolean) => {
    return darkMode ? RampLogoLight : RampLogo;
  },
  validCryptocurrencies: [
    {
      value: "SOL",
      label: "SOL",
      symbol: "SOLANA_SOL",
    },
    {
      value: "USDT",
      label: "USDT",
      symbol: "SOLANA_USDT",
    },
    {
      value: "KIN",
      label: "KIN",
      symbol: "SOLANA_KIN",
    },
    {
      value: "USDC",
      label: "USDC",
      symbol: "SOLANA_USDC",
    },
  ],
  validCurrencies: ["USD", "EUR", "GBP", "PLN"].map((k) => {
    return { value: k, label: k };
  }),
};

const orderUrl = async (
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
};

const getLogoUrl = (darkMode?: boolean) => {
  if (darkMode) return RampLogoLight;
  return RampLogo;
};
export default {
  detail: configDetails,
  orderUrl,
  getLogoUrl,
};

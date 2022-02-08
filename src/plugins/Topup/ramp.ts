import { PaymentParams } from "@toruslabs/base-controllers";

import config from "@/config";

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

export default {
  orderUrl,
};

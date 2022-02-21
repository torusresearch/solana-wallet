import { PaymentParams } from "@toruslabs/base-controllers";
import { get } from "@toruslabs/http-helpers";
import log from "loglevel";

import MoonpayLogo from "@/assets/moonpay-logo.svg";
import MoonpayLogoLight from "@/assets/moonpay-logo-white.svg";
import config from "@/config";

import { TOPUP, TopupProviderDetails } from "./interface";

const configDetails: TopupProviderDetails = {
  name: TOPUP.MOONPAY,
  description: "walletTopUp.description",
  paymentMethod: "Credit / Debit Card / Bank Transfer",
  fee: "4.5% or 5 USD",
  limit: "2,000€/day, 10,000€/mo",
  logo: (darkMode: boolean) => {
    return darkMode ? MoonpayLogoLight : MoonpayLogo;
  },
  validCryptocurrencies: [
    {
      value: "SOL",
      label: "SOL",
      symbol: "sol",
    },
  ],
  validCurrencies: ["USD", "EUR", "GBP"].map((k) => {
    return { value: k, label: k };
  }),
};

export const getSignature = async (requestObject: { url: string }) => {
  try {
    const options = {
      //   mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Authorization: `Bearer ${requestObject.token}`,
      },
    };
    const { signature } = await get(`${config.moonpayApiHost}/sign?url=${requestObject.url}`, options);
    return signature as string;
  } catch (error) {
    log.error(error);
  }
  return "";
};

const orderUrl = async (
  state: { selectedAddress: string; email: string },
  params: PaymentParams,
  instanceId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  redirectFlow?: boolean,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  redirectURL?: string
) => {
  const instanceState = encodeURIComponent(
    window.btoa(
      JSON.stringify({
        instanceId,
        provider: TOPUP.MOONPAY,
      })
    )
  );
  const parameters = {
    apiKey: config.moonpayLiveAPIKEY,
    enabledPaymentMethods: "credit_debit_card,sepa_bank_transfer,gbp_bank_transfer",
    currencyCode: params.selectedCryptoCurrency || undefined,
    walletAddresses: JSON.stringify({ sol: state.selectedAddress, usdc_sol: state.selectedAddress }),
    baseCurrencyAmount: params.fiatValue || undefined,
    baseCurrencyCode: params.selectedCurrency || undefined,
    email: state.email || undefined,
    externalCustomerId: state.selectedAddress,
    redirectURL: `${config.redirect_uri}?state=${instanceState}`,
    showWalletAddressForm: true,
  };

  const parameterString = new URLSearchParams(JSON.parse(JSON.stringify(parameters)));
  const url = `${config.moonpayHost}?${parameterString.toString()}`;

  const signature = await getSignature({ url: encodeURIComponent(url) });
  return new URL(`${url}&signature=${encodeURIComponent(signature)}`);
  //   return new URL(url);
};

const getLogoUrl = (darkMode?: boolean) => {
  if (darkMode) return MoonpayLogoLight;
  return MoonpayLogo;
};

export default {
  detail: configDetails,
  orderUrl,
  getLogoUrl,
};

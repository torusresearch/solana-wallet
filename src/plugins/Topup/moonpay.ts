import { PaymentParams } from "@toruslabs/base-controllers";
import { get } from "@toruslabs/http-helpers";
import { helpers, maxValue, minValue, required } from "@vuelidate/validators";
import log from "loglevel";

import MoonpayLogo from "@/assets/moonpay-logo.svg";
import MoonpayLogoLight from "@/assets/moonpay-logo-white.svg";
import { QuoteResponse, RequestObject } from "@/components/topup/gateways/types";
import config from "@/config";

import { TOPUP, TopUpProvider } from "./interface";

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

async function getQuote(requestObject: RequestObject): Promise<QuoteResponse> {
  let response: any;
  try {
    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };
    // response = await get(
    //   `${config.moonpayApiQuoteHost}/v3/currencies/ask_price?cryptoCurrencies=${requestObject.digital_currency}&apiKey=${config.moonpayTestAPIKEY}` +
    //     `&fiatCurrency=${requestObject.fiat_currency}&areFeesIncluded=true`,
    response = await get(
      `${config.moonpayApiQuoteHost}/v3/currencies/${requestObject.digital_currency}/buy_quote?apiKey=${config.moonpayLiveAPIKEY}` +
        `&baseCurrencyCode=${requestObject.fiat_currency.toLowerCase()}&baseCurrencyAmount=${requestObject.requested_amount}&areFeesIncluded=true`,
      options
    );
  } catch (error) {
    log.error(error);
    // throw await error.json();
  }
  // log.info(response);

  return {
    fee: response.feeAmount + response.networkFeeAmount + response.extraFeeAmount,
    rate: response.quoteCurrencyPrice,
    cryptoAmount: response.quoteCurrencyAmount,
    decimals: 0,
  };
}

const configDetails: TopUpProvider = {
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

  orderUrl: async (
    state: { selectedAddress: string; email: string },
    params: PaymentParams,
    instanceId: string,
    _redirectFlow?: boolean,
    _redirectURL?: string
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
  },

  getLogoUrl: (darkMode?: boolean) => {
    if (darkMode) return MoonpayLogoLight;
    return MoonpayLogo;
  },

  getQuoteOnAmount: getQuote,
  getQuoteOnCrypto: getQuote,
  getQuoteOnFiat: getQuote,

  rules: {
    amount: {
      required: helpers.withMessage("Required", required),
      minValue: helpers.withMessage("Minimum transaction amount is 30.", minValue(30)),
      maxValue: helpers.withMessage("Maximum transaction amount is 200.", maxValue(20000)),
    },
  },
};

export default configDetails;

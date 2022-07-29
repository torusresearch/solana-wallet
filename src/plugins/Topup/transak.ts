import { PaymentParams } from "@toruslabs/base-controllers";
import { get } from "@toruslabs/http-helpers";
import { helpers, maxValue, minValue, required } from "@vuelidate/validators";
import log from "loglevel";

import TransakLogo from "@/assets/transak-logo.svg";
import TransakLogoLight from "@/assets/transak-logo-white.svg";
import { QuoteResponse, RequestObject } from "@/components/topup/gateways/types";
import config from "@/config";

import { TOPUP, TopUpProvider } from "./interface";

const transakHost = "https://global.transak.com";
const transakApiQuoteHost = "https://api.transak.com/api/v2";
const transakLiveAPIKEY = "0ae336e4-1968-4ec3-b817-625f6810a7d2";
// const transakTestHost = "https://staging-global.transak.com";
// const transakTestApiQuoteHost = "https://staging-api.transak.com/api/v2";
// const transakTestAPIKEY = "e5adb5e3-b30c-4fa8-85ea-adcbadc98198";

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
      // mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };

    const res = await get(
      `${transakApiQuoteHost}/currencies/price?cryptoCurrency=${requestObject.digital_currency.toUpperCase()}` +
        `&partnerApiKey=${transakLiveAPIKEY}` +
        `&fiatAmount=${requestObject.requested_amount}&fiatCurrency=${requestObject.fiat_currency.toUpperCase()}` +
        "&network=solana" +
        "&isBuyOrSell=BUY",
      options
    );
    response = (res as any).response;
  } catch (error) {
    log.error(error);
  }

  return {
    fee: response.totalFee,
    rate: response.conversionPrice,
    cryptoAmount: response.cryptoAmount,
    decimals: 0,
  };
}

const configDetails: TopUpProvider = {
  name: TOPUP.TRANSAK,
  description: "walletTopUp.description",
  paymentMethod: "Apple & Google Pay / Credit/Debit Card / Bangkok Bank Mobile & iPay / Bank Transfer (sepa/gbp) / SCB Mobile & Easy",
  fee: "0.99% - 5.5% or 5 USD",
  limit: "$5,000/day, $28,000/mo",
  logo: (darkMode: boolean) => {
    return darkMode ? TransakLogoLight : TransakLogo;
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
      // environment: 'STAGING',
      apiKey: transakLiveAPIKEY,
      hostURL: config.baseUrl,
      defaultCryptoCurrency: params.selectedCryptoCurrency || undefined,
      walletAddress: state.selectedAddress, // JSON.stringify({ sol: state.selectedAddress, usdc_sol: state.selectedAddress }),,
      defaultFiatAmount: params.fiatValue || undefined,
      fiatCurrency: params.selectedCurrency || undefined,
      email: state.email || undefined,
      partnerCustomerId: state.selectedAddress,
      redirectURL: `${config.redirect_uri}?state=${instanceState}`,
      // themeColor: colorCode,
      network: "solana",
    };
    const parameterString = new URLSearchParams(JSON.parse(JSON.stringify(parameters)));
    const url = `${transakHost}?${parameterString.toString()}`;

    return new URL(`${url}`);
  },

  getLogoUrl: (darkMode?: boolean) => {
    if (darkMode) return TransakLogoLight;
    return TransakLogo;
  },

  getQuoteOnAmount: getQuote,
  getQuoteOnCrypto: getQuote,
  getQuoteOnFiat: getQuote,

  rules: {
    amount: {
      required: helpers.withMessage("Required", required),
      minValue: helpers.withMessage("Minimum transaction amount is 30.", minValue(30)),
      maxValue: helpers.withMessage("Maximum transaction amount is 500.", maxValue(500)),
    },
  },
};

export default configDetails;

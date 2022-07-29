import { PaymentParams } from "@toruslabs/base-controllers";
import { ValidationRuleWithParams } from "@vuelidate/core";

import { QuoteResponse, RequestObject } from "@/components/topup/gateways/types";

export const enum TOPUP {
  RAMPNETWORK = "rampNetwork",
  MOONPAY = "moonpay",
  TRANSAK = "transak",
}

export interface TopUpProvider {
  name: string;
  description: string;
  paymentMethod: string;
  fee: string;
  limit: string;
  logo: (darkMode: boolean) => string;
  validCryptocurrencies: { value: string; label: string; symbol: string }[];
  validCurrencies: { value: string; label: string }[];

  orderUrl: (
    state: { selectedAddress: string; email: string },
    params: PaymentParams,
    instanceId: string,
    redirectFlow?: boolean,
    redirectURL?: string
  ) => Promise<URL>;
  getLogoUrl: (darkMode?: boolean) => string;

  getQuoteOnFiat: (requestObject: RequestObject) => Promise<QuoteResponse>;
  getQuoteOnAmount: (requestObject: RequestObject) => Promise<QuoteResponse>;
  getQuoteOnCrypto: (requestObject: RequestObject) => Promise<QuoteResponse>;

  rules: {
    amount: {
      required: ValidationRuleWithParams;
      minValue: ValidationRuleWithParams;
      maxValue: ValidationRuleWithParams;
    };
  };
}

import { PaymentParams } from "@toruslabs/base-controllers";

export const enum TOPUP {
  RAMPNETWORK = "rampNetwork",
  MOONPAY = "moonpay",
}

export type TopupProviderDetails = {
  name: string;
  description: string;
  paymentMethod: string;
  fee: string;
  limit: string;
  logo: (darkMode: boolean) => string;
  validCryptocurrencies: { value: string; label: string; symbol: string }[];
  validCurrencies: { value: string; label: string }[];
};

export interface TopUpProvider {
  detail: TopupProviderDetails;
  orderUrl: (
    state: { selectedAddress: string; email: string },
    params: PaymentParams,
    instanceId: string,
    redirectFlow?: boolean,
    redirectURL?: string
  ) => Promise<URL>;
  getLogoUrl: (darkMode?: boolean) => string;
}

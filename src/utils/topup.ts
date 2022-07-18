import MoonpayLogo from "@/assets/moonpay-logo.svg";
import MoonpayLogoLight from "@/assets/moonpay-logo-white.svg";

// import RampLogo from "@/assets/rampnetwork-logo.svg";
// import RampLogoLight from "@/assets/rampnetwork-logo-white.svg";

export const enum TOPUP {
  RAMPNETWORK = "rampNetwork",
  MOONPAY = "moonpay",
}

export type TopupProvider = {
  name: string;
  description: string;
  paymentMethod: string;
  fee: string;
  limit: string;
  logo: (darkMode: boolean) => string;
  validCryptocurrencies: { value: string; label: string; symbol: string }[];
  validCurrencies: { value: string; label: string }[];
};

export const TopupProviders: { [providerName: string]: TopupProvider } = {
  // [TOPUP.RAMPNETWORK]: {
  //   name: TOPUP.RAMPNETWORK,
  //   title: `Rampnetwork ${t("walletTopUp.description")}`,
  //   paymentMethod: "Credit / Debit / Apple Pay",
  //   fee: "0.62% to 2.9%",
  //   limit: "5,000€/purchase, 20,000€/mo",
  //   logo: (darkMode) => {
  //     return darkMode ? RampLogoLight : RampLogo;
  //   },
  //   validCryptocurrencies: [
  //     {
  //       value: "SOL",
  //       label: "SOL",
  //       symbol: "SOLANA_SOL",
  //     },
  //     {
  //       value: "USDT",
  //       label: "USDT",
  //       symbol: "SOLANA_USDT",
  //     },
  //     {
  //       value: "KIN",
  //       label: "KIN",
  //       symbol: "SOLANA_KIN",
  //     },
  //     {
  //       value: "USDC",
  //       label: "USDC",
  //       symbol: "SOLANA_USDC",
  //     },
  //   ],
  //   validCurrencies: ["USD", "EUR", "GBP", "PLN"].map((k) => {
  //     return { value: k, label: k };
  //   }),
  // },
  [TOPUP.MOONPAY]: {
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
      {
        value: "USDC (SOL)",
        label: "USDC (SOL)",
        symbol: "usdc_sol",
      },
    ],
    validCurrencies: ["USD", "EUR", "GBP"].map((k) => {
      return { value: k, label: k };
    }),
  },
};

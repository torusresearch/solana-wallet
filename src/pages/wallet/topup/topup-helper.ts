import RampLogo from "@/assets/rampnetwork-logo.svg";
import RampLogoLight from "@/assets/rampnetwork-logo-white.svg";
import { app } from "@/modules/app";
import { RAMPNETWORK } from "@/utils/enums";

export const topupProviders = {
  [RAMPNETWORK]: {
    name: "Ramp",
    description:
      "Rampnetwork is a secure way to buy cryptocurrency with your payment method. Start by entering an amount below to get a quote before making a purchase.",
    paymentMethod: "Credit / Debit / Apple Pay",
    fee: "0.62% to 2.9%",
    limit: "5,000€/purchase, 20,000€/mo",
    logo: () => {
      return app.value.isDarkMode ? RampLogoLight : RampLogo;
    },
    validCryptocurrencies: [
      {
        value: "SOL",
        label: "SOL",
        ramp_symbol: "SOLANA_SOL",
      },
      {
        value: "USDT",
        label: "USDT",
        ramp_symbol: "SOLANA_USDT",
      },
      {
        value: "KIN",
        label: "KIN",
        ramp_symbol: "SOLANA_KIN",
      },
      {
        value: "USDC",
        label: "USDC",
        ramp_symbol: "SOLANA_USDC",
      },
    ],
    validCurrencies: ["USD", "EUR", "GBP", "PLN"].map((k) => {
      return { value: k, label: k };
    }),
  },
};

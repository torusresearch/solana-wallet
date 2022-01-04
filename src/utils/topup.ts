import RampLogo from "@/assets/rampnetwork-logo.svg";
import RampLogoLight from "@/assets/rampnetwork-logo-white.svg";
import { app } from "@/modules/app";
import i18n from "@/plugins/i18nPlugin";
import { RAMPNETWORK } from "@/utils/enums";

const { t } = i18n.global;

export type TopupProvider = {
  name: string;
  description: string;
  paymentMethod: string;
  fee: string;
  limit: string;
  logo: () => string;
  validCryptocurrencies: { value: string; label: string; ramp_symbol: string }[];
  validCurrencies: { value: string; label: string }[];
};

export const TopupProviders: { [providerName: string]: TopupProvider } = {
  [RAMPNETWORK]: {
    name: "Ramp",
    description: `Rampnetwork ${t("walletTopUp.description")}`,
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

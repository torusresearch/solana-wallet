import MoonpayLogo from "@/assets/moonpay-logo.svg";
import MoonpayLogoLight from "@/assets/moonpay-logo-white.svg";
import RampLogo from "@/assets/rampnetwork-logo.svg";
import RampLogoLight from "@/assets/rampnetwork-logo-white.svg";

export const getMoonPayLogo = (darkMode = true) => {
  return darkMode ? MoonpayLogoLight : MoonpayLogo;
};

export const getRampLogo = (darkMode = true) => {
  return darkMode ? RampLogoLight : RampLogo;
};

export const getTopupProviderLogo = (name: string, darkMode = true) => {
  return name === "moonpay" ? getMoonPayLogo(darkMode) : getRampLogo(darkMode);
};

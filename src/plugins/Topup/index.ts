import { TOPUP, TopUpProvider } from "./interface";
import moonpay from "./moonpay";
import ramp from "./ramp";
import transak from "./transak";

export const activeProvider = [TOPUP.MOONPAY, TOPUP.TRANSAK];
// export const activeProvider = [TOPUP.MOONPAY, TOPUP.RAMPNETWORK, TOPUP.TRANSK];

export const topupPlugin = {
  [TOPUP.RAMPNETWORK]: ramp,
  [TOPUP.MOONPAY]: moonpay,
  [TOPUP.TRANSAK]: transak,
} as { [k: string]: TopUpProvider };

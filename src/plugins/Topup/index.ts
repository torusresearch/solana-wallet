import { TOPUP, TopUpProvider } from "./interface";
import moonpay from "./moonpay";
import ramp from "./ramp";

export const activeProvider = [TOPUP.MOONPAY];
// export const activeProvider = [TOPUP.MOONPAY, TOPUP.RAMPNETWORK];

export const topupPlugin = {
  [TOPUP.RAMPNETWORK]: ramp,
  [TOPUP.MOONPAY]: moonpay,
} as { [k: string]: TopUpProvider };

import { TOPUP, TopUpProvider } from "./interface";
import moonpay from "./moonpay";
import ramp from "./ramp";
// import transk from "./transk";

export const activeProvider = [TOPUP.MOONPAY];
// export const activeProvider = [TOPUP.MOONPAY, TOPUP.RAMPNETWORK, TOPUP.TRANSK];

export const topupPlugin = {
  [TOPUP.RAMPNETWORK]: ramp,
  [TOPUP.MOONPAY]: moonpay,
  // [TOPUP.TRANSK]: transk,
} as { [k: string]: TopUpProvider };

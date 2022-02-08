import { PaymentParams } from "@toruslabs/base-controllers";

import { TOPUP } from "../../utils/topup";
import moonpay from "./moonpay";
import ramp from "./ramp";

interface TopUp {
  orderUrl: (
    state: { selectedAddress: string; email: string },
    params: PaymentParams,
    instanceId: string,
    redirectFlow?: boolean,
    redirectURL?: string
  ) => Promise<URL>;
}

export default {
  [TOPUP.RAMPNETWORK]: ramp,
  [TOPUP.MOONPAY]: moonpay,
} as { [k: string]: TopUp };

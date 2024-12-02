import { broadcastChannelOptions } from "@toruslabs/base-controllers";
import { MethodType } from "@toruslabs/broadcast-channel";

(
  broadcastChannelOptions as {
    type?: MethodType;
    webWorkerSupport: boolean;
  }
).type = undefined;

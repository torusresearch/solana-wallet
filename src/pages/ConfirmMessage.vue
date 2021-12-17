<script setup lang="ts">
import { BROADCAST_CHANNELS, BroadcastChannelHandler, broadcastChannelOptions, POPUP_RESULT } from "@toruslabs/base-controllers";
import { BroadcastChannel } from "broadcast-channel";
import log from "loglevel";
import { onMounted, reactive } from "vue";

import Permissions from "@/components/permissions/Permissions.vue";
import { SignMessageChannelDataType } from "@/utils/enums";

import ControllerModule from "../modules/controllers";
import { checkRedirectFlow, getB64DecodedParams, redirectToResult } from "../utils/helpers";

const channel = `${BROADCAST_CHANNELS.TRANSACTION_CHANNEL}_${new URLSearchParams(window.location.search).get("instanceId")}`;
const isRedirectFlow = checkRedirectFlow();
const params = getB64DecodedParams();
if (Object.keys(params).length) params.data = Uint8Array.from(Object.values(params.data));
const queryParams = new URLSearchParams(window.location.search);
const method = queryParams.get("method");
const resolveRoute = queryParams.get("resolveRoute");

interface MsgData {
  origin: string;
  data?: Uint8Array;
  message: string;
}
const msg_data = reactive<MsgData>({
  origin: "",
  message: "",
});

onMounted(async () => {
  let channel_msg: SignMessageChannelDataType;
  try {
    if (!isRedirectFlow) {
      const bcHandler = new BroadcastChannelHandler(BROADCAST_CHANNELS.TRANSACTION_CHANNEL);
      channel_msg = await bcHandler.getMessageFromChannel<SignMessageChannelDataType>();
    } else if (params.data) channel_msg = ControllerModule.torus.getMessageData("sign_message", params);
    else throw new Error("Incorrect Params");
    msg_data.data = Buffer.from(channel_msg.data || "", "hex");
    msg_data.message = channel_msg.message || "";
    msg_data.origin = channel_msg.origin;
  } catch (error) {
    log.error("error in tx", error);
  }
});

const approveTxn = async (): Promise<void> => {
  if (!isRedirectFlow) {
    const bc = new BroadcastChannel(channel, broadcastChannelOptions);
    await bc.postMessage({
      data: { type: POPUP_RESULT, approve: true },
    });
    bc.close();
  } else {
    const res = await ControllerModule.torus.signMessage({ params, method: "sign_message" }, true);
    redirectToResult(method, res, resolveRoute);
  }
};
const rejectTxn = async () => {
  if (!isRedirectFlow) {
    const bc = new BroadcastChannel(channel, broadcastChannelOptions);
    await bc.postMessage({ data: { type: POPUP_RESULT, approve: false } });
    bc.close();
  } else {
    redirectToResult(method, { success: false }, resolveRoute);
  }
};
</script>

<template>
  <Permissions :requested-from="msg_data.origin" :approval-message="msg_data.message" @on-approved="approveTxn" @on-close-modal="rejectTxn" />
</template>

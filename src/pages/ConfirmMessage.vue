<script setup lang="ts">
import { BROADCAST_CHANNELS, BroadcastChannelHandler, broadcastChannelOptions, POPUP_RESULT } from "@toruslabs/base-controllers";
import { BroadcastChannel } from "broadcast-channel";
import log from "loglevel";
import { onMounted, reactive } from "vue";

import Permissions from "@/components/permissions/Permissions.vue";
import { SignMessageChannelDataType } from "@/utils/enums";

import ControllerModule from "../modules/controllers";
import { redirectToResult, useRedirectFlow } from "../utils/helpers";

const { isRedirectFlow, params, method, resolveRoute } = useRedirectFlow();

const channel = `${BROADCAST_CHANNELS.TRANSACTION_CHANNEL}_${new URLSearchParams(window.location.search).get("instanceId")}`;

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
  log.info(params);
  if (Object.keys(params).length) params.data = Uint8Array.from(Object.values(params.data));
  let channel_msg: Partial<SignMessageChannelDataType>;
  try {
    if (!isRedirectFlow) {
      const bcHandler = new BroadcastChannelHandler(BROADCAST_CHANNELS.TRANSACTION_CHANNEL);
      channel_msg = await bcHandler.getMessageFromChannel<SignMessageChannelDataType>();
    } else if (params.data)
      channel_msg = {
        data: Buffer.from(params?.data || []).toString("hex"),
        message: Buffer.from(params?.data || []).toString(),
        origin: window.location.origin,
      };
    else {
      redirectToResult(method, { message: "Incorrect Params" }, resolveRoute);
      return;
    }
    msg_data.data = Buffer.from(channel_msg.data as string, "hex");
    msg_data.message = (channel_msg.message as string) || "";
    msg_data.origin = channel_msg.origin as string;
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

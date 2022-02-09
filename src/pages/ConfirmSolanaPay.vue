<script setup lang="ts">
import { BROADCAST_CHANNELS, BroadcastChannelHandler, broadcastChannelOptions, POPUP_RESULT } from "@toruslabs/base-controllers";
import { BroadcastChannel } from "broadcast-channel";
import log from "loglevel";
import { onMounted, ref } from "vue";

import { TransactionChannelDataType } from "@/utils/enums";

import ControllerModule from "../modules/controllers";
import { redirectToResult, useRedirectFlow } from "../utils/redirectflow_helpers";

const { isRedirectFlow, params, method, resolveRoute } = useRedirectFlow();

const channel = `${BROADCAST_CHANNELS.TRANSACTION_CHANNEL}_${new URLSearchParams(window.location.search).get("instanceId")}`;

const requestLink = ref("");
const origin = ref("");
onMounted(async () => {
  if (Object.keys(params).length) params.data = Uint8Array.from(Object.values(params?.data));
  let channel_msg: Partial<TransactionChannelDataType>;
  try {
    if (!isRedirectFlow) {
      const bcHandler = new BroadcastChannelHandler(BROADCAST_CHANNELS.TRANSACTION_CHANNEL);
      channel_msg = await bcHandler.getMessageFromChannel<TransactionChannelDataType>();
    } else if (params?.data)
      channel_msg = {
        message: Buffer.from(params?.data || []).toString(),
        origin: window.location.origin,
      };
    else {
      redirectToResult(method, { message: "Invalid or Missing Params!" }, resolveRoute);
      return;
    }
    requestLink.value = channel_msg.message as string;
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
  <SolanaPay :requested-from="origin" :request-link="requestLink" @on-approved="approveTxn" @on-close-modal="rejectTxn" />
</template>

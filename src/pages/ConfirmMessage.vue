<script setup lang="ts">
import { BROADCAST_CHANNELS, BroadcastChannelHandler, broadcastChannelOptions, POPUP_RESULT } from "@toruslabs/base-controllers";
import { BroadcastChannel } from "broadcast-channel";
import log from "loglevel";
import { onMounted, reactive } from "vue";

import Permissions from "@/components/permissions/Permissions.vue";
import { SignMessageChannelDataType } from "@/utils/enums";
const channel = `${BROADCAST_CHANNELS.TRANSACTION_CHANNEL}_${new URLSearchParams(window.location.search).get("instanceId")}`;

interface MsgData {
  origin: string;
  data?: Uint8Array;
  message: string;
}
let msg_data = reactive<MsgData>({
  origin: "",
  message: "",
});

onMounted(async () => {
  try {
    const bcHandler = new BroadcastChannelHandler(BROADCAST_CHANNELS.TRANSACTION_CHANNEL);
    const channel_msg = await bcHandler.getMessageFromChannel<SignMessageChannelDataType>();
    msg_data.data = Buffer.from(channel_msg.data || "", "hex");
    msg_data.message = channel_msg.message || "";
    msg_data.origin = channel_msg.origin;
  } catch (error) {
    log.error("error in tx", error);
  }
});

const approveTxn = async (): Promise<void> => {
  const bc = new BroadcastChannel(channel, broadcastChannelOptions);
  await bc.postMessage({
    data: { type: POPUP_RESULT, approve: true },
  });
  bc.close();
};
const rejectTxn = async () => {
  const bc = new BroadcastChannel(channel, broadcastChannelOptions);
  await bc.postMessage({ data: { type: POPUP_RESULT, approve: false } });
  bc.close();
};
</script>

<template>
  <Permissions :requested-from="msg_data.origin" :approval-message="msg_data.message" @on-approved="approveTxn" @on-close-modal="rejectTxn" />
</template>

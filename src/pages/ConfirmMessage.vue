<script setup lang="ts">
import { BROADCAST_CHANNELS, BroadcastChannelHandler, broadcastChannelOptions, POPUP_RESULT } from "@toruslabs/base-controllers";
import { BroadcastChannel } from "@toruslabs/broadcast-channel";
import log from "loglevel";
import { onErrorCaptured, onMounted, reactive, ref } from "vue";

import FullDivLoader from "@/components/FullDivLoader.vue";
import Permissions from "@/components/permissions/Permissions.vue";
import { SignMessageChannelDataType } from "@/utils/enums";
import { openCrispChat } from "@/utils/helpers";

const channel = `${BROADCAST_CHANNELS.TRANSACTION_CHANNEL}_${new URLSearchParams(window.location.search).get("instanceId")}`;
const loading = ref(true);

interface MsgData {
  origin: string;
  data?: Uint8Array;
  message: string;
}
const msg_data = reactive<MsgData>({
  origin: "",
  message: "",
});
onErrorCaptured(() => {
  openCrispChat();
});

onMounted(async () => {
  let channel_msg: Partial<SignMessageChannelDataType>;
  try {
    const bcHandler = new BroadcastChannelHandler(BROADCAST_CHANNELS.TRANSACTION_CHANNEL);
    channel_msg = await bcHandler.getMessageFromChannel<SignMessageChannelDataType>();

    // TODO: add support to sign array of messages
    msg_data.data = Buffer.from(channel_msg.data as string, "hex");
    msg_data.message = (channel_msg.message as string) || "";
    msg_data.origin = channel_msg.origin as string;
    loading.value = false;
  } catch (error) {
    log.error(error, "error in tx");
    openCrispChat();
  }
});

const approveTxn = async (): Promise<void> => {
  loading.value = true;
  const bc = new BroadcastChannel(channel, broadcastChannelOptions);
  await bc.postMessage({
    data: { type: POPUP_RESULT, approve: true },
  });
  bc.close();
};

const closeModal = async () => {
  loading.value = true;
  const bc = new BroadcastChannel(channel, broadcastChannelOptions);
  await bc.postMessage({ data: { type: POPUP_RESULT, approve: false } });
  bc.close();
};

const rejectTxn = async () => {
  closeModal();
};
</script>

<template>
  <FullDivLoader v-if="loading" />
  <Permissions v-else :requested-from="msg_data.origin" :approval-message="msg_data.message" @on-approved="approveTxn" @on-rejected="rejectTxn" />
</template>

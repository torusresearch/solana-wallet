<script setup lang="ts">
import { BROADCAST_CHANNELS, BroadcastChannelHandler, broadcastChannelOptions, POPUP_RESULT, PopupWhitelabelData } from "@toruslabs/base-controllers";
import { BroadcastChannel } from "@toruslabs/broadcast-channel";
import Loader from "@toruslabs/vue-components/common/Loader.vue";
import { onErrorCaptured, onMounted, reactive, ref } from "vue";

import ProviderChangeComponent from "@/components/providerChange/ProviderChange.vue";
import { openCrispChat } from "@/utils/helpers";

import { ProviderChangeChannelEventData } from "../utils/interfaces";

const channel = `${BROADCAST_CHANNELS.PROVIDER_CHANGE_CHANNEL}_${new URLSearchParams(window.location.search).get("instanceId")}`;
const loading = ref(true);

interface FinalTxData {
  origin: string;
  toNetwork: string;
  fromNetwork: string;
  whitelabelData: PopupWhitelabelData;
}

const finalProviderData = reactive<FinalTxData>({
  origin: "",
  toNetwork: "",
  fromNetwork: "",
  whitelabelData: {
    theme: "light",
  },
});

onErrorCaptured(() => {
  openCrispChat();
});

onMounted(async () => {
  const bcHandler = new BroadcastChannelHandler(BROADCAST_CHANNELS.PROVIDER_CHANGE_CHANNEL);
  const providerData = await bcHandler.getMessageFromChannel<ProviderChangeChannelEventData>();
  finalProviderData.origin = providerData.origin;
  finalProviderData.toNetwork = providerData.newNetwork.displayName;
  finalProviderData.fromNetwork = providerData.currentNetwork;
  finalProviderData.whitelabelData = providerData.whitelabelData;
  loading.value = false;
});

const approveProviderChange = async (): Promise<void> => {
  loading.value = true;
  const bc = new BroadcastChannel(channel, broadcastChannelOptions);
  await bc.postMessage({
    data: { type: POPUP_RESULT, approve: true },
  });
  bc.close();
};

const denyProviderChange = async () => {
  loading.value = true;
  const bc = new BroadcastChannel(channel, broadcastChannelOptions);
  await bc.postMessage({ data: { type: POPUP_RESULT, approve: false } });
  bc.close();
};
</script>

<template>
  <div v-if="loading" class="w-full h-full overflow-hidden bg-white dark:bg-app-gray-800 flex flex-col justify-center items-center">
    <Loader :use-spinner="true" />
  </div>
  <ProviderChangeComponent
    v-else
    :origin="finalProviderData.origin"
    :to-network="finalProviderData.toNetwork"
    :from-network="finalProviderData.fromNetwork"
    @approve-provider-change="approveProviderChange"
    @deny-provider-change="denyProviderChange"
  />
</template>

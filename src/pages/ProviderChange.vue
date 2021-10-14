<script setup lang="ts">
import { BROADCAST_CHANNELS, BroadcastChannelHandler, broadcastChannelOptions, POPUP_RESULT } from "@toruslabs/base-controllers";
import { ProviderChangeChannelEventData } from "@toruslabs/solana-controllers";
import Button from "@toruslabs/vue-components/common/Button.vue";
import { BroadcastChannel } from "broadcast-channel";
import log from "loglevel";
import { onMounted } from "vue";

import CasperLogoURL from "@/assets/casper.svg";
import CasperLightLogoURL from "@/assets/casper-light.svg";
// import { TextField } from "@/components/common";
import ControllersModule from "@/modules/controllers";
// let providerData = reactive<ProviderChangeChannelEventData>({} as ProviderChangeChannelEventData);

const channel = `${BROADCAST_CHANNELS.PROVIDER_CHANGE_CHANNEL}_${new URLSearchParams(window.location.search).get("instanceId")}`;

onMounted(async () => {
  const bcHandler = new BroadcastChannelHandler(BROADCAST_CHANNELS.PROVIDER_CHANGE_CHANNEL);
  const providerData = await bcHandler.getMessageFromChannel<ProviderChangeChannelEventData>();
  log.debug("provider data", providerData);
});
const approveProviderChange = async (): Promise<void> => {
  const bc = new BroadcastChannel(channel, broadcastChannelOptions);
  await bc.postMessage({
    data: { type: POPUP_RESULT, approve: true },
  });
  bc.close();
};
const denyProviderChange = async () => {
  const bc = new BroadcastChannel(channel, broadcastChannelOptions);
  await bc.postMessage({ data: { type: POPUP_RESULT, approve: false } });
  bc.close();
};
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-app-gray-700 flex justify-center items-center">
    <div class="items-center">
      <div class="shadow dark:shadow-dark text-center py-6">
        <div><img class="h-7 mx-auto w-auto mb-1" :src="ControllersModule.isDarkMode ? CasperLightLogoURL : CasperLogoURL" alt="Casper Logo" /></div>
        <div class="font-header text-lg font-bold text-app-text-500 dark:text-app-text-dark-500">Confirm Permissions</div>
      </div>
      <div class="p-5">
        <div>
          <div class="grid grid-cols-3 items-center mb-4">
            <div class="col-span-3 font-body text-xs text-app-text-600 dark:text-app-text-dark-500">Requested From:</div>
            <!-- <div class="col-span-3"><TextField v-model="sendAmount" type="text" :disabled="true" /></div> -->
          </div>
          <div class="grid grid-cols-3 items-center mb-4">
            <div class="col-span-3 font-body text-xs text-app-text-600 dark:text-app-text-dark-500">Current Network:</div>
            <!-- <div class="col-span-3"><TextField v-model="transactionFee" type="text" :disabled="true" /></div> -->
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 m-6">
        <div><Button class="ml-auto" block variant="tertiary" @click="denyProviderChange()">Cancel</Button></div>
        <div><Button class="ml-auto" block variant="primary" @click="approveProviderChange()">Confirm</Button></div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  BROADCAST_CHANNELS,
  BroadcastChannelHandler,
  broadcastChannelOptions,
  POPUP_RESULT,
  PopupWhitelabelData,
  ProviderConfig,
} from "@toruslabs/base-controllers";
import { ProviderChangeChannelEventData } from "@toruslabs/solana-controllers";
import Button from "@toruslabs/vue-components/common/Button.vue";
import { BroadcastChannel } from "broadcast-channel";
import { onMounted, reactive } from "vue";
import { useI18n } from "vue-i18n";

import SolanaLogoURL from "@/assets/solana-mascot.svg";
import ControllerModule from "@/modules/controllers";

import { redirectToResult, useRedirectFlow } from "../utils/redirectflow_helpers";

const { params, isRedirectFlow, req_id, resolveRoute, method, jsonrpc } = useRedirectFlow({
  blockExplorerUrl: "?cluster=mainnet",
  chainId: "0x1",
  displayName: "Solana Mainnet",
  logo: "solana.svg",
  rpcTarget: "https://api.mainnet-beta.solana.com",
  ticker: "SOL",
  tickerName: "Solana Token",
});

const { t } = useI18n();

const channel = `${BROADCAST_CHANNELS.PROVIDER_CHANGE_CHANNEL}_${new URLSearchParams(window.location.search).get("instanceId")}`;

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

onMounted(async () => {
  if (!isRedirectFlow) {
    const bcHandler = new BroadcastChannelHandler(BROADCAST_CHANNELS.PROVIDER_CHANGE_CHANNEL);
    const providerData = await bcHandler.getMessageFromChannel<ProviderChangeChannelEventData>();
    finalProviderData.origin = providerData.origin;
    finalProviderData.toNetwork = providerData.newNetwork.displayName;
    finalProviderData.fromNetwork = providerData.currentNetwork;
    finalProviderData.whitelabelData = providerData.whitelabelData;
  } else {
    finalProviderData.toNetwork = params.displayName;
    finalProviderData.fromNetwork = ControllerModule.torus.currentNetworkName;
  }
});
const approveProviderChange = async (): Promise<void> => {
  if (!isRedirectFlow) {
    const bc = new BroadcastChannel(channel, broadcastChannelOptions);
    await bc.postMessage({
      data: { type: POPUP_RESULT, approve: true },
    });
    bc.close();
  } else {
    ControllerModule.torus.setNetwork(params as ProviderConfig);
    redirectToResult(jsonrpc, { success: true, method }, req_id, resolveRoute);
  }
};
const denyProviderChange = async () => {
  if (!isRedirectFlow) {
    const bc = new BroadcastChannel(channel, broadcastChannelOptions);
    await bc.postMessage({ data: { type: POPUP_RESULT, approve: false } });
    bc.close();
  } else {
    redirectToResult(jsonrpc, { success: false, method }, req_id, resolveRoute);
  }
};
</script>

<template>
  <div class="h-full w-full bg-white dark:bg-app-gray-600 flex justify-center items-center" :class="{ dark: ControllerModule.isDarkMode }">
    <div class="content-box w-full h-full transition-all bg-white dark:bg-app-gray-800 shadow-xl flex flex-col relative">
      <div class="shadow dark:shadow-dark bg-white dark:bg-app-gray-700 text-center py-6 flex flex-row justify-start items-center px-4" tabindex="0">
        <img class="h-7 mx-auto w-auto mb-1 absolute left-5" :src="SolanaLogoURL" alt="Solana Logo" />
        <div class="font-header w-full text-lg font-bold text-app-text-600 dark:text-app-text-dark-500 title-box">
          {{ `${t("dappTransfer.confirm")} ${t("dappTransfer.permission")}` }}
        </div>
      </div>
      <div class="p-5">
        <div>
          <div class="text-lg mb-5 text-app-text-500 dark:text-app-text-500 font-semibold text-center">
            {{ t("dappPermission.allow") }} <strong class="dark:text-white">{{ finalProviderData.origin }}</strong>
            {{ t("dappPermission.changeNetwork", { network: finalProviderData.toNetwork }) }}
          </div>
          <!-- <div class="grid grid-cols-3 items-center mb-4">
            <div class="col-span-3 text-xs text-app-text-600 dark:text-app-text-dark-500">Requested From:</div>
          </div> -->
          <div class="grid grid-cols-3 items-center mb-4">
            <div class="col-span-3 text-xs text-app-text-600 dark:text-app-text-dark-500 mb-2">
              {{ `${t("dappPermission.currentNetwork")}:` }}
            </div>
            <div class="col-span-3">
              <div class="w-full flex flex-row justify-between items-center bg-white dark:bg-app-gray-700 h-12 px-5 mt-3 rounded-md">
                <span class="text-sm font-body text-app-text-600 dark:text-white">{{ finalProviderData.fromNetwork }}</span>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-3 items-center mb-4">
            <div class="col-span-3 font-body text-xs text-app-text-600 dark:text-app-text-dark-500 mb-2">{{ t("dappPermission.requestNew") }}</div>
            <div class="col-span-3">
              <div class="w-full flex flex-row justify-between items-center bg-white dark:bg-app-gray-700 h-12 px-5 mt-3 rounded-md">
                <span class="text-sm font-body text-app-text-600 dark:text-white">{{ finalProviderData.toNetwork }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="spacer"></div>
      <div class="grid grid-cols-2 gap-3 m-6 rounded-md my-8">
        <div>
          <Button class="ml-auto" :block="true" variant="tertiary" @click="denyProviderChange()">{{ t("dappProvider.cancel") }}</Button>
        </div>
        <div>
          <Button class="ml-auto" :block="true" variant="primary" @click="approveProviderChange()">{{ t("dappProvider.confirm") }}</Button>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
@screen gt-xs {
  .content-box {
    max-width: 400px;
    max-height: 600px;
  }
}
.spacer {
  flex: 1 1 auto;
}
</style>

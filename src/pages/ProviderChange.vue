<script setup lang="ts">
import {
  BROADCAST_CHANNELS,
  BroadcastChannelHandler,
  broadcastChannelOptions,
  POPUP_RESULT,
  PopupWhitelabelData,
  ProviderConfig,
} from "@toruslabs/base-controllers";
import { BroadcastChannel } from "@toruslabs/broadcast-channel";
import { ProviderChangeChannelEventData } from "@toruslabs/solana-controllers";
import Button from "@toruslabs/vue-components/common/Button.vue";
import { onMounted, reactive } from "vue";
import { useI18n } from "vue-i18n";

import SolanaLogoURL from "@/assets/solana-mascot.svg";
import { TextField } from "@/components/common";
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
    finalProviderData.fromNetwork = ControllerModule.selectedNetworkDisplayName;
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
  <div class="h-full w-full bg-white dark:bg-app-gray-700 flex justify-center items-center">
    <div class="content-box h-full bg-white dark:bg-app-gray-700 flex flex-col justify-between shadow dark:shadow-dark">
      <div class="shadow w-full dark:shadow-dark text-center py-6 relative" tabindex="0">
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
            <div class="col-span-3"><TextField v-model="finalProviderData.fromNetwork" type="text" :disabled="true" /></div>
          </div>
          <div class="grid grid-cols-3 items-center mb-4">
            <div class="col-span-3 text-xs text-app-text-600 dark:text-app-text-dark-500 mb-2">{{ t("dappPermission.requestNew") }}</div>
            <div class="col-span-3"><TextField v-model="finalProviderData.toNetwork" type="text" :disabled="true" /></div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 m-6">
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
</style>

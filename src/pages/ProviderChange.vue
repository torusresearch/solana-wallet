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
// import log from "loglevel";
import { useI18n } from "vue-i18n";

import SolanaLightLogoURL from "@/assets/solana-light.svg";
import SolanaLogoURL from "@/assets/solana-mascot.svg";
import { TextField } from "@/components/common";
import ControllerModule from "@/modules/controllers";

import { redirectToResult, useRedirectFlow } from "../utils/helpers";

const { params, isRedirectFlow, method, resolveRoute } = useRedirectFlow({
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
    ControllerModule.torus.setNetwork(params as unknown as ProviderConfig);
    // redirect with result true to deeplink and close
    redirectToResult(method, { success: true }, resolveRoute);
  }
};
const denyProviderChange = async () => {
  if (!isRedirectFlow) {
    const bc = new BroadcastChannel(channel, broadcastChannelOptions);
    await bc.postMessage({ data: { type: POPUP_RESULT, approve: false } });
    bc.close();
  } else {
    // redirect with result false to deeplink and close
    redirectToResult(method, { success: false }, resolveRoute);
  }
};
</script>

<template>
  <div class="min-h-full bg-white dark:bg-app-gray-700 flex justify-center items-center">
    <div class="items-center">
      <div class="shadow dark:shadow-dark text-center py-6">
        <div>
          <img class="h-7 mx-auto w-auto mb-1" :src="ControllerModule.isDarkMode ? SolanaLightLogoURL : SolanaLogoURL" alt="Solana Logo" />
        </div>
        <div class="font-header text-lg font-bold text-app-text-500 dark:text-app-text-dark-500">
          {{ `${t("dappTransfer.confirm")} ${t("dappTransfer.permission")}` }}
        </div>
      </div>
      <div class="p-5">
        <div>
          <div class="text-lg mb-5 text-app-text-500 dark:text-app-text-500 font-semibold text-center">
            {{ t("dappPermission.allow") }} <strong class="text-white">{{ finalProviderData.origin }}</strong>
            {{ t("dappPermission.changeNetwork", { network: finalProviderData.toNetwork }) }}
          </div>
          <!-- <div class="grid grid-cols-3 items-center mb-4">
            <div class="col-span-3 font-body text-xs text-app-text-600 dark:text-app-text-dark-500">Requested From:</div>
          </div> -->
          <div class="grid grid-cols-3 items-center mb-4">
            <div class="col-span-3 font-body text-xs text-app-text-600 dark:text-app-text-dark-500">
              {{ `${t("dappPermission.currentNetwork")}:` }}
            </div>
            <div class="col-span-3"><TextField v-model="finalProviderData.fromNetwork" type="text" :disabled="true" /></div>
          </div>
          <div class="grid grid-cols-3 items-center mb-4">
            <div class="col-span-3 font-body text-xs text-app-text-600 dark:text-app-text-dark-500">{{ t("dappPermission.requestNew") }}</div>
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

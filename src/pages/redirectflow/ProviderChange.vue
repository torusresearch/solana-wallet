<script setup lang="ts">
import { PopupWhitelabelData, ProviderConfig } from "@toruslabs/base-controllers";
import { computed, onMounted, reactive, watch } from "vue";

import ProviderChange1 from "@/components/providerChange/ProviderChange.vue";
import ControllerModule from "@/modules/controllers";
import { WALLET_SUPPORTED_NETWORKS } from "@/utils/const";

import { redirectToResult, useRedirectFlow } from "../../utils/redirectflow_helpers";

const { params, req_id, resolveRoute, method, jsonrpc } = useRedirectFlow(WALLET_SUPPORTED_NETWORKS.mainnet);

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
  finalProviderData.toNetwork = params.displayName;
  finalProviderData.fromNetwork = ControllerModule.torus.currentNetworkName;
});
const currentNetwork = computed(() => ControllerModule.selectedNetworkDisplayName);
watch(currentNetwork, () => {
  if (currentNetwork.value === (params as ProviderConfig).displayName) redirectToResult(jsonrpc, { success: true, method }, req_id, resolveRoute);
});
const approveProviderChange = async (): Promise<void> => {
  ControllerModule.torus.setNetwork(params as ProviderConfig);
  setTimeout(() => redirectToResult(jsonrpc, { success: false, method }, req_id, resolveRoute), 5000);
};
const denyProviderChange = async () => {
  redirectToResult(jsonrpc, { success: false, method }, req_id, resolveRoute);
};
</script>

<template>
  <ProviderChange1
    :origin="finalProviderData.origin"
    :to-network="finalProviderData.toNetwork"
    :from-network="finalProviderData.fromNetwork"
    @approve-provider-change="approveProviderChange"
    @deny-provider-change="denyProviderChange"
  />
</template>
<style scoped>
@screen gt-xs {
  .content-box {
    max-width: 400px;
    max-height: 600px;
  }
}
</style>

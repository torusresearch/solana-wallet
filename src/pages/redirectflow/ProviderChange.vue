<script setup lang="ts">
import { PopupWhitelabelData, ProviderConfig } from "@toruslabs/base-controllers";
import { computed, onMounted, reactive, ref, watch } from "vue";

import FullDivLoader from "@/components/FullDivLoader.vue";
import ProviderChangeComponent from "@/components/providerChange/ProviderChange.vue";
import ControllerModule from "@/modules/controllers";

import { redirectToResult, useRedirectFlow } from "../../utils/redirectflowHelpers";

const { params, req_id, resolveRoute, method, jsonrpc } = useRedirectFlow();
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

onMounted(async () => {
  finalProviderData.toNetwork = params.displayName;
  finalProviderData.fromNetwork = ControllerModule.torus.currentNetworkName;
  loading.value = false;
});
const currentNetwork = computed(() => ControllerModule.selectedNetworkDisplayName);
watch(currentNetwork, () => {
  if (currentNetwork.value === (params as ProviderConfig).displayName) redirectToResult(jsonrpc, { success: true, method }, req_id, resolveRoute);
});
const approveProviderChange = async (): Promise<void> => {
  loading.value = true;
  ControllerModule.torus.setNetwork(params as ProviderConfig);
  setTimeout(() => redirectToResult(jsonrpc, { success: false, method }, req_id, resolveRoute), 5000);
};
const denyProviderChange = async () => {
  loading.value = true;
  redirectToResult(jsonrpc, { success: false, method }, req_id, resolveRoute);
};
</script>

<template>
  <FullDivLoader v-if="loading" />
  <ProviderChangeComponent
    v-else
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

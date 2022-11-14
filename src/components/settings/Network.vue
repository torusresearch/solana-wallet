<script setup lang="ts">
import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";

import { SelectField } from "@/components/common";
import { SettingsPageInteractions, trackUserClick } from "@/directives/google-analytics";
import { addToast } from "@/modules/app";
import ControllerModule from "@/modules/controllers";

import { WALLET_SUPPORTED_NETWORKS } from "../../utils/const";

const { t } = useI18n();
const networks = Object.keys(WALLET_SUPPORTED_NETWORKS).map((key) => {
  const value = WALLET_SUPPORTED_NETWORKS[key as keyof typeof WALLET_SUPPORTED_NETWORKS];
  return {
    label: value.displayName,
    value: value.chainId,
  };
});
const selectedNetwork = computed({
  get: () => networks.find((it) => it.value === ControllerModule.torus.chainId),
  set: (value) => {
    trackUserClick(SettingsPageInteractions.NETWORK + (value?.value || ""));
    if (value) ControllerModule.setNetwork(value.value);
  },
});

const chainId = computed(() => ControllerModule.torus.chainId);

watch(chainId, () => {
  if (ControllerModule.torus.chainId === "loading") {
    addToast({ message: "Network Error! - Fallback to Devnet", type: "error" });
    if (ControllerModule.torus.state.NetworkControllerState.providerConfig.chainId !== WALLET_SUPPORTED_NETWORKS.devnet.chainId) {
      ControllerModule.setNetwork(WALLET_SUPPORTED_NETWORKS.devnet.chainId);
    }
  }
});
</script>
<template>
  <div class="pb-4">
    <div class="mb-4">
      <SelectField
        v-if="selectedNetwork"
        v-model="selectedNetwork"
        :label="t('walletSettings.selectNetwork')"
        :items="networks.slice(0, networks.length - 1)"
      />
      <div v-else class="block text-sm text-app-text-600 dark:text-app-text-dark-500 mb-16">
        {{ `${t("walletActivity.loading")} ${t("walletActivity.network")}...` }}
      </div>
    </div>
  </div>
</template>

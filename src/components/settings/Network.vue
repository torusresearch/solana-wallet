<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { SelectField } from "@/components/common";
import { SettingsPageInteractions, trackUserClick } from "@/directives/google-analytics";
import ControllerModule from "@/modules/controllers";

import { WALLET_SUPPORTED_NETWORKS } from "../../utils/network";

const { t } = useI18n();
const networks = Object.keys(WALLET_SUPPORTED_NETWORKS)
  .sort((a, b) => Number(WALLET_SUPPORTED_NETWORKS[a].chainId) - Number(WALLET_SUPPORTED_NETWORKS[b].chainId))
  .map((key) => {
    const value = WALLET_SUPPORTED_NETWORKS[key as keyof typeof WALLET_SUPPORTED_NETWORKS];
    return {
      label: value.displayName,
      value: value.rpcTarget,
    };
  });
const rpcDown = computed(() => {
  return ControllerModule.torus.rpcDownAt;
});
const selectedNetwork = computed({
  get: () => networks.find((it) => it.value === ControllerModule.torus.currentProviderConfig.rpcTarget),
  set: (value) => {
    trackUserClick(SettingsPageInteractions.NETWORK + (value?.value || ""));
    if (value) ControllerModule.setNetwork(value.value);
  },
});
</script>
<template>
  <div class="pb-4">
    <div class="mb-4">
      <SelectField v-if="selectedNetwork || rpcDown" v-model="selectedNetwork" :label="t('walletSettings.selectNetwork')" :items="networks" />
      <div v-else class="block text-sm text-app-text-600 dark:text-app-text-dark-500 mb-16">
        {{ `${t("walletActivity.loading")} ${t("walletActivity.network")}...` }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SUPPORTED_NETWORKS } from "@toruslabs/casper-controllers";
import { computed } from "vue";

import { SelectField } from "@/components/common";
import ControllersModule from "@/modules/controllers";

const networks = Object.keys(SUPPORTED_NETWORKS).map((key) => {
  const value = SUPPORTED_NETWORKS[key as keyof typeof SUPPORTED_NETWORKS];
  return {
    label: value.displayName,
    value: value.chainId,
  };
});
const selectedNetwork = computed({
  get: () => networks.find((it) => it.value === ControllersModule.torusState.NetworkControllerState.chainId),
  set: (value) => {
    if (value) ControllersModule.setNetwork(value.value);
  },
});
</script>
<template>
  <div class="pb-4">
    <div class="mb-4">
      <SelectField v-if="selectedNetwork" v-model="selectedNetwork" label="Select Network" :items="networks" />
      <div v-else class="block text-sm font-body text-app-text-600 dark:text-app-text-dark-500 mb-16">Loading network...</div>
    </div>
  </div>
</template>

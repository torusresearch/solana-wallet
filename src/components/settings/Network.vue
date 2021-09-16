<script setup lang="ts">
import { SUPPORTED_NETWORKS } from "@toruslabs/casper-controllers";
import { ref, watch } from "vue";

import { SelectField } from "@/components/common";
import ControllersModule from "@/modules/controllers";

const networks = Object.keys(SUPPORTED_NETWORKS).map((key) => {
  const value = SUPPORTED_NETWORKS[key as keyof typeof SUPPORTED_NETWORKS];
  return {
    label: value.displayName,
    value: value.chainId,
  };
});
const selectedNetwork = ref(networks[0]);
watch(selectedNetwork, (newValue) => {
  if (!newValue) selectedNetwork.value = networks[0];
  ControllersModule.setNetwork(newValue.value);
});

// TODO: Handle when chainId is "loading"
</script>
<template>
  <div class="pb-4">
    <div class="mb-4">
      <SelectField v-model="selectedNetwork" label="Select Network" :items="networks" />
    </div>
  </div>
</template>

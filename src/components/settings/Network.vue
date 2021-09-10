<script setup lang="ts">
import { ref } from "vue";

import { SelectField } from "@/components/common";

const networks = [
  {
    label: "Main Ethereum Network",
    value: "mainnet",
    code: 1,
    symbol: "ETH",
    url: "https://etherscan.io",
  },
  {
    label: "Rinkeby Test Network",
    value: "rinkeby",
    code: 4,
    symbol: "ETH",
    url: "https://rinkeby.etherscan.io",
  },
];

const selectedNetwork = ref(networks[0]);
</script>
<template>
  <div class="pb-4">
    <div class="mb-4">
      <SelectField v-model="selectedNetwork" label="Select Network" :items="networks" />
    </div>
  </div>
</template>

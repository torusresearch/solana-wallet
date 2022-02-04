<script setup lang="ts">
import { SolanaToken } from "@toruslabs/solana-controllers";
import { computed } from "vue";

import ControllerModule from "@/modules/controllers";

const currency = computed(() => ControllerModule.torus.currentCurrency?.toLocaleLowerCase());

function getUiTokenValue(perTokenPrice: number, tokenAmount: number, subStringLength = 5): number {
  return parseFloat((perTokenPrice * tokenAmount).toFixed(subStringLength));
}

defineProps<{
  splToken?: SolanaToken;
}>();

const emits = defineEmits(["splClicked"]);

function splClicked() {
  emits("splClicked");
}
</script>

<template>
  <div
    class="shadow dark:shadow-dark border border-app-gray-200 dark:border-transparent bg-white dark:bg-app-gray-700 rounded-md h-20 flex flex-col justify-center"
    @click="splClicked"
    @keydown="splClicked"
  >
    <div class="flex flex-row justify-between items-center flex-auto shadow dark:shadow-dark px-3">
      <span class="flex flex-row justify-start items-center">
        <img class="block h-5 mr-2 w-auto text-white font-bold text-xs leading-3" :src="splToken.data?.logoURI" alt="TOKEN Logo" />
        <p class="text-app-text-600 dark:text-app-text-dark-500 font-bold text-xs leading-3 w-24 truncate">{{ splToken.data?.name }}</p></span
      >
      <p class="font-medium text-xs leading-3 text-right text-gray-900 text-app-text-600 dark:text-app-text-dark-500 mr-1 truncate w-20">
        ~ {{ (+splToken.balance?.uiAmountString).toFixed(3) }} {{ splToken.data?.symbol }}
      </p>
    </div>
    <div class="flex flex-row justify-between items-center font-normal text-gray-500 text-xs flex-auto px-3">
      <p>
        1 {{ splToken.data?.symbol }} ≈ {{ (splToken.price?.[currency === "sol" ? "usd" : currency] || 0).toFixed(3) }}
        {{ (currency === "sol" ? "usd" : currency).toUpperCase() }}
      </p>
      <p>
        ~{{ getUiTokenValue(splToken.price?.[currency === "sol" ? "usd" : currency] || 0, splToken.balance?.uiAmount || 0, 3) }}
        {{ (currency === "sol" ? "usd" : currency).toUpperCase() }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { significantDigits } from "@toruslabs/base-controllers";
import { computed } from "vue";

import SolanaLogoDark from "@/assets/solana-logo-shaded.png";
import SolanaLogoLight from "@/assets/solana-logo-shaded-light.png";
import ControllerModule from "@/modules/controllers";
import { SolAndSplToken } from "@/utils/interfaces";

const currency = computed(() => ControllerModule.torus.currentCurrency?.toLocaleLowerCase());

function getUiTokenValue(perTokenPrice: number, tokenAmount: number, subStringLength = 5): number {
  return parseFloat((perTokenPrice * tokenAmount).toFixed(subStringLength));
}

const formattedSOLBalance = computed(() => ControllerModule.convertedSolBalance);
const conversionRate = computed(() => {
  return ControllerModule.torus.conversionRate;
});

const props = defineProps<{
  splToken?: Partial<SolAndSplToken>;
  splTokenLoading?: boolean;
}>();

const emits = defineEmits(["splClicked"]);
const hasGeckoPrice = computed(() => props.splToken?.symbol === "SOL" || !!props.splToken?.price?.usd);

function splClicked() {
  emits("splClicked");
}
</script>

<template>
  <div
    v-if="splToken"
    class="shadow dark:shadow_box cursor-pointer border border-app-gray-300 dark:border-transparent bg-white dark:bg-app-gray-700 rounded-md h-20 flex flex-col justify-center"
    @click="splClicked"
    @keydown="splClicked"
  >
    <div class="dark:shadow_down flex flex-row justify-between items-center flex-auto px-4 border-b border-app-gray-300 dark:border-b-0">
      <span class="flex flex-row justify-start items-center">
        <img
          class="block h-5 mr-2 w-auto text-white font-bold text-xs leading-3"
          :src="splToken?.iconURL || (ControllerModule.isDarkMode ? SolanaLogoLight : SolanaLogoDark)"
          alt="TOKEN Logo"
        />
        <p class="text-app-text-600 dark:text-app-text-dark-500 font-bold text-xs leading-3 w-24 truncate">{{ splToken?.name }}</p></span
      >
      <p class="font-medium text-xs leading-3 text-right text-app-text-600 dark:text-app-text-dark-500 mr-1 truncate w-20">
        ~ {{ significantDigits(splToken.balance?.uiAmount || 0, false, 4) }} {{ splToken?.symbol }}
      </p>
    </div>
    <div class="flex flex-row justify-between items-center font-normal text-gray-500 text-xs flex-auto px-4">
      <p v-if="hasGeckoPrice">
        1 {{ splToken?.symbol }} ≈
        {{ !splToken.mintAddress ? conversionRate : (splToken?.price?.[currency === "sol" ? "usd" : currency] || 0).toFixed(3) }}
        {{ (currency === "sol" ? "usd" : currency).toUpperCase() }}
      </p>
      <p v-if="!hasGeckoPrice">
        {{ $t("homeToken.noRate") }}
      </p>
      <p v-if="hasGeckoPrice">
        ~{{
          !splToken.mintAddress
            ? formattedSOLBalance
            : getUiTokenValue(splToken?.price?.[currency === "sol" ? "usd" : currency] || 0, splToken?.balance?.uiAmount || 0, 3)
        }}
        {{ (currency === "sol" ? "usd" : currency).toUpperCase() }}
      </p>
    </div>
  </div>
  <div
    v-if="splTokenLoading"
    class="shadow dark:shadow_box cursor-pointer border border-app-gray-300 dark:border-transparent bg-white dark:bg-app-gray-700 rounded-md h-20 flex flex-col justify-center"
  >
    <div class="dark:shadow_down flex flex-row justify-between items-center flex-auto px-4 border-b border-app-gray-300 dark:border-b-0">
      <span class="flex flex-row justify-start items-center">
        <img
          :class="splTokenLoading ? 'skeleton-animation skeleton-img' : ''"
          class="block h-5 mr-2 w-auto text-white font-bold text-xs leading-3"
          alt="" />
        <p
          class="text-app-text-600 dark:text-app-text-dark-500 font-bold text-xs leading-3 w-24 truncate"
          :class="splTokenLoading ? 'skeleton-animation skeleton-p' : ''"
        ></p
      ></span>
      <p
        class="font-medium text-xs leading-3 text-right text-app-text-600 dark:text-app-text-dark-500 mr-1 truncate w-20"
        :class="splTokenLoading ? 'skeleton-animation skeleton-p' : ''"
      ></p>
    </div>
    <div class="flex flex-row justify-between items-center font-normal text-gray-500 text-xs flex-auto px-4">
      <p v-if="!hasGeckoPrice" :class="splTokenLoading ? 'skeleton-animation skeleton-p' : ''"></p>
      <p :class="splTokenLoading ? 'skeleton-animation skeleton-p' : ''"></p>
    </div>
  </div>
</template>

<style scoped>
.dark .dark\:shadow_down {
  box-shadow: 0px 14px 28px 0px rgba(36, 37, 41, 0.5);
}
.dark .dark\:shadow_box {
  box-shadow: 0px 14px 28px 0px rgba(92, 108, 127, 0.06);
}
.skeleton-p {
  width: 100px;
  height: 0.7rem;
  margin-bottom: 0.5rem;
  border-radius: 0.25rem;
}
.skeleton-img {
  width: 20px;
  height: 20px;
  border-radius: 0.75rem;
}
</style>

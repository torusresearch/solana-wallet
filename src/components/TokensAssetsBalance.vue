<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";

import solicon from "@/assets/solana-mascot.svg";
import SplCard from "@/components/home/SplCard.vue";
import ControllerModule from "@/modules/controllers";

const router = useRouter();

const fungibleTokens = computed(() => ControllerModule.fungibleTokens);
const formattedSOLBalance = computed(() => ControllerModule.convertedSolBalance);
const solBalance = computed(() => ControllerModule.solBalance);
const conversionRate = computed(() => {
  return ControllerModule.torus.conversionRate;
});
const currency = computed(() => ControllerModule.torus.currentCurrency);

function transferToken(mint: string) {
  router.push(`/wallet/transfer?mint=${mint}`);
}
</script>

<template>
  <div class="flex flex-col">
    <div class="tab-info w-full overflow-x-hidden">
      <div class="flex flex-col space-y-4">
        <div
          class="shadow dark:shadow_box cursor-pointer border border-app-gray-300 dark:border-transparent bg-white dark:bg-app-gray-700 rounded-md h-20 flex flex-col justify-center"
          @click="() => router.push('/wallet/transfer')"
          @keydown="() => router.push('/wallet/transfer')"
        >
          <div class="dark:shadow_down flex flex-row justify-between items-center flex-auto px-4 border-b border-app-gray-300 dark:border-b-0">
            <span class="flex flex-row justify-start items-center">
              <img class="block h-5 mr-2 w-auto text-white font-bold text-xs leading-3" :src="solicon" alt="Solana Logo" />
              <p class="text-app-text-600 dark:text-app-text-dark-500 font-bold text-xs leading-3 w-24 truncate">Solana</p></span
            >
            <p class="font-medium text-xs leading-3 text-right text-gray-900 text-app-text-600 dark:text-app-text-dark-500 mr-1 truncate w-20">
              ~ {{ solBalance.toFixed(4) }} SOL
            </p>
          </div>
          <div class="flex flex-row justify-between items-center font-normal text-gray-500 text-xs flex-auto px-4">
            <p>
              1 SOL ≈ {{ conversionRate }}
              {{ currency.toUpperCase() }}
            </p>
            <p>
              ~{{ formattedSOLBalance }}
              {{ currency.toUpperCase() }}
            </p>
          </div>
        </div>
        <div v-for="token in fungibleTokens" :key="token.tokenAddress.toString()" class="w-full">
          <SplCard :spl-token="token" @spl-clicked="transferToken(token.mintAddress)"></SplCard>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tab-info {
  height: fit-content;
  max-height: max(280px, calc(100vh - 450px));
}
@screen lt-sm {
  .tab-info {
    height: fit-content;
    max-height: max(280px, calc(100vh - 610px));
  }
}

.tab-info::-webkit-scrollbar-track {
  @apply bg-app-primary-100 dark:bg-app-gray-800 rounded-lg;
}

.tab-info::-webkit-scrollbar {
  @apply bg-app-primary-100 dark:bg-app-gray-800 w-1;
}
.tab-info::-webkit-scrollbar-thumb {
  @apply rounded-lg bg-app-primary-500;
}
.dark .dark\:shadow_down {
  box-shadow: 0px 14px 28px 0px rgba(36, 37, 41, 0.5);
}
.dark .dark\:shadow_box {
  box-shadow: 0px 14px 28px 0px rgba(92, 108, 127, 0.06);
}
</style>

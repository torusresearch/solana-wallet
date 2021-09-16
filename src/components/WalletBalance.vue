<script setup lang="ts">
import { computed } from "@vue/reactivity";

import { Button, Card, NetworkDisplay } from "@/components/common";
import ControllersModule from "@/modules/controllers";

defineProps<{
  showButtons?: boolean;
}>();

const currency = ControllersModule.torusState.CurrencyControllerState.currentCurrency;
const token = ControllersModule.torusState.CurrencyControllerState.nativeCurrency;
const pricePerToken = ControllersModule.torusState.CurrencyControllerState.conversionRate;
const balance =
  ControllersModule.torusState.AccountTrackerState.accounts[ControllersModule.torusState.PreferencesControllerState.selectedAddress]?.balance ||
  "0x0";

const formattedBalance = computed(() => {
  const value = Math.round(parseInt(balance, 16) * pricePerToken * 100) / 100;
  return value === 0 ? "0.00" : value;
});
</script>
<template>
  <Card :height="showButtons ? '164px' : undefined">
    <div class="flex">
      <div class="font-header font-semibold text-app-text-600 dark:text-app-text-dark-500">Total Value</div>
      <div class="ml-auto"><NetworkDisplay /></div>
    </div>
    <div class="flex">
      <div>
        <span class="mr-2 font-body font-bold text-5xl text-app-text-500 dark:text-app-text-dark-500">{{ formattedBalance }}</span>
        <span class="font-body uppercase text-xs text-app-text-500 dark:text-app-text-dark-600">{{ currency }}</span>
      </div>
      <div class="ml-auto font-body uppercase text-xs self-end text-app-text-400 dark:text-app-text-dark-600">
        1 {{ token }} = {{ pricePerToken }} {{ currency }}
      </div>
    </div>
    <template v-if="showButtons" #footer>
      <div class="grid grid-cols-2 gap-3 mt-3">
        <div>
          <Button block variant="tertiary">Top up</Button>
        </div>
        <div>
          <Button block variant="tertiary">Transfer</Button>
        </div>
      </div>
    </template>
  </Card>
</template>

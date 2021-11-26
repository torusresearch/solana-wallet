<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";

import { Button, Card, CurrencySelector, NetworkDisplay } from "@/components/common";
import ControllersModule from "@/modules/controllers";

defineProps<{
  showButtons?: boolean;
}>();

const router = useRouter();
const currency = computed(() => ControllersModule.torus.currentCurrency);
const token = computed(() => ControllersModule.torus.nativeCurrency);
const conversionRate = computed(() => ControllersModule.torus.conversionRate);

const formattedBalance = computed(() => ControllersModule.userBalance);
const updateCurrency = (newCurrency: string) => {
  ControllersModule.setCurrency(newCurrency);
};
</script>
<template>
  <Card :height="showButtons ? '164px' : undefined">
    <div class="flex">
      <div class="font-header font-semibold text-app-text-600 dark:text-app-text-dark-500">Total Value</div>
      <div class="ml-auto"><NetworkDisplay /></div>
    </div>
    <div class="flex">
      <div class="amount-container">
        <span class="mr-2 font-body font-bold text-5xl lt-sm:text-3xl text-app-text-500 dark:text-app-text-dark-500">{{ formattedBalance }}</span>
        <CurrencySelector :currency="currency" :token="token" @on-change="updateCurrency" />

        <!--        <span class="font-body uppercase text-xs text-app-text-500 dark:text-app-text-dark-600">{{ currency }}</span>-->
      </div>
      <div class="ml-auto font-body uppercase text-xs self-end text-app-text-400 dark:text-app-text-dark-600">
        1 {{ token }} =
        <span id="conversionRate">{{ conversionRate }}</span>
        {{ currency }}
      </div>
    </div>
    <template v-if="showButtons" #footer>
      <div class="grid grid-cols-2 gap-3 mt-3">
        <div>
          <Button :block="true" variant="tertiary" @click="router.push('/wallet/topup')">Top up</Button>
        </div>
        <div>
          <Button :block="true" variant="tertiary" @click="router.push('/wallet/transfer')">Transfer</Button>
        </div>
      </div>
    </template>
  </Card>
</template>
<style scoped>
.amount-container {
  display: flex;
  flex-direction: row;
  align-items: baseline;
}
</style>

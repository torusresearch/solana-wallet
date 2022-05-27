<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import { Button, Card, CurrencySelector, NetworkDisplay } from "@/components/common";
import { GeneralInteractions, HomePageInteractions, trackUserClick } from "@/directives/google-analytics";
import ControllerModule from "@/modules/controllers";
import { isTopupHidden } from "@/utils/white-label";

const { t } = useI18n();

defineProps<{
  showButtons?: boolean;
}>();

const router = useRouter();
const currency = computed(() => ControllerModule.torus.currentCurrency);
const token = computed(() => {
  return ControllerModule.torus.nativeCurrency;
});
const conversionRate = computed(() => {
  return ControllerModule.torus.conversionRate;
});
const formattedBalance = computed(() => {
  return Number(ControllerModule.totalBalance);
});
const updateCurrency = (newCurrency: string) => {
  trackUserClick(GeneralInteractions.GENERAL_CHANGE_CURRENCY + newCurrency);
  ControllerModule.setCurrency(newCurrency);
};
</script>
<template>
  <Card :height="showButtons ? '164px' : undefined">
    <div class="flex w-full justify-between items-center">
      <div class="font-header font-semibold text-app-text-600 dark:text-app-text-dark-500">
        {{ t("walletHome.totalValue") }}
      </div>
      <NetworkDisplay />
    </div>
    <div class="flex w-full justify-between items-center">
      <div class="amount-container">
        <span class="mr-2 font-bold text-5xl lt-md:text-3xl text-app-text-500 dark:text-app-text-dark-500">{{ formattedBalance }}</span>
        <CurrencySelector :currency="currency" :token="token" @on-change="updateCurrency" />
      </div>
      <div class="mt-auto uppercase text-xs text-app-text-400 dark:text-app-text-dark-600">
        1 {{ token }} =
        <span id="conversionRate">{{ conversionRate }}</span>
        {{ currency }}
      </div>
    </div>
    <template v-if="showButtons" #footer>
      <div class="flex w-full justify-between items-center">
        <Button
          v-if="!isTopupHidden()"
          v-ga="HomePageInteractions.TOPUP"
          :block="true"
          variant="tertiary"
          class="w-full mr-3 text-app-primary-500"
          @click="router.push('/wallet/topup')"
          >{{ t("walletHome.topUp") }}</Button
        >
        <Button
          v-ga="HomePageInteractions.TRANSFER"
          :block="true"
          variant="tertiary"
          class="w-full text-app-primary-500"
          @click="router.push('/wallet/transfer')"
          >{{ t("walletHome.transfer") }}</Button
        >
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

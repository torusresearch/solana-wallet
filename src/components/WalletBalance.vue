<script setup lang="ts">
import { LoadingState } from "@toruslabs/solana-controllers";
import { computed } from "vue";
import { useRouter } from "vue-router";

import { Button, Card, CurrencySelector, NetworkDisplay } from "@/components/common";
import { GeneralInteractions, HomePageInteractions, trackUserClick } from "@/directives/google-analytics";
import ControllerModule from "@/modules/controllers";
// import { i18n } from "@/plugins/i18nPlugin";
import { isTopupHidden } from "@/utils/whitelabel";

// const { t } = i18n.global;

const isCurrencyRateUpdate = computed(() => ControllerModule.isCurrencyRateUpdate);
const isSplTokenLoading = computed(() => ControllerModule.isSplTokenLoading);

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
        {{ $t("walletHome.totalValue") }}
      </div>
      <NetworkDisplay />
    </div>
    <div
      v-if="isSplTokenLoading !== LoadingState.FULL_RELOAD && isCurrencyRateUpdate !== LoadingState.FULL_RELOAD"
      class="flex w-full justify-between items-center"
    >
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
    <div v-else class="flex w-full justify-between items-center">
      <div class="amount-container">
        <span class="skeleton-animation skeleton-p mr-2 font-bold text-5xl lt-md:text-3xl text-app-text-500 dark:text-app-text-dark-500"></span>
        <span class="skeleton-animation w-10 mr-1 font-bold text-2xl lt-md:text-3xl text-app-text-500 dark:text-app-text-dark-500"></span>
      </div>
      <span class="skeleton-animation skeleton-p mr-1 font-bold text-2xl lt-md:text-3xl text-app-text-500 dark:text-app-text-dark-500"></span>
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
          >{{ $t("walletHome.topUp") }}</Button
        >
        <Button
          v-ga="HomePageInteractions.TRANSFER"
          :block="true"
          variant="tertiary"
          class="w-full text-app-primary-500"
          @click="router.push('/wallet/transfer')"
          >{{ $t("walletHome.transfer") }}</Button
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
.skeleton-p {
  width: 100px;
  height: 1.2rem;
  margin: 0.5rem 0;
  border-radius: 0.25rem;
}
</style>

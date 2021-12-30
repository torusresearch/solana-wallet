<script setup lang="ts">
import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import { Button, Card, CurrencySelector, NetworkDisplay } from "@/components/common";
import ControllerModule from "@/modules/controllers";
import { SolAndSplToken } from "@/utils/interfaces";

const { t } = useI18n();

const props = defineProps<{
  showButtons?: boolean;
  selectedToken?: Partial<SolAndSplToken>;
}>();

const router = useRouter();
const currency = computed(() => ControllerModule.torus.currentCurrency);
const token = computed(() => {
  if (props.selectedToken && props.selectedToken.symbol !== "SOL") return props.selectedToken?.symbol || "";
  return ControllerModule.torus.nativeCurrency;
});
const conversionRate = computed(() => {
  if (props.selectedToken) {
    if (props.selectedToken.symbol?.toLowerCase() === currency.value.toLowerCase()) return 1;
    if (props.selectedToken.symbol !== "SOL") return props.selectedToken?.price?.[currency.value.toLowerCase()] || 0;
  }
  return ControllerModule.torus.conversionRate;
});
const formattedBalance = computed(() => {
  if (props.selectedToken && props.selectedToken.symbol !== "SOL")
    return ((Number(props.selectedToken?.balance?.uiAmount) || 0) * conversionRate.value).toFixed(2);
  return ControllerModule.userBalance;
});
const updateCurrency = (newCurrency: string) => {
  ControllerModule.setCurrency(newCurrency);
};
watch(
  () => props.selectedToken,
  (curr, prev) => {
    if (curr?.symbol !== prev?.symbol && currency.value === prev?.symbol) updateCurrency(curr?.symbol || "USD");
  }
);
</script>
<template>
  <Card :height="showButtons ? '164px' : undefined">
    <div class="flex">
      <div class="font-header font-semibold text-app-text-600 dark:text-app-text-dark-500">
        {{ t("walletHome.totalValue") }}
      </div>
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
          <Button :block="true" variant="tertiary" @click="router.push('/wallet/topup')">{{ t("walletHome.topUp") }}</Button>
        </div>
        <div>
          <Button :block="true" variant="tertiary" @click="router.push('/wallet/transfer')">{{ t("walletHome.transfer") }}</Button>
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

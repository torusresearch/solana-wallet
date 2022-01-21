<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { Card, NetworkDisplay } from "@/components/common";
import ControllerModule from "@/modules/controllers";
import { convertCurrency } from "@/utils/helpers";
import { SolAndSplToken } from "@/utils/interfaces";

const { t } = useI18n();

const props = defineProps<{
  selectedToken?: Partial<SolAndSplToken>;
}>();

const currency = computed(() => ControllerModule.torus.currentCurrency);
const token = computed(() => {
  return props.selectedToken?.symbol;
});

const conversionRate = ref<number>();
const setConversionRate = async () => {
  if (props?.selectedToken?.symbol !== "SOL") {
    if (currency.value === "SOL") conversionRate.value = await convertCurrency(token.value as string, "SOL");
    else conversionRate.value = props.selectedToken?.price?.[currency.value.toLowerCase()] || 0;
  } else conversionRate.value = ControllerModule.torus.conversionRate;
};

const formattedBalance = computed(() => {
  if (token.value === "SOL") return ControllerModule.solBalance.toFixed(4);
  return Number(props.selectedToken?.balance?.uiAmount).toFixed(2);
});
watch(
  () => props.selectedToken,
  (curr, prev) => {
    if (curr?.symbol !== prev?.symbol) setConversionRate();
  },
  { immediate: true }
);
</script>
<template>
  <Card>
    <div class="flex w-full flex-row justify-between items-center">
      <div class="font-header font-semibold text-app-text-600 dark:text-app-text-dark-500">
        {{ t("walletHome.totalValue") }}
      </div>
      <NetworkDisplay />
    </div>
    <div class="flex w-full flex-row justify-between items-center">
      <div class="amount-container">
        <span class="mr-2 font-bold text-5xl lt-sm:text-3xl text-app-text-500 dark:text-app-text-dark-500">{{ formattedBalance }}</span>
        <span class="uppercase text-xs text-app-text-500 dark:text-app-text-dark-600">{{ token }}</span>
      </div>
      <div class="ml-auto mt-auto uppercase text-xs text-app-text-400 dark:text-app-text-dark-600">
        1 {{ token }} =
        <span id="conversionRate">{{ conversionRate }}</span>
        {{ currency }}
      </div>
    </div>
  </Card>
</template>
<style scoped>
.amount-container {
  display: flex;
  flex-direction: row;
  align-items: baseline;
}
</style>

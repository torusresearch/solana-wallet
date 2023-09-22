<script setup lang="ts">
import { significantDigits } from "@toruslabs/base-controllers";
import { computed, ref, watch } from "vue";

import { Card, NetworkDisplay } from "@/components/common";
import ControllerModule from "@/modules/controllers";
import { i18n } from "@/plugins/i18nPlugin";
import { SolAndSplToken } from "@/utils/interfaces";

const { t } = i18n.global;

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
    if (currency.value === "SOL") conversionRate.value = ControllerModule.torus.conversionRate;
    else conversionRate.value = props.selectedToken?.price?.[currency.value.toLowerCase()] || 0;
  } else conversionRate.value = ControllerModule.torus.conversionRate;
};

const formattedBalance = computed(() => {
  if (token.value === "SOL") return significantDigits(ControllerModule.solBalance, false, 4);
  return significantDigits(props.selectedToken?.balance?.uiAmount || 0, false, 4);
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
    <div class="flex w-full justify-between items-center">
      <div class="font-header font-semibold text-app-text-600 dark:text-app-text-dark-500">
        {{ t("walletHome.totalValue") }}
      </div>
      <NetworkDisplay />
    </div>
    <div class="flex w-full justify-between items-center">
      <div class="amount-container">
        <span class="mr-2 font-bold text-5xl lt-md:text-3xl text-app-text-500 dark:text-app-text-dark-500">{{ formattedBalance }}</span>
        <span class="uppercase text-xs text-app-text-500 dark:text-app-text-dark-600">{{
          !selectedToken?.isFungible ? selectedToken?.name : token
        }}</span>
      </div>
      <div v-if="selectedToken?.isFungible" class="mt-auto uppercase text-xs text-app-text-400 dark:text-app-text-dark-600">
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

<script setup lang="ts">
import { useI18n } from "vue-i18n";

const props = withDefaults(
  defineProps<{
    isExpand: boolean;
    estimatedBalanceChange: { changes: number; symbol: string }[];
    hasEstimationError: boolean;
  }>(),
  {}
);
const { t } = useI18n();
</script>
<template>
  <div>{{ t("walletTransfer.estimated-change") }}</div>
  <div v-for="item in props.estimatedBalanceChange" :key="item.symbol" class="italic text-red-500">
    <div>{{ item.changes }}</div>
    <div>{{ item.symbol }}</div>
  </div>
  <div v-if="props.hasEstimationError" class="font-body text-xs font-thin text-red-500 italic">{{ t("walletTransfer.estimated-fail") }}.</div>
</template>

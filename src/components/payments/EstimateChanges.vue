<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { AccountEstimation } from "@/utils/interfaces";

const props = withDefaults(
  defineProps<{
    isExpand: boolean;
    estimatedBalanceChange: AccountEstimation[];
    hasEstimationError: string;
    estimationInProgres: boolean;
  }>(),
  {}
);
const { t } = useI18n();
</script>
<template>
  <div>{{ t("walletTransfer.estimated-change") }}</div>
  <div v-if="props.estimationInProgres" class="text-right">Estimating...</div>
  <div v-for="item in props.estimatedBalanceChange" :key="item.symbol" class="grid grid-cols-2 italic text-red-500 text-right">
    <div />
    <div v-if="!props.estimationInProgres" :class="item.changes >= 0 && 'text-green-400'">
      {{ item.changes + "   " + item.symbol.substring(0, 8) }}
    </div>
    <!-- <div>{{ item.symbol }}</div> -->
  </div>
  <div v-if="props.hasEstimationError" class="font-body text-xs font-thin text-red-500 italic text-right">
    <!-- {{ t("walletTransfer.estimated-fail") }}. -->
    {{ props.hasEstimationError }}
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

import ControllerModule from "@/modules/controllers";
import { AccountEstimation } from "@/utils/interfaces";

const props = withDefaults(
  defineProps<{
    isExpand: boolean;
    estimatedBalanceChange: AccountEstimation[];
    hasEstimationError: string;
    estimationInProgress: boolean;
  }>(),
  {}
);

const getSymbol = (mintAddress: string) => {
  const tokenInfoState = ControllerModule.torusState.TokenInfoState;
  return tokenInfoState.tokenInfoMap[mintAddress]?.symbol || tokenInfoState.metaplexMetaMap[mintAddress]?.symbol || mintAddress.substring(0, 8);
};

const { t } = useI18n();
</script>
<template>
  <div class="text-xs text-app-text-500 dark:text-app-text-dark-500">{{ t("walletTransfer.estimated-change") }}</div>
  <div class="ml-auto text-right">
    <div v-if="props.estimationInProgress" class="text-xs italic text-app-text-500 dark:text-app-text-dark-500">Estimating...</div>
    <div v-for="item in props.estimatedBalanceChange" :key="item.symbol" class="text-xs italic text-red-500">
      <div v-if="!props.estimationInProgress" :class="item.changes >= 0 && 'text-green-400'">
        {{ item.changes + "   " + (getSymbol(item.mint) || "SOL") }}
      </div>
    </div>
  </div>
  <div v-if="props.hasEstimationError" class="font-body text-xs font-thin text-red-500 italic text-right">
    <!-- {{ t("walletTransfer.estimated-fail") }}. -->
    {{ props.hasEstimationError }}
  </div>
</template>

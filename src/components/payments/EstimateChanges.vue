<script setup lang="ts">
import log from "loglevel";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import ControllerModule, { torus } from "@/modules/controllers";
import { AccountEstimation } from "@/utils/interfaces";

const props = defineProps<{
  isExpand: boolean;
  estimatedBalanceChange: AccountEstimation[];
  estimationInProgress: boolean;
  hasEstimationError: string;
}>();
const symbols = ref<{ [mint: string]: string }>({});

const updateSymbol = async (mintAddress: string, decimals: number) => {
  symbols.value[mintAddress] = mintAddress ? `${mintAddress.substring(0, 5)}...` : "SOL";

  const tokenInfoState = ControllerModule.torusState.TokenInfoState;
  let symbol = tokenInfoState.tokenInfoMap[mintAddress]?.symbol || tokenInfoState.metaplexMetaMap[mintAddress]?.symbol;
  if (!symbol && decimals > 0) symbol = (await torus.fetchTokenInfo(mintAddress))?.symbol;
  if (!symbol && decimals === 0) symbol = (await torus.fetchMetaPlexNft([mintAddress])).onChainMetadataMap[mintAddress]?.symbol;
  if (symbol) symbols.value[mintAddress] = symbol;
};

watch(
  props,
  () => {
    log.info(props);
    if (!props.estimationInProgress) {
      props.estimatedBalanceChange.forEach((value) => {
        updateSymbol(value.mint, value.decimals);
      });
    }
  },
  { immediate: true, deep: true }
);

const { t } = useI18n();
</script>
<template>
  <div class="flex w-full">
    <div class="text-xs text-app-text-500 dark:text-app-text-dark-500">{{ t("walletTransfer.estimated-change") }}</div>
    <div class="ml-auto text-right">
      <div v-if="props.estimationInProgress" class="text-xs italic text-app-text-500 dark:text-app-text-dark-500">Estimating...</div>
      <div v-for="item in props.estimatedBalanceChange" :key="item.symbol" class="text-xs italic text-red-500">
        <div v-if="!props.estimationInProgress" :class="item.changes >= 0 && 'text-green-400'">
          {{ item.changes + "   " + symbols[item.mint] }}
        </div>
      </div>
    </div>
  </div>
  <div v-if="props.hasEstimationError" class="font-body text-xs font-thin text-red-500 italic text-left">
    <!-- {{ t("walletTransfer.estimated-fail") }}. -->
    {{ props.hasEstimationError }}
  </div>
</template>

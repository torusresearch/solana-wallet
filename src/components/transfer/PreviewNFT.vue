<script setup lang="ts">
import { NFTInfo } from "@toruslabs/solana-controllers";
import { useI18n } from "vue-i18n";

const props = withDefaults(
  defineProps<{
    mintAddress: string | undefined;
    token: Partial<NFTInfo | undefined>;
  }>(),
  {}
);
const { t } = useI18n();
</script>
<template>
  <div class="flex flex-col justify-center items-start h-full w-full ml-6">
    <div class="flex flex-col justify-center items-start flex-auto">
      <p class="property-name text-app-text-600 dark:text-app-text-dark-white">{{ t("walletTransfer.nftName") }}</p>
      <p class="property-value text-app-text-500 dark:text-app-text-dark-500">{{ props.token?.name }}</p>
    </div>
    <div class="flex flex-col justify-center items-start flex-auto py-5 w-full">
      <p class="property-name text-app-text-600 dark:text-app-text-dark-white">{{ t("walletTransfer.nftSymbol") }}</p>
      <p class="property-value text-app-text-500 dark:text-app-text-dark-500">{{ props.token?.symbol }}</p>
    </div>
    <div class="flex flex-col justify-center items-start flex-auto">
      <p class="property-name text-app-text-600 dark:text-app-text-dark-white">{{ t("walletTransfer.viewNFT") }}</p>
      <a
        class="property-value text-app-text-500 dark:text-app-text-dark-500"
        :href="`https://solscan.io/token/${props.mintAddress}`"
        target="_blank"
        rel="noopener noreferrer"
        >{{ props.token?.name }}</a
      >
    </div>
  </div>
</template>
<style scoped></style>

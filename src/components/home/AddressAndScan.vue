<script setup lang="ts">
import { QrcodeIcon } from "@heroicons/vue/solid";
import { addressSlicer } from "@toruslabs/base-controllers";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import SolanaLogoLight from "@/assets/solana-logo-light.svg";
import WalletIcon from "@/assets/wallet.svg";
import { HomePageInteractions } from "@/directives/google-analytics";
import { copyText } from "@/utils/helpers";

const { t } = useI18n();
const router = useRouter();
defineProps<{
  selectedAddress: string;
}>();
</script>

<template>
  <div class="items-center space-x-2">
    <div
      v-ga="HomePageInteractions.COPY_PUB"
      class="bg-white border dark:border-0 dark:bg-app-gray-700 flex space-x-2 py-1 px-2 rounded-full cursor-pointer items-center"
      @click="copyText(selectedAddress)"
      @keydown="copyText(selectedAddress)"
    >
      <img alt="solana logo" class="w-3 h-3" :src="SolanaLogoLight" />
      <img alt="wallet icon" class="w-3 h-3" :src="WalletIcon" />
      <span class="text-app-text-500 text-xs font-bold">{{ addressSlicer(selectedAddress) }}</span>
    </div>
    <div
      class="rounded-full border dark:border-0 h-6 p-2 flex items-center bg-white dark:bg-app-gray-700 text-app-text-500 justify-center cursor-pointer"
      @click="router.push('/wallet/pay')"
      @keydown="router.push('/wallet/pay')"
    >
      <QrcodeIcon class="w-4 h-4" />
      <span class="text-app-text-500 text-xs font-bold"> {{ t("walletHome.scanAndPay") }}</span>

      <!-- <QrcodeIcon class="w-4 h-4" /> -->
    </div>
  </div>
</template>

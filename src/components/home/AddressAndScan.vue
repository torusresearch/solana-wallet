<script setup lang="ts">
import { QrcodeIcon } from "@heroicons/vue/solid";
import { addressSlicer } from "@toruslabs/base-controllers";
import { ScanIcon } from "@toruslabs/vue-icons/basic";
import log from "loglevel";
import { ref } from "vue";
import { useRouter } from "vue-router";

import WalletIcon from "@/assets/wallet.svg";
import { HomePageInteractions } from "@/directives/google-analytics";
import ControllerModule from "@/modules/controllers";
import { i18n } from "@/plugins/i18nPlugin";
import { copyText } from "@/utils/helpers";

import QrcodeDisplay from "./QrcodeDisplay.vue";

const { t } = i18n.global;
const router = useRouter();
defineProps<{
  selectedAddress: string;
}>();

const displayQr = ref(false);
const openQr = () => {
  displayQr.value = true;
};
const closeQr = () => {
  log.info("close qr");
  displayQr.value = false;
};
</script>

<template>
  <div class="items-center space-x-2">
    <div
      class="rounded-full border dark:border-0 h-6 p-2 flex items-center bg-white dark:bg-app-gray-700 text-app-text-500 justify-center cursor-pointer"
      @click="openQr"
      @keydown="openQr"
    >
      <QrcodeIcon class="w-4 h-4" />
    </div>
    <div
      v-ga="HomePageInteractions.COPY_PUB"
      class="bg-white border dark:border-0 dark:bg-app-gray-700 flex space-x-2 py-1 px-2 rounded-full cursor-pointer items-center"
      @click="copyText(selectedAddress)"
      @keydown="copyText(selectedAddress)"
    >
      <!-- <img alt="solana logo" class="w-3 h-3" :src="SolanaLogoLight" /> -->
      <img alt="wallet icon" class="w-3 h-3" :src="WalletIcon" />
      <span class="text-app-text-500 text-xs font-bold">{{ addressSlicer(selectedAddress) }}</span>
    </div>
    <div
      class="rounded-full border dark:border-0 h-6 p-2 flex items-center bg-white dark:bg-app-gray-700 text-app-text-500 justify-center cursor-pointer"
      @click="router.push('/wallet/pay')"
      @keydown="router.push('/wallet/pay')"
    >
      <ScanIcon class="w-4 h-4 mr-2" />
      <span class="text-app-text-500 text-xs font-bold"> {{ t("walletHome.scanAndPay") }}</span>
    </div>
    <QrcodeDisplay
      v-if="displayQr"
      :is-open="displayQr"
      description=""
      :public-address="selectedAddress"
      :is-dark-mode="ControllerModule.isDarkMode"
      @on-close="closeQr"
    />
  </div>
</template>

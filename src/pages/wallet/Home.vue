<script setup lang="ts">
import { RefreshIcon } from "@heroicons/vue/solid";
import { CustomTokenInfo } from "@toruslabs/solana-controllers";
import throttle from "lodash-es/throttle";
import { computed, defineAsyncComponent, ref } from "vue";
import { useI18n } from "vue-i18n";

import { Button } from "@/components/common";
import AddressAndScan from "@/components/home/AddressAndScan.vue";
import ImportToken from "@/components/home/ImportToken.vue";
import { HomePageInteractions } from "@/directives/google-analytics";
import { addToast } from "@/modules/app";
import ControllerModule from "@/modules/controllers";
import { NAVIGATION_LIST } from "@/utils/enums";

const asyncWalletBalance = defineAsyncComponent({
  loader: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "WalletBalance" */ "@/components/WalletBalance.vue"),
  delay: 500,
  suspensible: false,
});

const isImportTokenOpen = ref(false);
const tokenList = computed(() => ControllerModule.torus.existingTokenAddress);
const connection = computed(() => ControllerModule.torus.connection);
const importDisabled = ref(true);

const asyncTokensAssetsBalance = defineAsyncComponent({
  loader: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "TokensAssetsBalance" */ "@/components/TokensAssetsBalance.vue"),
  delay: 500,
  suspensible: false,
});

const { t } = useI18n();

const lastRefreshDate = computed(() => ControllerModule.lastTokenRefreshDate);

const refreshTokens = throttle(() => {
  ControllerModule.refreshUserTokens();
}, 500);

const importTokens = async () => {
  isImportTokenOpen.value = true;
  importDisabled.value = false;
};

const importCanceled = async () => {
  isImportTokenOpen.value = false;
};

const importConfirm = async (importToken: CustomTokenInfo) => {
  isImportTokenOpen.value = false;
  try {
    await ControllerModule.torus.importCustomToken(importToken);
    // close dialog and show success message
    addToast({
      message: `Token ${importToken.name} Imported Successfully`,
      type: "success",
    });
  } catch (err) {
    // showing transaction failed message
    addToast({
      message: `Token could not Imported: ${err || "Something Went Wrong"}`,
      type: "error",
    });
  }
};

const pricePerToken = computed<number>((): number => {
  return ControllerModule.torus.conversionRate;
});

const lastUpdateString = computed(() => {
  return `Last update ${lastRefreshDate.value.toLocaleString("en-US", {
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })}`;
});
</script>

<template>
  <div class="py-2 flex flex-col items-center">
    <div class="mt-4 flex flex-col space-y-4 w-full sm:w-10/12 md:w-3/5 lg:w-1/2">
      <header>
        <div class="flex items-center max-w-7xl justify-between">
          <h1 class="text-xl sm:text-3xl font-medium leading-tight text-app-text-500 dark:text-app-text-dark-400">
            {{ t(NAVIGATION_LIST["home"].title) }}
          </h1>
          <div class="flex items-center space-x-2">
            <AddressAndScan class="hidden md:flex" :selected-address="ControllerModule.selectedAddress" />
          </div>
        </div>
      </header>
      <asyncWalletBalance :show-buttons="true" class="w-full" />
    </div>
    <AddressAndScan class="flex md:hidden mt-3" :selected-address="ControllerModule.selectedAddress" />
    <div class="mt-8 flex flex-col space-y-4 w-full sm:w-10/12 md:w-3/5 lg:w-1/2">
      <h2 class="-mb-2 text-base font-medium leading-tight text-app-text-500 dark:text-app-text-dark-400">Tokens</h2>
      <asyncTokensAssetsBalance />
      <div
        class="shadow dark:shadow_box cursor-pointer border border-app-gray-300 dark:border-transparent bg-white dark:bg-app-gray-700 rounded-md h-20 flex flex-col justify-center"
      >
        <div class="dark:shadow_down flex flex-row justify-center items-center flex-auto px-4 border-b border-app-gray-300 dark:border-b-0">
          <span class="flex flex-row justify-center items-center">
            <p class="text-app-text-600 dark:text-app-text-dark-500 font-bold text-xs leading-3 truncate">Didn't See Your Token?</p></span
          >
        </div>
        <div class="flex flex-row justify-center items-center font-normal text-gray-500 text-xs flex-auto px-4">
          <Button v-ga="HomePageInteractions.REFRESH" class="flex flex-column" variant="text" @click="importTokens"> Import Token </Button>
        </div>
      </div>
      <!-- <div
        class="shadow dark:shadow_box border border-app-gray-300 dark:border-transparent bg-white dark:bg-app-gray-700 rounded-md h-20 flex flex-col justify-center"
      >
        <div class="dark:shadow_down flex flex-row justify-center items-center flex-auto border-b border-app-gray-300 dark:border-b-0">
          <span class="text-app-text-600 dark:text-app-text-dark-500 font-bold text-sm black">Did not see your Tokens?</span>
        </div>
        <div class="flex justify-center items-center flex-auto">
          <span class="cursor-pointer font-normal text-app-primary-500 text-xs">Add your Tokens here</span>
        </div>
      </div> -->
      <div class="flex flex-col w-full items-end !mt-8">
        <div class="bg-white border dark:border-0 dark:bg-app-gray-700 flex items-center space-x-2 py-2 px-4 rounded-full w-fit">
          <RefreshIcon class="w-3 h-3 text-app-text-500 dark:text-app-text-dark-400" />
          <span
            v-ga="HomePageInteractions.REFRESH"
            class="text-app-text-500 dark:text-app-text-dark-400 text-xs cursor-pointer"
            @click="refreshTokens"
            @keydown="refreshTokens"
            >Refresh Tokens</span
          >
        </div>
        <span class="text-app-text-400 text-xs mt-2">{{ lastUpdateString }}</span>
      </div>
    </div>
    <ImportToken
      :connection="connection"
      :price-per-token="pricePerToken"
      :token-list="tokenList"
      :is-open="isImportTokenOpen"
      :import-disabled="importDisabled"
      @import-canceled="importCanceled"
      @import-confirm="importConfirm"
    />
  </div>
</template>

<style scoped>
.dark .dark\:shadow_down {
  box-shadow: 0px 14px 28px 0px rgba(36, 37, 41, 0.5);
}
.dark .dark\:shadow_box {
  box-shadow: 0px 14px 28px 0px rgba(92, 108, 127, 0.06);
}
</style>

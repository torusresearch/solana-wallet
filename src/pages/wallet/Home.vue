<script setup lang="ts">
import { RefreshIcon } from "@heroicons/vue/solid";
import { CustomTokenInfo } from "@toruslabs/solana-controllers";
import { throttle } from "lodash-es";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import { Button } from "@/components/common";
import AddressAndScan from "@/components/home/AddressAndScan.vue";
import ImportToken from "@/components/home/ImportToken.vue";
import ImportTokenConfirmation from "@/components/home/ImportTokenConfirmation.vue";
import TokensAssetsBalance from "@/components/TokensAssetsBalance.vue";
import WalletBalance from "@/components/WalletBalance.vue";
import { HomePageInteractions } from "@/directives/google-analytics";
import { addToast } from "@/modules/app";
import ControllerModule, { torus } from "@/modules/controllers";
import { NAVIGATION_LIST } from "@/utils/navHelpers";

const isImportTokenOpen = ref(false);
const isImportConfirmationOpen = ref(false);
const tokenList = computed(() => ControllerModule.existingTokenAddress);
const importDisabled = ref(true);
const importConfirmationDisabled = ref(false);
const customToken = ref<CustomTokenInfo | null>(null);

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

const importTokenCall = async (importToken: CustomTokenInfo) => {
  // if not proceed to import token api call
  try {
    await torus.importCustomToken(importToken);
    // close dialog and show success message
    addToast({
      message: `Token ${importToken.name} imported successfully`,
      type: "success",
    });
  } catch (err) {
    // showing transaction failed message
    addToast({
      message: `Token could not be imported: ${err || "Something went wrong"}`,
      type: "error",
    });
  }
};

const importConfirm = async (importToken: CustomTokenInfo) => {
  const { address, name, symbol } = importToken;
  isImportTokenOpen.value = false;
  // check if token is already present in the spl token list
  const result = await torus.fetchTokenInfo(address);
  const tokenInfo = {
    address,
    name,
    symbol,
    publicAddress: "",
    network: "",
  };
  // if present show dialog to import token
  if (result && result.address) {
    customToken.value = { ...result, network: result.chainId };
    isImportConfirmationOpen.value = true;
  } else {
    await importTokenCall(tokenInfo);
  }
};

const canceledSplTokenImport = async () => {
  isImportConfirmationOpen.value = false;
};

const confirmSplTokenImport = async () => {
  importConfirmationDisabled.value = true;
  if (customToken.value) {
    await importTokenCall(customToken.value);
  } else {
    addToast({
      message: "Token could not be imported: Something went wrong",
      type: "error",
    });
  }
  importConfirmationDisabled.value = false;
  isImportConfirmationOpen.value = false;
};

const pricePerToken = computed<number>((): number => {
  return torus.conversionRate;
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
  <div class="py-4 sm:mx-auto sm:px-6 lg:px-8 max-w-7xl mx-4 flex flex-col items-center">
    <div class="mt-4 flex flex-col space-y-4 w-full sm:w-10/12 md:w-3/5 lg:w-1/2">
      <header>
        <div class="flex items-center max-w-7xl justify-between">
          <h1 class="text-xl sm:text-3xl font-medium leading-tight text-app-text-500 dark:text-app-text-dark-400">
            {{ t(NAVIGATION_LIST.home.title) }}
          </h1>
          <div class="flex items-center space-x-2">
            <AddressAndScan class="hidden lg:flex" :selected-address="ControllerModule.selectedAddress" />
          </div>
        </div>
      </header>
      <WalletBalance :show-buttons="true" class="w-full" />
    </div>
    <AddressAndScan class="flex lg:hidden mt-3" :selected-address="ControllerModule.selectedAddress" />
    <div class="mt-4 lg:mt-8 flex flex-col space-y-4 w-full sm:w-10/12 md:w-3/5 lg:w-1/2">
      <h2 class="-mb-2 text-base font-medium leading-tight text-app-text-500 dark:text-app-text-dark-400">Tokens</h2>
      <TokensAssetsBalance />
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
      :price-per-token="pricePerToken"
      :token-list="tokenList"
      :is-open="isImportTokenOpen"
      :import-disabled="importDisabled"
      @import-canceled="importCanceled"
      @import-confirm="importConfirm"
    />
    <ImportTokenConfirmation
      :is-open="isImportConfirmationOpen"
      :import-disabled="importConfirmationDisabled"
      @import-canceled="canceledSplTokenImport"
      @import-confirm="confirmSplTokenImport"
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

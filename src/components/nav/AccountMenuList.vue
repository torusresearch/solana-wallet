<script setup lang="ts">
/* eslint-disable vuejs-accessibility/anchor-has-content */
import { QrcodeIcon } from "@heroicons/vue/solid";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { UserInfo } from "@toruslabs/base-controllers";
import { getChainIdToNetwork } from "@toruslabs/solana-controllers";
import { CopyIcon, ExternalLinkIcon, PlusIcon } from "@toruslabs/vue-icons/basic";
import { WalletIcon } from "@toruslabs/vue-icons/finance";
import BigNumber from "bignumber.js";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import { Button } from "@/components/common";
import { AccountImport } from "@/components/nav";
import ControllerModule from "@/modules/controllers";
import { NAVIGATION_LIST } from "@/utils/enums";
import { copyText } from "@/utils/helpers";

import LanguageSelector from "./LanguageSelector.vue";

const { t } = useI18n();
const props = defineProps<{
  user: UserInfo;
  selectedAddress: string;
}>();
const emits = defineEmits(["onLogout"]);
const explorerUrl = computed(() => {
  return `${ControllerModule.torus.blockExplorerUrl}/account/${props.selectedAddress}/?cluster=${getChainIdToNetwork(
    ControllerModule.torus.chainId
  )}`;
});

const pageNavigation = Object.values(NAVIGATION_LIST).filter((nav) => nav.route !== "home");

const currency = computed(() => ControllerModule.torus.currentCurrency);
const modalVisible = ref(false);

const logout = () => {
  emits("onLogout");
};
const copySelectedAddress = (address: string) => {
  copyText(address);
};

const openImportModal = () => {
  modalVisible.value = true;
};

const closeImportModal = () => {
  modalVisible.value = false;
};

const setSelected = async (address: string) => {
  await ControllerModule.setSelectedAccount(address);
};

const currentAccount = computed(() => ControllerModule.selectedAddress);

const getWalletBalance = (address: string): string => {
  const { allBalances } = ControllerModule;
  const lamports = new BigNumber(allBalances[address]?.balance || 0);
  const solBal = lamports.div(LAMPORTS_PER_SOL);

  const pricePerToken = ControllerModule.conversionRate;
  const selectedCurrency = ControllerModule.currentCurrency;
  const value = solBal.times(new BigNumber(pricePerToken));
  return value.toFixed(selectedCurrency.toLowerCase() === "sol" ? 4 : 2).toString();
};
</script>

<template>
  <div>
    <div class="flex items-center p-4">
      <img class="rounded-full w-10 mr-2" :src="user.profileImage" alt="" />
      <div class="font-bold text-base text-app-text-600 dark:text-app-text-dark-500">{{ user.name }}'s {{ t("accountMenu.account") }}</div>
    </div>
    <div class="px-3 pb-3">
      <div
        v-for="(wallet, index) in ControllerModule.allAddresses"
        :key="wallet"
        class="hover:shadow dark:hover:shadow-dark2 rounded-md py-2 px-3 cursor-pointer"
        :class="{
          'shadow dark:shadow-dark2': currentAccount === wallet,
        }"
        @click="() => setSelected(wallet)"
        @keydown="() => setSelected(wallet)"
      >
        <div class="flex">
          <div class="flex items-center">
            <WalletIcon class="w-4 h-4 mr-1 text-app-text-500 dark:text-app-text-dark-500" />
            <div class="font-bold text-sm text-app-text-600 dark:text-app-text-dark-500">
              {{ index ? `Imported Account ${index}` : user.email }}
            </div>
          </div>
          <div class="ml-auto text-xs text-app-text-500 dark:text-app-text-dark-500 uppercase">{{ getWalletBalance(wallet) }} {{ currency }}</div>
        </div>
        <div class="flex">
          <div class="text-xxs w-full overflow-x-hidden text-ellipsis mr-2 pl-5 text-app-text-400 dark:text-app-text-dark-500">
            {{ wallet }}
          </div>
          <div class="ml-auto flex space-x-1">
            <div class="rounded-full w-6 h-6 flex items-center bg-gray-200 justify-center cursor-pointer">
              <CopyIcon class="w-4 h-4" @click.stop="() => copySelectedAddress(wallet)" />
            </div>
            <div class="rounded-full w-6 h-6 flex items-center bg-gray-200 justify-center cursor-pointer">
              <QrcodeIcon class="w-4 h-4" />
            </div>
            <div class="rounded-full w-6 h-6 flex items-center bg-gray-200 justify-center cursor-pointer">
              <a :href="explorerUrl" target="_blank" rel="noreferrer noopener" @click="(e) => e.stopImmediatePropagation()">
                <ExternalLinkIcon class="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      class="flex cursor-pointer items-center border-t border-b md:border-b-0 w-full text-left px-4 py-4 text-sm font-bold text-app-text-600 dark:text-app-text-dark-500 dark:hover:text-app-text-600 dark:hover:bg-app-gray-400"
      @click="openImportModal"
      @keydown="openImportModal"
    >
      <PlusIcon class="w-4 h-4 mr-2" aria-hidden="false" />
      <div>Import Account</div>
    </div>

    <!-- Page navigation -->
    <router-link
      is="router-link"
      v-for="nav in pageNavigation"
      :key="nav.route"
      :to="`/wallet/${nav.route}`"
      class="flex cursor-pointer md:hidden items-center w-full text-left px-4 py-4 text-sm font-bold text-app-text-600 dark:text-app-text-dark-500 dark:hover:text-app-text-600 dark:hover:bg-app-gray-400"
    >
      <component :is="nav.icon" class="w-4 h-4 mr-2" aria-hidden="true"></component>{{ t(nav.name) }}
    </router-link>
    <div
      class="flex cursor-pointer items-center md:hidden border-t w-full text-left py-4 text-sm font-bold text-app-text-600 dark:text-app-text-dark-500 dark:hover:text-app-text-600 dark:hover:bg-app-gray-400"
    >
      <LanguageSelector />
    </div>

    <!-- <div
    class="
      flex
      cursor-pointer
      items-center
      border-t border-b
      sm:border-b-0
      w-full
      text-left
      px-4
      py-4
      text-sm
      font-bold
      text-app-text-600
      dark:text-app-text-dark-500 dark:hover:text-app-text-600 dark:hover:bg-app-gray-400
    "
  >
    <InformationCircleIcon class="w-4 h-4 mr-2" aria-hidden="true" />
    <div>Info and Support</div>
  </div> -->
    <div class="p-4 border-t">
      <Button class="ml-auto" variant="text" @click="logout">{{ t("accountMenu.logOut") }}</Button>
    </div>
    <AccountImport :is-open="modalVisible" @on-close="closeImportModal" />
  </div>
</template>

<style scoped></style>

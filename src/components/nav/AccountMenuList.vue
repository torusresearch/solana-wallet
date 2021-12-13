<script setup lang="ts">
/* eslint-disable vuejs-accessibility/anchor-has-content */
import { QrcodeIcon } from "@heroicons/vue/solid";
import { UserInfo } from "@toruslabs/base-controllers";
import { getChainIdToNetwork } from "@toruslabs/solana-controllers";
import { CopyIcon, ExternalLinkIcon } from "@toruslabs/vue-icons/basic";
import { WalletIcon } from "@toruslabs/vue-icons/finance";
import { computed } from "vue";

import { Button } from "@/components/common";
import ControllersModule from "@/modules/controllers";
import { NAVIGATION_LIST } from "@/utils/enums";
import { copyText } from "@/utils/helpers";

const props = defineProps<{
  user: UserInfo;
  selectedAddress: string;
}>();
const emits = defineEmits(["onLogout"]);

const explorerUrl = computed(() => {
  return `${ControllersModule.torus.blockExplorerUrl}/account/${props.selectedAddress}/?cluster=${getChainIdToNetwork(
    ControllersModule.torus.chainId
  )}`;
});

const pageNavigation = Object.values(NAVIGATION_LIST).filter((nav) => nav.route !== "home");

const currency = computed(() => ControllersModule.torus.currentCurrency);
const formattedBalance = computed(() => ControllersModule.userBalance);

const logout = () => {
  emits("onLogout");
};

const copySelectedAddress = () => {
  copyText(props.selectedAddress);
};
</script>

<template>
  <div class="flex items-center p-4">
    <img class="rounded-full w-10 mr-2" :src="user.profileImage" alt="" />
    <div class="font-body font-bold text-base text-app-text-600 dark:text-app-text-dark-500">{{ user.name }}'s Account</div>
  </div>
  <div class="px-3 pb-3">
    <div class="shadow dark:shadow-dark2 rounded-md py-2 px-3">
      <div class="flex">
        <div class="flex items-center">
          <WalletIcon class="w-4 h-4 mr-1 text-app-text-500 dark:text-app-text-dark-500" />
          <div class="font-body font-bold text-sm text-app-text-600 dark:text-app-text-dark-500">
            {{ user.email }}
          </div>
        </div>
        <div class="ml-auto text-xs font-body text-app-text-500 dark:text-app-text-dark-500 uppercase">{{ formattedBalance }} {{ currency }}</div>
      </div>
      <div class="flex">
        <div class="font-body text-xxs w-full overflow-x-hidden overflow-ellipsis mr-2 pl-5 text-app-text-400 dark:text-app-text-dark-500">
          {{ selectedAddress }}
        </div>
        <div class="ml-auto flex space-x-1">
          <div class="rounded-full w-6 h-6 flex items-center bg-gray-200 justify-center cursor-pointer">
            <CopyIcon class="w-4 h-4" @click="copySelectedAddress" />
          </div>
          <div class="rounded-full w-6 h-6 flex items-center bg-gray-200 justify-center cursor-pointer">
            <QrcodeIcon class="w-4 h-4" />
          </div>
          <div class="rounded-full w-6 h-6 flex items-center bg-gray-200 justify-center cursor-pointer">
            <a :href="explorerUrl" target="_blank" rel="noreferrer noopener">
              <ExternalLinkIcon class="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
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
    <PlusIcon class="w-4 h-4 mr-2" aria-hidden="true" />
    <div>Import Account</div>
  </div> -->

  <!-- Page navigation -->
  <router-link
    is="router-link"
    v-for="nav in pageNavigation"
    :key="nav.route"
    :to="`/wallet/${nav.route}`"
    class="
      flex
      cursor-pointer
      sm:hidden
      items-center
      w-full
      text-left
      px-4
      py-4
      text-sm
      font-bold
      text-app-text-600
      dark:text-app-text-dark-500 dark:hover:text-app-text-600 dark:hover:bg-app-gray-
    "
  >
    <component :is="nav.icon" class="w-4 h-4 mr-2" aria-hidden="true"></component>{{ nav.name }}</router-link
  >

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
    <Button class="ml-auto" variant="text" @click="logout">Logout</Button>
  </div>
</template>

<style scoped></style>

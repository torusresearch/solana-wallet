<script setup lang="ts">
import { computed, ref } from "vue";

import SolanaLogoURL from "@/assets/solana-dark.svg";
import SolanaLightLogoURL from "@/assets/solana-light.svg";
import { AccountMenu, AccountMenuList, AccountMenuMobile } from "@/components/nav";
import { requireLoggedIn } from "@/modules/auth";
import ControllerModule from "@/modules/controllers";
import { i18n, setLocale } from "@/plugins/i18nPlugin";
import { NAVIGATION_LIST } from "@/utils/navHelpers";
import { getWhiteLabelLocale, getWhiteLabelLogoDark, getWhiteLabelLogoLight, isWhiteLabelSet } from "@/utils/whitelabel";

requireLoggedIn();

setLocale(i18n, isWhiteLabelSet() ? getWhiteLabelLocale() : ControllerModule.locale || (i18n.global.locale as string));

const props = withDefaults(
  defineProps<{
    tab: keyof typeof NAVIGATION_LIST;
    showHeader: boolean;
  }>(),
  {
    tab: "home",
    showHeader: true,
  }
);

const tabs = ref(NAVIGATION_LIST);
const user = computed(() => ControllerModule.userInfo);
const selectedAddress = computed(() => ControllerModule.selectedAddress);
const logout = async () => {
  await ControllerModule.logout();
};
</script>

<template>
  <div v-if="selectedAddress" class="h-screen bg-white dark:bg-app-gray-800 flex flex-col items-start justify-start pb-[56px] md:pb-0">
    <nav class="bg-white dark:bg-app-gray-800 border-b border-gray-200 dark:border-transparent sticky top-0 z-30 w-full">
      <div class="flex h-16 px-4 header-border">
        <div class="flex-1 flex items-center mr-auto">
          <router-link to="/wallet/home">
            <img
              class="block h-4 w-auto"
              :src="ControllerModule.isDarkMode ? getWhiteLabelLogoLight() || SolanaLightLogoURL : getWhiteLabelLogoDark() || SolanaLogoURL"
              alt="Solana Logo"
            />
          </router-link>
        </div>
        <div class="flex flex-3">
          <div class="hidden md:-my-px md:mx-auto md:flex md:space-x-0">
            <router-link
              v-for="(value, key) in tabs"
              :key="key"
              :to="`/wallet/${value.route}`"
              :class="[
                key === tab
                  ? 'border-app-primary-500 text-app-primary-500'
                  : 'border-transparent text-gray-500 hover:border-gray-300 dark:hover:border-white hover:text-gray-700 dark:hover:text-white',
                'inline-flex items-center px-4 pt-1 border-b-2 text-sm font-medium',
                value.navHidden && 'hidden',
              ]"
              :aria-current="key === tab ? 'page' : undefined"
              >{{ $t(value.name) }}</router-link
            >
          </div>
        </div>
        <div class="hidden md:flex items-center flex-1 ml-auto justify-end">
          <AccountMenu :user="user"><AccountMenuList :user="user" :selected-address="selectedAddress" @on-logout="logout" /></AccountMenu>
        </div>
        <div class="ml-6 flex md:hidden items-center">
          <AccountMenuMobile><AccountMenuList :user="user" :selected-address="selectedAddress" @on-logout="logout" /></AccountMenuMobile>
        </div>
      </div>
    </nav>

    <div class="flex-1 overflow-y-auto w-full" :class="props.showHeader ? 'py-2' : ''">
      <header v-if="props.showHeader">
        <div class="flex items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-wrap">
          <h1 class="text-xl sm:text-3xl font-medium leading-tight text-app-text-500 dark:text-app-text-dark-400">
            {{ $t(tabs[tab]?.title) || "" }}
          </h1>
          <div class="grow flex">
            <div id="rightPanel" class="w-full" />
          </div>
        </div>
      </header>
      <main>
        <div :class="props.showHeader ? 'mx-4 sm:mx-auto sm:px-6 lg:px-8 max-w-7xl' : ''">
          <slot />
        </div>
      </main>
    </div>
    <div
      class="fixed bottom-0 md:hidden w-full h-14 pb-[10px] flex flex-row align-center justify-around dark:bg-black bg-white border-t border-black"
    >
      <router-link
        v-for="(value, key) in tabs"
        :key="key"
        :to="`/wallet/${value.route}`"
        :aria-current="key === tab ? 'page' : undefined"
        :class="[value.mobHidden ? 'hidden' : 'block']"
      >
        <div
          :id="`${key}_link`"
          class="flex flex-col h-full items-center justify-center select-none w-16 py-1"
          :class="[key === tab ? 'border-t-2 border-app-primary-500' : '']"
        >
          <img
            :src="value.icon"
            alt="link icon"
            class="h-5"
            :class="[key === tab ? (ControllerModule.isDarkMode ? 'item-white' : 'item-black') : 'item-gray opacity-90']"
          />
          <p
            class="text-xs text-center leading-none mt-1"
            :class="[key === tab ? (ControllerModule.isDarkMode ? 'item-white' : 'item-black') : 'item-gray opacity-90']"
          >
            {{ $t(value.name) || "" }}
          </p>
        </div>
      </router-link>
    </div>
  </div>
</template>
<style scoped>
.dark .header-border {
  border-bottom: 1px solid #6f717a5e;
}
</style>

<script setup lang="ts">
import SolanaLogoURL from "@/assets/solana-dark.svg";
import SolanaLightLogoURL from "@/assets/solana-light.svg";
import { AccountMenu, AccountMenuList, AccountMenuMobile } from "@/components/nav";
import { app } from "@/modules/app";
import { requireLoggedIn } from "@/modules/auth";
import ControllerModule from "@/modules/controllers";
import { NAVIGATION_LIST } from "@/utils/enums";

requireLoggedIn();

defineProps<{
  tab: keyof typeof NAVIGATION_LIST;
}>();

const tabs = NAVIGATION_LIST;
const user = ControllerModule.torus.userInfo;
const { selectedAddress } = ControllerModule.torusState.PreferencesControllerState;
const publicKey = ControllerModule.torusState.KeyringControllerState.wallets.find((x) => x.address === selectedAddress)?.publicKey || "";
const logout = () => {
  ControllerModule.logout();
};
</script>

<template>
  <div v-if="selectedAddress && user.verifierId" class="min-h-screen bg-white dark:bg-app-gray-800">
    <nav class="bg-white dark:bg-app-gray-800 border-b border-gray-200 dark:border-transparent">
      <div class="flex h-16 px-4">
        <div class="flex-none flex items-center">
          <router-link to="/wallet/home">
            <img class="block h-4 w-auto" :src="app.isDarkMode ? SolanaLightLogoURL : SolanaLogoURL" alt="Casper Logo" />
          </router-link>
        </div>
        <div class="flex flex-grow">
          <div class="hidden sm:-my-px sm:mx-auto sm:flex sm:space-x-0">
            <router-link
              v-for="(value, key) in tabs"
              :key="key"
              :to="`/wallet/${value.route}`"
              :class="[
                key === tab
                  ? 'border-app-primary-500 text-app-primary-500'
                  : 'border-transparent text-gray-500 hover:border-gray-300 dark:hover:border-white hover:text-gray-700 dark:hover:text-white',
                'inline-flex items-center px-4 pt-1 border-b-2 text-sm font-medium',
              ]"
              :aria-current="key === tab ? 'page' : undefined"
              >{{ value.name }}</router-link
            >
          </div>
        </div>
        <div class="ml-6 hidden sm:flex items-center">
          <AccountMenu :user="user"><AccountMenuList :user="user" :selected-address="publicKey" @on-logout="logout" /></AccountMenu>
        </div>
        <div class="ml-6 flex sm:hidden items-center">
          <AccountMenuMobile><AccountMenuList :user="user" :selected-address="publicKey" @on-logout="logout" /></AccountMenuMobile>
        </div>
      </div>
    </nav>

    <div class="py-6">
      <header>
        <div class="flex items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 class="text-xl sm:text-3xl font-medium leading-tight text-app-text-500 dark:text-app-text-dark-400">
            {{ tabs[tab].title }}
          </h1>
          <div class="flex-grow flex"><slot name="rightPanel" /></div>
        </div>
      </header>
      <main>
        <div class="max-w-7xl mx-4 sm:mx-auto sm:px-6 lg:px-8">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

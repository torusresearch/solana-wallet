<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/vue";
import { InformationCircleIcon } from "@heroicons/vue/outline";
import { QrcodeIcon } from "@heroicons/vue/solid";
import { ChevronBottomIcon } from "@toruslabs/vue-icons/arrows";
import { CopyIcon, ExternalLinkIcon, PlusIcon } from "@toruslabs/vue-icons/basic";
import { WalletIcon } from "@toruslabs/vue-icons/finance";

import CasperLogoURL from "@/assets/casper.svg";
import CasperLightLogoURL from "@/assets/casper-light.svg";
import { Button } from "@/components/common";
import { app } from "@/modules/app";
import { logout, requireLoggedIn, user } from "@/modules/auth";

requireLoggedIn();

defineProps<{
  tab: keyof typeof tabs;
}>();

const tabs = {
  home: { name: "Home", title: "Account Balance" },
  transfer: { name: "Transfer", title: "Transfer Details" },
  topup: { name: "Top Up", title: "Select a Provider" },
  activity: { name: "Activity", title: "Transaction Activities" },
  settings: { name: "Settings", title: "Settings" },
};

const userNavigations = [
  { name: "Import Account", to: "#", icon: PlusIcon },
  { name: "Info and Support", to: "#", icon: InformationCircleIcon },
];
</script>

<template>
  <div v-if="user" class="min-h-screen bg-white dark:bg-app-gray-800">
    <nav class="bg-white dark:bg-app-gray-700 border-b border-gray-200 dark:border-transparent">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex h-16">
          <div class="flex-none flex items-center">
            <router-link to="/wallet/home">
              <img class="block h-7 w-auto" :src="app.isDarkMode ? CasperLightLogoURL : CasperLogoURL" alt="Casper Logo" />
            </router-link>
          </div>
          <div class="flex flex-grow">
            <div class="hidden sm:-my-px sm:mx-auto sm:flex sm:space-x-0">
              <router-link
                v-for="(value, key) in tabs"
                :key="key"
                :to="`/wallet/${key}`"
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
          <div class="ml-6 flex items-center">
            <!-- Profile dropdown -->
            <Menu as="div" class="ml-3 relative z-10">
              <div>
                <MenuButton
                  class="max-w-xs flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <span class="sr-only">Open user menu</span>
                  <div class="flex items-center">
                    <span class="font-body text-app-text-600 dark:text-app-text-dark-500 text-sm font-bold mr-1">{{ user.name }}</span>
                    <ChevronBottomIcon class="text-app-text-600 dark:text-app-text-dark-500 w-4" />
                  </div>
                </MenuButton>
              </div>
              <transition
                enter-active-class="transition ease-out duration-200"
                enter-from-class="transform opacity-0 scale-95"
                enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75"
                leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95"
              >
                <MenuItems
                  class="
                    origin-top-right
                    absolute
                    right-0
                    mt-2
                    w-96
                    rounded-md
                    shadow-lg
                    dark:shadow-dark
                    py-1
                    bg-white
                    dark:bg-app-gray-700
                    ring-1 ring-black ring-opacity-5
                    focus:outline-none
                  "
                >
                  <div class="flex items-center p-4">
                    <img class="rounded-full w-10 mr-2" :src="user.imageURL" alt="" />
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
                        <div class="ml-auto text-xs font-body text-app-text-500 dark:text-app-text-dark-500">0.152 USD</div>
                      </div>
                      <div class="flex">
                        <div class="font-body text-xs w-52 pl-5 text-app-text-400 dark:text-app-text-dark-500 break-all">
                          0x0F48654993568658514F982C87A5BDd01D80969F
                        </div>
                        <div class="ml-auto flex space-x-1">
                          <div class="rounded-full w-6 h-6 flex items-center bg-gray-200 justify-center cursor-pointer">
                            <CopyIcon class="w-4 h-4" />
                          </div>
                          <div class="rounded-full w-6 h-6 flex items-center bg-gray-200 justify-center cursor-pointer">
                            <QrcodeIcon class="w-4 h-4" />
                          </div>
                          <div class="rounded-full w-6 h-6 flex items-center bg-gray-200 justify-center cursor-pointer">
                            <ExternalLinkIcon class="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <MenuItem v-for="nav in userNavigations" :key="nav.name" v-slot="{ active }">
                    <router-link
                      is="router-link"
                      :to="nav.to"
                      :class="[
                        active ? 'bg-gray-100' : '',
                        'border-t flex items-center w-full text-left px-4 py-4 text-sm font-bold text-app-text-600 dark:text-app-text-dark-500 dark:hover:text-app-text-600',
                      ]"
                    >
                      <component :is="nav.icon" class="w-4 h-4 mr-2" aria-hidden="true"></component>{{ nav.name }}</router-link
                    >
                  </MenuItem>
                  <div class="p-4 border-t">
                    <Button class="ml-auto" variant="text" @click="logout">Logout</Button>
                  </div>
                </MenuItems>
              </transition>
            </Menu>
          </div>
        </div>
      </div>
    </nav>

    <div class="py-6">
      <header>
        <div class="flex items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 class="text-3xl font-medium leading-tight text-app-text-500 dark:text-app-text-dark-400">
            {{ tabs[tab].title }}
          </h1>
          <div class="flex-grow flex"><slot name="rightPanel" /></div>
        </div>
      </header>
      <main>
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

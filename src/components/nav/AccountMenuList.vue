<script setup lang="ts">
import { InformationCircleIcon } from "@heroicons/vue/outline";
import { QrcodeIcon } from "@heroicons/vue/solid";
import { CopyIcon, ExternalLinkIcon, PlusIcon } from "@toruslabs/vue-icons/basic";
import { WalletIcon } from "@toruslabs/vue-icons/finance";

import { Button } from "@/components/common";
import { logout, user } from "@/modules/auth";
import { NAVIGATION_LIST } from "@/utils/enums";

const pageNavigation = Object.values(NAVIGATION_LIST).filter((nav) => nav.route !== "home");
</script>

<template>
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
        <div class="font-body text-xs w-52 pl-5 text-app-text-400 dark:text-app-text-dark-500">0x0F48654993568658514F982C87A5BDd01D80969F</div>
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
  <div
    class="
      flex
      items-center
      border-t border-b
      w-full
      text-left
      px-4
      py-4
      text-sm
      font-bold
      text-app-text-600
      dark:text-app-text-dark-500 dark:hover:text-app-text-600
    "
  >
    <PlusIcon class="w-4 h-4 mr-2" aria-hidden="true" />
    <div>Import Account</div>
  </div>

  <!-- Page navigation -->
  <router-link
    is="router-link"
    v-for="nav in pageNavigation"
    :key="nav.route"
    :to="`/wallet/${nav.route}`"
    class="
      flex
      sm:hidden
      items-center
      w-full
      text-left
      px-4
      py-4
      text-sm
      font-bold
      text-app-text-600
      dark:text-app-text-dark-500 dark:hover:text-app-text-600
    "
  >
    <component :is="nav.icon" class="w-4 h-4 mr-2" aria-hidden="true"></component>{{ nav.name }}</router-link
  >

  <div
    class="
      flex
      border-t
      items-center
      w-full
      text-left
      px-4
      py-4
      text-sm
      font-bold
      text-app-text-600
      dark:text-app-text-dark-500 dark:hover:text-app-text-600
    "
  >
    <InformationCircleIcon class="w-4 h-4 mr-2" aria-hidden="true" />
    <div>Info and Support</div>
  </div>
  <div class="p-4 border-t">
    <Button class="ml-auto" variant="text" @click="logout">Logout</Button>
  </div>
</template>

<style scoped></style>

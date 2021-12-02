<script setup lang="ts">
import { Listbox, ListboxButton, ListboxLabel, ListboxOption, ListboxOptions } from "@headlessui/vue";
import { ChevronBottomIcon } from "@toruslabs/vue-icons/arrows";
import { ref, watch } from "vue";

import NftLogo from "@/assets/nft_token.svg";
import SolTokenLogo from "@/assets/sol_token.svg";
import { app } from "@/modules/app";

import { nftTokens, tokens } from "./token-helper";

const emits = defineEmits(["update:selectedToken"]);
const selectedToken = ref(tokens.value[0]);
watch(selectedToken, () => {
  emits("update:selectedToken", selectedToken.value);
});
</script>
<template>
  <Listbox v-model="selectedToken" as="div">
    <ListboxLabel class="block text-sm font-body text-app-text-600 dark:text-app-text-dark-500">Select item to transfer</ListboxLabel>
    <div class="mt-1 relative" :class="{ dark: app.isDarkMode }">
      <ListboxButton class="bg-white dark:bg-app-gray-800 select-container shadow-inner dark:shadow-none rounded-md w-full px-3">
        <span class="flex items-center">
          <img :src="selectedToken.iconURL" alt="selected token" class="flex-shrink-0 h-6 w-6 rounded-full" />
          <span class="ml-3 block truncate text-app-text-600 dark:text-app-text-dark-500">
            {{ selectedToken.name }}
          </span>
        </span>
        <span class="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronBottomIcon class="h-4 w-4 text-gray-400" aria-hidden="true" />
        </span>
      </ListboxButton>

      <transition leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <ListboxOptions
          class="
            absolute
            z-10
            mt-1
            w-full
            bg-white
            dark:bg-app-gray-800
            shadow-lg
            max-h-56
            rounded-md
            py-1
            text-base
            ring-1 ring-app-gray-400
            dark:ring-transparent
            overflow-auto
            outline-none
            focus:outline-none
            sm:text-sm
          "
        >
          <ListboxOption :key="'tokenstring'" as="template" :value="null" :disabled="true">
            <li class="option-separator">
              <img class="block h-4 w-auto" :src="SolTokenLogo" alt="Tokens" />
              <p class="ml-2 text-sm text-app-text-400 dark:text-app-text-dark-400">TOKENS</p>
            </li>
          </ListboxOption>
          <ListboxOption v-for="item in tokens" v-slot="{ active, selected }" :key="item.name" as="template" :value="item">
            <li
              :class="[
                active ? 'bg-app-gray-200' : '',
                'cursor-pointer select-none relative py-2 pl-9 pr-9 text-app-text-600 dark:text-app-text-dark-500  dark:hover:text-app-text-600',
              ]"
            >
              <div class="flex items-center">
                <img :src="item?.iconURL" class="flex-shrink-0 h-6 w-6 rounded-full" alt="iconURI" />
                <span :class="[selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate']" class="coin-name">
                  <p>{{ item?.name }} ({{ item?.symbol }})</p>
                  <p class="text-app-gray-500">{{ item?.symbol === "SOL" ? "" : "SPL" }}</p></span
                >
              </div>
            </li>
          </ListboxOption>
          <li class="option-separator mb-4">
            <img class="block h-4 w-auto" :src="NftLogo" alt="Tokens" />
            <p class="ml-2 text-sm text-app-text-400 dark:text-app-text-dark-400">NFTS</p>
          </li>
          <ListboxOption v-for="item in nftTokens" v-slot="{ active, selected }" :key="item.name" as="template" :value="item">
            <li
              :class="[
                active ? 'bg-app-gray-200' : '',
                'cursor-pointer select-none relative py-2 pl-9 pr-9 text-app-text-600 dark:text-app-text-dark-500  dark:hover:text-app-text-600',
              ]"
            >
              <div class="flex items-center">
                <img :src="item?.iconURL" class="flex-shrink-0 h-6 w-6 rounded-full" alt="iconURI" />
                <span :class="[selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate']" class="coin-name">
                  <p>{{ item?.name }} ({{ item?.symbol }})</p>
                  <p class="text-app-gray-500">{{ item?.symbol === "SOL" ? "" : "SPL" }}</p></span
                >
              </div>
            </li>
          </ListboxOption>
        </ListboxOptions>
      </transition>
    </div>
  </Listbox>
</template>

<style scoped>
.select-container {
  height: 54px;
}
.option-separator {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: start;
  margin-left: 13px;
  height: 45px;
}
.coin-name {
  display: flex;
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
}
</style>

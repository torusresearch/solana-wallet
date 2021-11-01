<script setup lang="ts">
import { Listbox, ListboxButton, ListboxLabel, ListboxOption, ListboxOptions } from "@headlessui/vue";
import { ChevronBottomIcon } from "@toruslabs/vue-icons/arrows";
import { ref, watch } from "vue";

import { app } from "@/modules/app";

import { tokens } from "./token-helper";

const emits = defineEmits(["update:selectedToken"]);
let selectedToken = ref(tokens[0]);
watch(selectedToken, () => {
  emits("update:selectedToken", selectedToken.value);
});
</script>
<template>
  <Listbox v-model="selectedToken" as="div">
    <ListboxLabel class="block text-sm font-body text-app-text-600 dark:text-app-text-dark-500">Select item to transfer</ListboxLabel>
    <div class="mt-1 relative">
      <ListboxButton class="bg-white dark:bg-app-gray-800 select-container shadow-inner dark:shadow-none rounded-md w-full px-3">
        <span class="flex items-center">
          <img :src="selectedToken.iconURL" class="flex-shrink-0 h-6 w-6 rounded-full" />
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
          <ListboxOption v-slot="{ active, selected }" as="template" :value="selectedToken">
            <li
              :class="[
                active ? 'bg-app-gray-200' : '',
                'cursor-pointer select-none relative py-2 pl-3 pr-9 text-app-text-600 dark:text-app-text-dark-500 dark:hover:text-app-text-600',
              ]"
            >
              <div class="flex items-center">
                <img :src="selectedToken.iconURL" class="flex-shrink-0 h-6 w-6 rounded-full" />
                <span :class="[selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate']">{{ selectedToken.name }}</span>
              </div>
            </li>
          </ListboxOption>

          <!--          <div class="flex items-center px-3 py-4 border-t">-->
          <!--            <img :src="app.isDarkMode ? TokenLightLogoURL : TokenLogoURL" class="h-4 w-4 mr-2" />-->
          <!--            <div class="font-body text-app-text-600 dark:text-app-text-dark-500 capitalize">Tokens</div>-->
          <!--          </div>-->
          <ListboxOption v-for="item in tokens" v-slot="{ active, selected }" :key="item.name" as="template" :value="item">
            <li
              :class="[
                active ? 'bg-app-gray-200' : '',
                'cursor-pointer select-none relative py-2 pl-9 pr-9 text-app-text-600 dark:text-app-text-dark-500  dark:hover:text-app-text-600',
              ]"
            >
              <div class="flex items-center">
                <img :src="item?.iconURL" class="flex-shrink-0 h-6 w-6 rounded-full" />
                <span :class="[selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate']">{{ item?.name }}</span>
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
</style>

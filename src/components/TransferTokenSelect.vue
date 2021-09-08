<script setup lang="ts">
import { ref } from "vue";

import { SelectorIcon } from "@heroicons/vue/solid";
import {
  Listbox,
  ListboxButton,
  ListboxLabel,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/vue";

import EthereumLogoURL from "@/assets/ethereum.svg";
import BitcoinLogoURL from "@/assets/bitcoin.svg";
import TokenLogoURL from "@/assets/token.svg";

interface Token {
  name: string;
  iconURL: string;
}

const mainToken: Token = {
  name: "Casper",
  iconURL: "https://s2.coinmarketcap.com/static/img/coins/64x64/5899.png",
};

const tokens: Token[] = [
  {
    name: "Ethereum",
    iconURL: EthereumLogoURL,
  },
  {
    name: "Bitcoin",
    iconURL: BitcoinLogoURL,
  },
];

const selectedToken = ref(mainToken);
</script>
<template>
  <Listbox v-model="selectedToken" as="div">
    <ListboxLabel class="block text-sm font-body"
      >Select item to transfer</ListboxLabel
    >
    <div class="mt-1 relative">
      <ListboxButton
        class="select-container shadow-inner rounded-md w-full px-3"
      >
        <span class="flex items-center">
          <img
            :src="selectedToken.iconURL"
            alt
            class="flex-shrink-0 h-6 w-6 rounded-full"
          />
          <span class="ml-3 block truncate">
            {{ selectedToken.name }}
          </span>
        </span>
        <span
          class="
            ml-3
            absolute
            inset-y-0
            right-0
            flex
            items-center
            pr-2
            pointer-events-none
          "
        >
          <SelectorIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
        </span>
      </ListboxButton>

      <transition
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <ListboxOptions
          class="
            absolute
            z-10
            mt-1
            w-full
            bg-white
            shadow-lg
            max-h-56
            rounded-md
            py-1
            text-base
            ring-1 ring-app-gray-400
            overflow-auto
            outline-none
            focus:outline-none
            sm:text-sm
          "
        >
          <ListboxOption
            v-slot="{ active, selected }"
            as="template"
            :value="mainToken"
          >
            <li
              :class="[
                active ? 'text-white bg-indigo-600' : 'text-gray-900',
                'cursor-default select-none relative py-2 pl-3 pr-9',
              ]"
            >
              <div class="flex items-center">
                <img
                  :src="mainToken.iconURL"
                  alt
                  class="flex-shrink-0 h-6 w-6 rounded-full"
                />
                <span
                  :class="[
                    selected ? 'font-semibold' : 'font-normal',
                    'ml-3 block truncate',
                  ]"
                  >{{ mainToken.name }}</span
                >
              </div>
            </li>
          </ListboxOption>

          <div class="flex items-center px-3 py-4 border-t">
            <img :src="TokenLogoURL" class="h-4 w-4 mr-2" />
            <div class="font-body">TOKENS</div>
          </div>
          <ListboxOption
            v-for="item in tokens"
            :key="item.name"
            v-slot="{ active, selected }"
            as="template"
            :value="item"
          >
            <li
              :class="[
                active ? 'text-white bg-indigo-600' : 'text-gray-900',
                'cursor-default select-none relative py-2 pl-9 pr-9',
              ]"
            >
              <div class="flex items-center">
                <img
                  :src="item.iconURL"
                  alt
                  class="flex-shrink-0 h-6 w-6 rounded-full"
                />
                <span
                  :class="[
                    selected ? 'font-semibold' : 'font-normal',
                    'ml-3 block truncate',
                  ]"
                  >{{ item.name }}</span
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
</style>

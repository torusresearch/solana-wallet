<script setup lang="ts">
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/vue";
import { ChevronBottomIcon } from "@toruslabs/vue-icons/arrows";
import { computed } from "vue";

import { supportedCurrencies } from "@/utils/helpers";

const props = defineProps<{
  currency: string;
  token: string;
}>();

const currencies = computed(() => supportedCurrencies(props.token.toUpperCase()));
const emits = defineEmits(["onChange"]);

const value = computed({
  get: () => {
    return props.currency;
  },
  set: (val) => emits("onChange", val),
});
</script>

<template>
  <div id="currencySelector" class="relative">
    <Listbox v-model="value" as="div" class="w-16">
      <ListboxButton class="flex">
        <span class="block truncate text-app-text-500 dark:text-app-text-dark-500 text-xs uppercase">{{ value }}</span>
        <ChevronBottomIcon class="ml-1 h-3 w-3 text-gray-400" aria-hidden="true" />
      </ListboxButton>
      <transition leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <ListboxOptions
          class="absolute z-10 mt-1 w-full bg-white dark:bg-app-gray-700 shadow-lg dark:shadow-dark max-h-56 rounded-md py-1 text-base ring-1 ring-app-gray-400 dark:ring-transparent overflow-auto outline-none focus:outline-none sm:text-sm"
        >
          <ListboxOption v-for="item in currencies" :key="item" v-slot="{ active, selected }" as="template" :value="item">
            <li
              :class="[
                active
                  ? 'bg-app-gray-200 text-app-text-600 dark:text-app-text-600'
                  : 'text-app-text-600 dark:text-app-text-dark-500 dark:hover:text-app-text-600',
                'cursor-pointer select-none py-2 ',
              ]"
            >
              <span class="text-xs" :class="[selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate']">{{ item }}</span>
            </li>
          </ListboxOption>
        </ListboxOptions>
      </transition>
    </Listbox>
  </div>
</template>

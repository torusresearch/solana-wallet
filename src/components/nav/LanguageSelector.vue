<script setup lang="ts">
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/vue";
import { ChevronBottomIcon } from "@toruslabs/vue-icons/arrows";
import { GlobeIcon } from "@toruslabs/vue-icons/basic";
import { customRef } from "vue";
import { useI18n } from "vue-i18n";

import ControllersModule from "@/modules/controllers";
import { LOCALES } from "@/utils/enums";

const { locale } = useI18n({ useScope: "global" });

const value = customRef((track, trigger) => {
  let value2 = LOCALES.find((x) => x.value === locale.value) || LOCALES[0];
  return {
    get() {
      track();
      return value2 || locale.value;
    },
    set(input: typeof LOCALES[0]) {
      value2 = input;
      locale.value = input.value;
      ControllersModule.setLocale(input.value);
      trigger();
    },
  };
});
</script>

<template>
  <div class="relative items-stretch w-full md:w-auto">
    <div class="relative w-full md:w-auto">
      <Listbox v-model="value" as="div">
        <ListboxButton class="flex items-center text-app-text-600 dark:text-app-text-dark-500 w-full md:w-auto px-4 md:px-0">
          <GlobeIcon class="h-4 w-4 mr-2" aria-hidden="true" />
          <span class="font-bold text-sm md:text-xs">{{ value.name }}</span>
          <ChevronBottomIcon class="h-3 w-3 ml-1" aria-hidden="true" />
        </ListboxButton>
        <transition leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100" leave-to-class="opacity-0">
          <ListboxOptions
            class="absolute right-0 z-10 mt-4 md:mt-2 bg-white dark:bg-app-gray-700 shadow-lg dark:shadow-dark max-h-56 rounded-md py-1 text-base ring-1 ring-app-gray-400 dark:ring-transparent overflow-auto outline-none focus:outline-none sm:text-sm w-full md:w-auto"
          >
            <ListboxOption v-for="loc in LOCALES" :key="loc.value" v-slot="{ active, selected }" as="template" :value="loc">
              <li
                :class="[
                  active ? 'bg-app-gray-200' : '',
                  'cursor-pointer select-none relative py-2 px-4 text-app-text-600 dark:text-app-text-dark-500 dark:hover:text-app-text-600',
                ]"
              >
                <div class="flex items-center">
                  <span :class="[selected ? 'font-semibold' : 'font-normal', 'block truncate']">{{ loc.name }}</span>
                </div>
              </li>
            </ListboxOption>
          </ListboxOptions>
        </transition>
      </Listbox>
    </div>
  </div>
</template>

<style scoped></style>

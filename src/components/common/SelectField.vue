<script setup lang="ts">
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/vue";
import { ChevronBottomIcon } from "@toruslabs/vue-icons/arrows";
import { computed } from "vue";

interface Item {
  label: string;
  value: string;
}

const props = defineProps<{
  label?: string;
  modelValue?: Item;
  items: Item[];
}>();

const emits = defineEmits(["update:modelValue"]);

const value = computed({
  get: () => {
    return props.modelValue ? props.modelValue : props.items[0];
  },
  set: (val) => emits("update:modelValue", val),
});
</script>

<template>
  <div class="relative w-full items-stretch">
    <div v-if="label" class="label-container">
      <div class="block text-sm font-body text-app-text-600 dark:text-app-text-dark-500">
        {{ label }}
      </div>
    </div>
    <div class="relative" :class="{ 'mt-1': label }">
      <Listbox v-model="value" as="div">
        <ListboxButton class="shadow-inner dark:shadow-none dark:bg-app-gray-800 rounded-md w-full px-3 py-2" :style="{ height: '54px' }">
          <span class="flex items-center">
            <span class="block truncate text-app-text-500 dark:text-app-text-dark-500">{{ value?.label }}</span>
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
              dark:bg-app-gray-700
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
            <ListboxOption v-for="item in items" :key="item.value" v-slot="{ active, selected }" as="template" :value="item">
              <li
                :class="[
                  active ? 'bg-app-gray-200 text-app-text-600' : 'dark:text-app-text-dark-500',
                  'cursor-pointer select-none relative py-2 px-2 dark:hover:text-app-text-600',
                ]"
              >
                <div class="flex items-center">
                  <span :class="[selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate']">{{ item.label }}</span>
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

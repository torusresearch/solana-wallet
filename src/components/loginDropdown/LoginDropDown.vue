<script setup lang="ts">
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/vue";
import { ChevronBottomIcon } from "@toruslabs/vue-icons/arrows";
import { computed, ref } from "vue";

interface Item {
  label: string;
  value: string;
  img?: string;
  link?: string;
}

const inputIsDirty = ref<boolean>(false);

const props = withDefaults(
  defineProps<{
    label?: string;
    placeholder?: string;
    size?: "small" | "medium" | "large";
    modelValue?: Item;
    items: Item[];
  }>(),
  {
    label: "",
    placeholder: "",
    size: "medium",
    modelValue: undefined,
  }
);

const emits = defineEmits(["update:modelValue"]);

const value = computed({
  get: () => (props.modelValue ? props.modelValue : props.items[0]),
  set: (val) => {
    inputIsDirty.value = true;
    emits("update:modelValue", val);
  },
});
</script>

<template>
  <div v-if="label" class="text-sm text-app-text-600 dark:text-app-text-dark-500 w-full">
    {{ label }}
  </div>
  <div class="relative w-2/3" :class="[`${label && 'mt-2.5'}`, `size-${size}`]">
    <Listbox v-model="value" as="div">
      <ListboxButton
        class="shadow-inner dark:shadow-none bg-white dark:bg-app-loginBg rounded-md w-full h-6 px-3 flex justify-end items-center"
        :class="[`size-${size}`]"
      >
        <span class="flex items-center grow min-w-0">
          <span
            v-if="placeholder && !inputIsDirty"
            class="truncate text-app-text-500 dark:text-app-text-dark-600 dark:text-opacity-50 pr-4"
            :class="size === 'small' ? 'text-xs' : 'text-base'"
            >{{ placeholder }}</span
          >
          <span
            v-else
            class="flex truncate text-app-text-500 dark:text-app-text-dark-500 chain-name"
            :class="size === 'small' && !value.img ? 'text-xs' : 'text-base'"
          >
            <template v-if="value?.img"> <img :src="require(`../../assets/${value.img}`)" alt="chain logo" /> </template>{{ value?.label }}</span
          >
        </span>
        <span class="ml-3 flex items-center pointer-events-none">
          <ChevronBottomIcon class="h-4 w-4 text-gray-400" aria-hidden="true" />
        </span>
      </ListboxButton>
      <transition leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <ListboxOptions
          class="absolute z-10 mt-1 w-full bg-white dark:bg-app-gray-700 max-h-56 rounded-md py-1 text-base ring-1 ring-app-gray-400 dark:ring-transparent overflow-auto outline-none focus:outline-none sm:text-sm"
        >
          <ListboxOption v-for="item in items" :key="item.value" v-slot="{ active, selected }" as="template" :value="item">
            <li
              :class="[
                active ? 'bg-app-gray-200 text-app-text-600' : 'dark:text-app-text-dark-500',
                'cursor-pointer select-none relative py-2 px-2 dark:hover:text-app-text-600',
                size === 'small' ? 'text-xs' : 'text-base',
              ]"
            >
              <div class="flex items-center">
                <span :class="[selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate']"> {{ item.label }}</span>
              </div>
            </li>
          </ListboxOption>
        </ListboxOptions>
      </transition>
    </Listbox>
  </div>
</template>
<style scoped>
.chain-name {
  font-weight: 500;
  font-size: 24px;
  line-height: 32px;
  size: 24px;
  padding-left: 5px;
}
</style>

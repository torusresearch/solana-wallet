<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/vue";

withDefaults(
  defineProps<{
    title: string;
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  }
);
</script>

<template>
  <Disclosure>
    <DisclosureButton class="disclosure-btn"
      ><slot name="leftIcon"></slot>
      <div class="text-base text-app-text-600 dark:text-app-text-dark-500 font-body font-bold">
        {{ title }}
      </div>
    </DisclosureButton>
    <DisclosurePanel :static="disabled" class="disclosure">
      <slot></slot>
    </DisclosurePanel>
  </Disclosure>
</template>

<style scoped>
.disclosure {
  @apply bg-white
dark:bg-app-gray-700
  border
  border-t-0
border-app-gray-200
  dark:border-transparent
  shadow
  dark:shadow-dark
  rounded-t-none
  rounded-b-md
  px-6
  pt-4
  py-3
  -mt-1;
}
.disclosure-btn {
  @apply flex
  items-center
  w-full
  px-4
  py-3
  rounded-md
  bg-white
  dark:bg-app-gray-700
  border
  border-app-gray-200
  dark:border-transparent
  shadow dark:shadow-dark relative;
}
</style>

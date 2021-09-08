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
    <DisclosureButton
      class="
        flex
        items-center
        w-full
        border border-app-gray-200
        shadow
        rounded-md
        px-4
        py-3
      "
      ><slot name="leftIcon"></slot>
      <div class="text-base text-app-text-600 font-body font-bold">
        {{ title }}
      </div>
    </DisclosureButton>
    <DisclosurePanel
      :static="disabled"
      class="
        border border-t-0 border-app-gray-200
        shadow
        rounded-t-none rounded-b-md
        px-6
        pt-4
        py-3
        -mt-1
      "
    >
      <slot></slot>
    </DisclosurePanel>
  </Disclosure>
</template>

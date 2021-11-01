<script setup lang="ts">
import { DecodedDataType } from "@/utils/instruction_decoder";

import DecodedDisplay from "./DecodedDisplay.vue";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = withDefaults(
  defineProps<{
    isExpand: boolean;
    decodedInst: DecodedDataType[];
  }>(),
  {}
);
function capitalizeFirstLetter(string: string) {
  return string[0].toUpperCase() + string.slice(1);
}
// const countable = computed(() => props.cryptoAmount > 0);
const breakJoin = (src: string): string => {
  const items = capitalizeFirstLetter(src).match(/[A-Z][a-z]+/g) || [];
  return items.join(" ");
};
</script>
<template>
  <div v-if="isExpand" class="w-full">
    <div v-for="inst in decodedInst" :key="JSON.stringify(inst)" class="w-full text-app-text-500 dark:text-app-text-dark-500">
      <p>{{ breakJoin(inst.type) }}</p>
      <div v-for="el in Object.keys(inst.data)" :key="el">
        <DecodedDisplay :data="inst.data[el]" :el="el" />
      </div>
    </div>
  </div>
</template>

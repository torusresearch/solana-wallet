<script setup lang="ts">
import { DiscoverDapp } from "@toruslabs/base-controllers";
import { computed } from "vue";

const props = defineProps<{
  dapp: DiscoverDapp;
}>();

const logo = computed(() => props.dapp?.logo?.[0].url || "");
</script>
<template>
  <a
    :href="dapp.url"
    class="flex bg-white hover:bg-app-gray-200 dark:bg-app-gray-700 border border-app-gray-200 dark:border-transparent shadow dark:shadow-dark rounded-lg p-4"
    target="_blank"
    rel="noreferrer noopener"
  >
    <img class="w-12 h-12" :src="logo" alt="Dapp Logo" />
    <div class="pl-2 -mt-1">
      <p class="text-sm text-app-text-600 dark:text-app-text-dark-500 font-bold">{{ dapp.title }}</p>
      <p class="text-xs text-app-text-400 dark:text-app-text-dark-700">{{ dapp.category }}</p>
      <p class="text-xs text-app-gray-600">{{ dapp.desc }}</p>
    </div>
  </a>
</template>

<style scoped></style>

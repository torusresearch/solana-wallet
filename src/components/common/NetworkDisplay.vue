<script setup lang="ts">
import { WifiIcon } from "@heroicons/vue/outline";
import { computed } from "vue";

import ControllersModule from "@/modules/controllers";

const network = computed(() => ControllersModule.torus.currentNetworkName);
</script>

<template>
  <div
    :class="{ dark: ControllersModule.isDarkMode }"
    class="rounded-xl flex items-center dark:px-4 dark:bg-gray-700 bg-transparent font-body text-app-text-500 text-xs font-medium py-1"
  >
    <WifiIcon class="w-3 h-3 mr-1" /><span id="selected_network">{{ network }}</span>
  </div>
</template>

<style scoped>
.dark {
  padding-left: 1rem;
  padding-right: 1rem;
}
</style>

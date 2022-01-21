<script setup lang="ts">
import { WifiIcon } from "@heroicons/vue/outline";
import { computed } from "vue";

import ControllerModule from "@/modules/controllers";

const network = computed(() => ControllerModule.torus.currentNetworkName);
</script>

<template>
  <div :class="{ dark: ControllerModule.isDarkMode }" class="flex items-center bg-transparent text-app-text-500 text-xs font-medium">
    <WifiIcon class="w-3 h-3 mr-1" /><span id="selected_network">{{ network }}</span>
  </div>
</template>

<style scoped>
.dark {
  padding-left: 1rem;
  padding-right: 1rem;
}
</style>

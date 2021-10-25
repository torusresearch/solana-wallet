<script setup lang="ts">
import { WifiIcon } from "@heroicons/vue/outline";

import { app } from "@/modules/app";
import ControllersModule from "@/modules/controllers";
const network = ControllersModule.torusState.NetworkControllerState.providerConfig.displayName;
</script>

<template>
  <div
    :class="{ dark: app.isDarkMode }"
    class="rounded-xl flex items-center dark:px-4 dark:bg-gray-700 bg-transparent font-body text-app-text-500 text-xs font-medium py-1"
  >
    <WifiIcon class="w-3 h-3 mr-1" />{{ network }}
  </div>
</template>

<style scoped>
.dark {
  padding-left: 1rem;
  padding-right: 1rem;
}
</style>

<script setup lang="ts">
import { WifiIcon } from "@heroicons/vue/outline";

import ControllersModule from "@/modules/controllers";
const network = ControllersModule.torusState.NetworkControllerState.providerConfig.displayName;
</script>

<template>
  <div class="rounded-xl flex items-center bg-gray-200 text-xs font-medium py-1 px-4"><WifiIcon class="w-3 h-3 mr-1" />{{ network }}</div>
</template>

<style scoped></style>

<script setup lang="ts">
import { WifiIcon } from "@heroicons/vue/outline";
import { computed } from "vue";

import ControllerModule from "@/modules/controllers";

const props = withDefaults(
  defineProps<{
    network?: string;
  }>(),
  {
    network: undefined,
  }
);
const network = computed(() => props.network || ControllerModule.torus.currentNetworkName);
</script>

<template>
  <div class="flex items-center bg-transparent text-app-text-500 text-xs font-medium">
    <WifiIcon class="w-3 h-3 mr-1" /><span id="selected_network">{{ network }}</span>
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount } from "vue";

import { Toast } from "@/components/common";

import ControllerModule from "./modules/controllers";
import { hideCrispButton, isMain } from "./utils/helpers";

onBeforeMount(() => {
  if (isMain) ControllerModule.init({ origin: window.location.origin });

  // hide crispbutton for iframe
  if (!isMain) {
    hideCrispButton();
  }
});
</script>

<template>
  <div :class="{ dark: ControllerModule.isDarkMode }" class="height-full font-body">
    <router-view />
    <Toast />
  </div>
</template>

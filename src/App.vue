<script setup lang="ts">
import { onMounted } from "vue";

import { Toast } from "@/components/common";

import ControllerModule from "./modules/controllers";
import { isMain } from "./utils/helpers";

onMounted(() => {
  if (isMain) ControllerModule.init({ origin: window.location.origin });
});
</script>

<template>
  <div :class="{ dark: ControllerModule.isDarkMode }">
    <router-view />
    <Toast />
  </div>
</template>

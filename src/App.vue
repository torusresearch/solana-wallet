<script setup lang="ts">
import { onMounted } from "vue";

import { Toast } from "@/components/common";
import { app } from "@/modules/app";

import ControllerModule from "./modules/controllers";
import { isMain } from "./utils/helpers";

onMounted(() => {
  if (isMain) ControllerModule.init({ origin: location.origin });
});
</script>

<template>
  <div :class="{ dark: app.isDarkMode }">
    <router-view />
    <Toast />
  </div>
</template>

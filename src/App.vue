<script setup lang="ts">
import { onMounted } from "@vue/runtime-core";

import { app } from "@/modules/app";

import ControllerModule from "./modules/controllers";

onMounted(() => {
  ControllerModule.init();
});
</script>

<template>
  <div :class="{ dark: app.isDarkMode }"><router-view /></div>
</template>

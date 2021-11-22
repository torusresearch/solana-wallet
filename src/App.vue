<script setup lang="ts">
import { onMounted } from "vue";

import { Toast } from "@/components/common";

import ControllersModule from "./modules/controllers";
import { isMain } from "./utils/helpers";

onMounted(() => {
  if (isMain) ControllersModule.init({ origin: window.location.origin });
});
</script>

<template>
  <div :class="{ dark: ControllersModule.isDarkMode }">
    <router-view />
    <Toast />
  </div>
</template>

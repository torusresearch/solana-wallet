<script setup lang="ts">
import { BroadcastChannel } from "broadcast-channel";
import { onMounted } from "vue";

import { Toast } from "@/components/common";

import ControllersModule from "./modules/controllers";
import { isMain } from "./utils/helpers";

const bc = new BroadcastChannel("LOGOUT_WINDOWS_CHANNEL");
onMounted(() => {
  if (isMain) ControllersModule.init({ origin: window.location.origin });
  bc.onmessage = (ev) => {
    if (ev === "logout" && !!ControllersModule.torus.selectedAddress) ControllersModule.logout();
  };
});
</script>

<template>
  <div :class="{ dark: ControllersModule.isDarkMode }">
    <router-view />
    <Toast />
  </div>
</template>

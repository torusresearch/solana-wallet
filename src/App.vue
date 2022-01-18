<script setup lang="ts">
import { BroadcastChannel } from "broadcast-channel";
import { onMounted } from "vue";

import { Toast } from "@/components/common";

import ControllerModule from "./modules/controllers";
import { isMain } from "./utils/helpers";

const bc = new BroadcastChannel("LOGOUT_WINDOWS_CHANNEL");
onMounted(() => {
  if (isMain) ControllerModule.init({ origin: window.location.origin });
  // since we might be using localstorage, logout from all the tabs open
  bc.onmessage = (ev) => {
    if (ev === "logout" && !!ControllerModule.torus.selectedAddress) ControllerModule.logout();
  };
});
</script>

<template>
  <div :class="{ dark: ControllerModule.isDarkMode }" class="height-full font-body">
    <router-view />
    <Toast />
  </div>
</template>

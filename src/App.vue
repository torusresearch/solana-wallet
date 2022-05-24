<script setup lang="ts">
import { BroadcastChannel } from "@toruslabs/broadcast-channel";
import { onBeforeMount } from "vue";

import { Toast } from "@/components/common";

import ControllerModule from "./modules/controllers";
import { hideCrispButton, isMain } from "./utils/helpers";

const bc = new BroadcastChannel("LOGOUT_WINDOWS_CHANNEL");
onBeforeMount(() => {
  if (isMain) ControllerModule.init({ origin: window.location.origin });
  // since we might be using localstorage, logout from all the tabs open
  bc.onmessage = (ev) => {
    if (ev === "logout" && !!ControllerModule.torus.selectedAddress) ControllerModule.logout();
  };

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

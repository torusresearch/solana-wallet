<script setup lang="ts">
import { onMounted } from "vue";

import ControllersModule from "../modules/controllers";
import { checkRedirectFlow, closeWindowTimeout } from "../utils/helpers";

const isRedirectFlow = checkRedirectFlow();
onMounted(async () => {
  await ControllersModule.logout();
  const logoutBC = new BroadcastChannel("LOGOUT_WINDOWS_ALL");
  logoutBC.postMessage("");
  if (isRedirectFlow) {
    // send logout to deeplink and close
    closeWindowTimeout();
  }
});
</script>

<template>
  <div>Logout</div>
</template>

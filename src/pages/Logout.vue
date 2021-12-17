<script setup lang="ts">
import { BroadcastChannel } from "broadcast-channel";
import { onMounted } from "vue";

import ControllerModule from "../modules/controllers";
import { checkRedirectFlow, redirectToResult } from "../utils/helpers";

const isRedirectFlow = checkRedirectFlow();
const queryParams = new URLSearchParams(window.location.search);
const method = queryParams.get("method");
const resolveRoute = queryParams.get("resolveRoute");
onMounted(async () => {
  const bc = new BroadcastChannel("LOGOUT_WINDOWS_CHANNEL");
  bc.postMessage("logout");
  await ControllerModule.logout();
  if (isRedirectFlow) {
    // send logout to deeplink and close
    redirectToResult(method, { success: true }, resolveRoute);
  }
});
</script>

<template>
  <div>Logout</div>
</template>

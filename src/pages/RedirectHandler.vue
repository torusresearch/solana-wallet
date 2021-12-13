<script setup lang="ts">
import { BROADCAST_CHANNELS, broadcastChannelOptions, RedirectHandler } from "@toruslabs/base-controllers";
import { BroadcastChannel } from "broadcast-channel";
import { onMounted } from "vue";

import { checkRedirectFlow, redirectToResult } from "../utils/helpers";

const isRedirectFlow = checkRedirectFlow();

const checkTopupSuccess = async () => {
  const queryParameters = new URLSearchParams(window.location.search);
  const instanceId = queryParameters.get("instanceId");
  const topupResult = queryParameters.get("topup");
  const method = queryParameters.get("method");
  const resolveRoute = queryParameters.get("resolveRoute");
  if (topupResult === "success" && !isRedirectFlow) {
    const bc = new BroadcastChannel(`${BROADCAST_CHANNELS.REDIRECT_CHANNEL}_${instanceId}`, broadcastChannelOptions);
    await bc.postMessage({ data: "topup success" });
    bc.close();
  }
  if (isRedirectFlow && topupResult) {
    redirectToResult(method, topupResult, resolveRoute);
  }
};
onMounted(async () => {
  // using normal broadcast messages flow
  checkTopupSuccess();
  const redirectHandler = new RedirectHandler();
  await redirectHandler.handle();
});
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-app-gray-800 flex justify-center items-center">
    <!-- <Loader /> -->
  </div>
</template>

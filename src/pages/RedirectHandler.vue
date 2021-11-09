<script setup lang="ts">
import { BROADCAST_CHANNELS, broadcastChannelOptions, RedirectHandler } from "@toruslabs/base-controllers";
import { BroadcastChannel } from "broadcast-channel";
import { onMounted } from "vue";

onMounted(async () => {
  checkTopupSuccess();
  const redirectHandler = new RedirectHandler();
  await redirectHandler.handle();
});

const checkTopupSuccess = async () => {
  const queryParameters = new URLSearchParams(window.location.search);
  const instanceId = queryParameters.get("instanceId");
  const topupResult = queryParameters.get("topup");
  if (topupResult === "success") {
    const bc = new BroadcastChannel(`${BROADCAST_CHANNELS.REDIRECT_CHANNEL}_${instanceId}`, broadcastChannelOptions);
    await bc.postMessage({ data: "topup success" });
    // await bc.postMessage({ error: "topup failed" });
    bc.close();
  }
};
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-app-gray-800 flex justify-center items-center">
    <!-- <Loader /> -->
  </div>
</template>

<script setup lang="ts">
import { BROADCAST_CHANNELS, broadcastChannelOptions, RedirectHandler } from "@toruslabs/base-controllers";
import { BroadcastChannel } from "broadcast-channel";
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";

import { redirectToResult, useRedirectFlow } from "../utils/redirectflow_helpers";

const { isRedirectFlow, method, resolveRoute } = useRedirectFlow();

const { t } = useI18n();

const checkTopupSuccess = async () => {
  const queryParameters = new URLSearchParams(window.location.search);
  const instanceId = queryParameters.get("instanceId");
  const topupResult = queryParameters.get("topup");
  if (topupResult === "success" && !isRedirectFlow) {
    const bc = new BroadcastChannel(`${BROADCAST_CHANNELS.REDIRECT_CHANNEL}_${instanceId}`, broadcastChannelOptions);
    await bc.postMessage({
      data: `${t("walletProvider.topup")} ${t("walletActivity.successful")}`,
    });
    bc.close();
  }
  if (isRedirectFlow && topupResult) {
    redirectToResult(method, topupResult, resolveRoute);
  }
};
onMounted(async () => {
  checkTopupSuccess();
  if (!isRedirectFlow) {
    const redirectHandler = new RedirectHandler();
    await redirectHandler.handle();
  }
});
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-app-gray-800 flex justify-center items-center">
    <!-- <Loader /> -->
  </div>
</template>

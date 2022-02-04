<script setup lang="ts">
import { RedirectHandler } from "@toruslabs/base-controllers";
import { onMounted } from "vue";

import { redirectToResult, useRedirectFlow } from "../utils/redirectflow_helpers";

const { isRedirectFlow, method, resolveRoute } = useRedirectFlow();

const checkTopupSuccess = async () => {
  const queryParameters = new URLSearchParams(window.location.search);
  const topupResult = queryParameters.get("topup");
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

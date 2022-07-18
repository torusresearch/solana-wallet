<script setup lang="ts">
import { RedirectHandler } from "@toruslabs/base-controllers";
import Loader from "@toruslabs/vue-components/common/Loader.vue";
import { onMounted } from "vue";

import { redirectToResult, useRedirectFlow } from "../utils/redirectflowHelpers";

const { isRedirectFlow, method, resolveRoute, req_id, jsonrpc } = useRedirectFlow();

const checkTopupSuccess = async () => {
  const queryParameters = new URLSearchParams(window.location.search);
  const state = queryParameters.get("state");
  if (isRedirectFlow && state) {
    redirectToResult(jsonrpc, { success: true, method }, req_id, resolveRoute);
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
    <Loader :use-spinner="true" />
  </div>
</template>

<script setup lang="ts">
import { Loader } from "@toruslabs/vue-components/common";
import { onMounted } from "vue";

import ControllerModule from "../modules/controllers";
import { redirectToResult, useRedirectFlow } from "../utils/redirectflow_helpers";

const { params, method, resolveRoute, req_id, jsonrpc } = useRedirectFlow();

onMounted(async () => {
  const res = await ControllerModule.handleRedirectFlow({ method, params, resolveRoute });
  if (method !== "topup") redirectToResult(jsonrpc, { data: res, method, success: true }, req_id, resolveRoute);
});
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-app-gray-800 flex justify-center items-center">
    <Loader />
  </div>
</template>

<script setup lang="ts">
import log from "loglevel";
import { onMounted } from "vue";

import BoxLoader from "@/components/common/BoxLoader.vue";

import ControllerModule from "../modules/controllers";
import { getB64DecodedParams, redirectToResult } from "../utils/helpers";

onMounted(async () => {
  const params = getB64DecodedParams();
  const queryParams = new URLSearchParams(window.location.search);
  const method = queryParams.get("method");
  const resolveRoute = queryParams.get("resolveRoute");
  let res: unknown;
  if (method) res = await ControllerModule.handleRedirectFlow({ method, params });
  log.info(res);
  if (method !== "topup") redirectToResult(method, res, resolveRoute);
});
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-app-gray-800 flex justify-center items-center">
    <BoxLoader />
  </div>
</template>

<script setup lang="ts">
import log from "loglevel";
import { onMounted } from "vue";

import BoxLoader from "@/components/common/BoxLoader.vue";

import ControllersModule from "../modules/controllers";
import { closeWindowTimeout, getB64DecodedParams } from "../utils/helpers";

onMounted(async () => {
  const params = getB64DecodedParams();
  const method = new URLSearchParams(window.location.search).get("method");
  let res: unknown;
  if (method) res = await ControllersModule.handleRedirectFlow({ method, params });
  log.info(method, res);
  if (method !== "topup") closeWindowTimeout();
});
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-app-gray-800 flex justify-center items-center">
    <BoxLoader />
  </div>
</template>

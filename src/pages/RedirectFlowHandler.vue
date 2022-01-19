<script setup lang="ts">
import { onMounted } from "vue";

import BoxLoader from "@/components/common/BoxLoader.vue";

import ControllerModule from "../modules/controllers";
import { redirectToResult, useRedirectFlow } from "../utils/helpers";

const { params, method, resolveRoute } = useRedirectFlow();

onMounted(async () => {
  if (method) {
    const res = await ControllerModule.handleRedirectFlow({ method, params });
    redirectToResult(method, res, resolveRoute);
  }
});
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-app-gray-800 flex justify-center items-center">
    <BoxLoader />
  </div>
</template>

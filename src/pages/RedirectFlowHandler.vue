<script setup lang="ts">
import { onMounted } from "vue";

import BoxLoader from "@/components/common/BoxLoader.vue";

import ControllerModule from "../modules/controllers";
import { useRedirectFlow } from "../utils/helpers";

const { params, method, resolveRoute, redirectToResult } = useRedirectFlow();

onMounted(async () => {
  let res: unknown;
  if (method) res = await ControllerModule.handleRedirectFlow({ method, params });
  if (method !== "topup") redirectToResult(method, res, resolveRoute);
});
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-app-gray-800 flex justify-center items-center">
    <BoxLoader />
  </div>
</template>

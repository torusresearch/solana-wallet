<script setup lang="ts">
import { onMounted } from "vue";

import ControllersModule from "../modules/controllers";
import { checkRedirectFlow, redirectToResult } from "../utils/helpers";

const isRedirectFlow = checkRedirectFlow();
const queryParams = new URLSearchParams(window.location.search);
const method = queryParams.get("method");
const resolveRoute = queryParams.get("resolveRoute");
onMounted(async () => {
  await ControllersModule.logout();
  if (isRedirectFlow) {
    // send logout to deeplink and close
    redirectToResult(method, { success: true }, resolveRoute);
  }
});
</script>

<template>
  <div>Logout</div>
</template>

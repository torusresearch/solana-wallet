<script setup lang="ts">
import { onMounted } from "vue";

import ControllersModule from "../modules/controllers";
import { checkRedirectFlow } from "../utils/helpers";

const isRedirectFlow = checkRedirectFlow();
onMounted(async () => {
  await ControllersModule.logout();
  if (isRedirectFlow) {
    // send logout to deeplink and close
    setTimeout(window.close, 0);
  }
});
</script>

<template>
  <div>Logout</div>
</template>

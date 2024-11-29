<script setup lang="ts">
import { onMounted } from "vue";

import Depreciated from "@/components/depreceiated/Depreciated.vue";

onMounted(async () => {
  // checkTopupSuccess();
  // if (!isRedirectFlow) {
  //   const redirectHandler = new RedirectHandler();
  //   await redirectHandler.handle();
  // }
});
</script>

<template>
  <Depreciated :use-new-content="true" />
</template>

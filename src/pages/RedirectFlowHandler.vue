<script setup lang="ts">
import { Loader } from "@toruslabs/vue-components/common";
import { onMounted } from "vue";

import { evalRedirectflow } from "../utils/redirectflow_helpers";

onMounted(async () => {
  await evalRedirectflow();
});
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-app-gray-800 flex justify-center items-center">
    <Loader :use-spinner="true" />
  </div>
</template>

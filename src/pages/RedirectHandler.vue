<script setup lang="ts">
import { RedirectHandler } from "@toruslabs/base-controllers";
import { onMounted } from "vue";

onMounted(async () => {
  const redirectHandler = new RedirectHandler();
  await redirectHandler.handle();
});
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-app-gray-800 flex justify-center items-center">
    <!-- <Loader /> -->
  </div>
</template>

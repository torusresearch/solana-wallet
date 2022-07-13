<script setup lang="ts">
import Loader from "@toruslabs/vue-components/common/Loader.vue";
</script>

<template>
  <div class="w-full h-full overflow-hidden bg-white dark:bg-app-gray-800 flex flex-col justify-center items-center">
    <Loader :use-spinner="true" />
  </div>
</template>

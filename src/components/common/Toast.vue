<script setup lang="ts">
import { XIcon } from "@heroicons/vue/outline";

import { app, removeToast } from "@/modules/app";

const typeClass = (type: string) => {
  if (type) return `bg-app-${type}`;
  return "bg-app-info";
};
</script>
<template>
  <div class="fixed bottom-5 gap-2 inset-x-0">
    <div
      v-for="(toast, idx) in app.toastMessages"
      :key="idx"
      class="relative mx-auto mt-2 font-body font-bold text-sm text-app-text-500 dark:text-white py-4 rounded-md w-80 sm:w-96 px-10"
      :class="typeClass(toast.type)"
    >
      <div class="text-center justify-self-center">{{ toast.message }}</div>
      <XIcon class="w-5 h-5 cursor-pointer absolute right-3 top-1/2 transform -translate-y-1/2" @click="removeToast(toast)" />
    </div>
  </div>
</template>

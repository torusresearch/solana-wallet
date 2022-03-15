<script setup lang="ts">
import { XIcon } from "@heroicons/vue/outline";

import { app, removeToast } from "@/modules/app";
import { STATUS } from "@/utils/enums";
</script>
<template>
  <div class="fixed bottom-5 gap-2 inset-x-0">
    <div
      v-for="(toast, idx) in app.toastMessages"
      :key="idx"
      class="relative mx-auto mt-2 font-bold text-sm py-4 rounded-md w-80 sm:w-96 px-10"
      :class="{
        'text-white bg-app-success': toast.type === STATUS.SUCCESS,
        'text-app-text-500 dark:text-white bg-app-warning': toast.type === STATUS.WARNING,
        'text-white bg-app-error': toast.type === STATUS.ERROR,
        'text-app-text-500 bg-app-info': toast.type === STATUS.INFO,
      }"
    >
      <div class="text-center justify-self-center">{{ toast.message }}</div>
      <XIcon class="w-5 h-5 cursor-pointer absolute right-3 top-1/2 -translate-y-1/2" @click="removeToast(toast)" />
    </div>
  </div>
</template>

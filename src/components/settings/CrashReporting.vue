<script setup lang="ts">
import { ref } from "vue";
import { Switch } from "@headlessui/vue";

const enabled = ref(false);
</script>
<template>
  <div class="pb-4">
    <div
      class="
        font-body
        text-sm
        mb-4
        text-app-text-600
        dark:text-app-text-dark-500
      "
    >
      Torus collects anonymous data about any crashes that occur to help improve
      our products and services.
    </div>
    <div class="flex items-center">
      <Switch
        v-model="enabled"
        :class="enabled ? 'bg-app-primary-500' : 'bg-app-primary-400'"
        class="relative inline-flex items-center h-6 rounded-full w-11 mr-2"
      >
        <span class="sr-only">Enable notifications</span>
        <span
          :class="enabled ? 'translate-x-6' : 'translate-x-1'"
          class="inline-block w-4 h-4 transform bg-white rounded-full"
        />
      </Switch>
      <div
        class="font-body text-app-text-500 dark:text-app-text-dark-500 text-sm"
      >
        Crash report was enabled
      </div>
    </div>
  </div>
</template>

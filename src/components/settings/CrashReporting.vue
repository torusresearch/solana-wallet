<script setup lang="ts">
import { Switch } from "@headlessui/vue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import ControllersModule from "@/modules/controllers";

const { t } = useI18n();
const enabled = computed(() => ControllersModule.crashReport);
</script>
<template>
  <div class="pb-4">
    <div class="font-body text-sm mb-4 text-app-text-600 dark:text-app-text-dark-500">
      {{ t("walletSettings.explainCrashReport") }}
    </div>
    <div class="flex items-center">
      <Switch
        :model="enabled"
        :class="enabled ? 'bg-app-primary-500' : 'bg-app-primary-400'"
        class="relative inline-flex items-center h-6 rounded-full w-11 mr-2"
        @update:model-value="(v) => ControllersModule.setCrashReport(!ControllersModule.crashReport)"
      >
        <span class="sr-only">{{ t("walletSettings.enableNotifications") }}</span>
        <span :class="enabled ? 'translate-x-6' : 'translate-x-1'" class="inline-block w-4 h-4 transform bg-white rounded-full" />
      </Switch>
      <div class="font-body text-app-text-500 dark:text-app-text-dark-500 text-sm">{{ t("walletSettings.crashReportIsEnabled") }}</div>
    </div>
  </div>
</template>

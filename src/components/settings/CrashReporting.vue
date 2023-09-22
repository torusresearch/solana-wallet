<script setup lang="ts">
import { Switch } from "@headlessui/vue";
import { computed } from "vue";

import ControllerModule from "@/modules/controllers";
import { i18n } from "@/plugins/i18nPlugin";

const { t } = i18n.global;
const enabled = computed(() => ControllerModule.crashReport);
</script>
<template>
  <div class="pb-4">
    <div class="text-sm mb-4 text-app-text-600 dark:text-app-text-dark-500 whitespace-normals">
      {{ t("walletSettings.explainCrashReport") }}
    </div>
    <div class="flex items-center">
      <Switch
        :model="enabled"
        :class="enabled ? 'bg-app-primary-500' : 'bg-app-gray-600'"
        class="relative inline-flex items-center h-6 rounded-full w-11 mr-2"
        @update:model-value="(v) => ControllerModule.setCrashReport(!ControllerModule.crashReport)"
      >
        <span class="sr-only">{{ t("walletSettings.enableNotifications") }}</span>
        <span :class="enabled ? 'translate-x-6' : 'translate-x-1'" class="inline-block w-4 h-4 bg-white rounded-full transition-transform" />
      </Switch>
      <div class="text-app-text-500 dark:text-app-text-dark-500 text-sm">
        {{ enabled ? t("walletSettings.crashReportIsEnabled") : t("walletSettings.crashReportIsDisabled") }}
      </div>
    </div>
  </div>
</template>

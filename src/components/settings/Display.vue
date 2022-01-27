<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { Button } from "@/components/common";
import ControllerModule from "@/modules/controllers";

const { t } = useI18n();
</script>
<template>
  <div class="pb-4">
    <div class="text-sm mb-2 text-app-text-600 dark:text-app-text-dark-500">{{ t("walletSettings.selectTheme") }}</div>
    <div class="grid grid-cols-2 space-x-3">
      <div>
        <Button
          class="w-full"
          :variant="ControllerModule.isDarkMode ? 'tertiary' : 'primary'"
          :block="true"
          @click="ControllerModule.setTheme('light')"
          >{{ t("walletSettings.light") }}</Button
        >
      </div>
      <div>
        <Button
          :variant="ControllerModule.isDarkMode ? 'primary' : 'tertiary'"
          :block="true"
          class="w-full"
          @click="ControllerModule.setTheme('dark')"
          >{{ t("walletSettings.dark") }}</Button
        >
      </div>
    </div>
  </div>
</template>

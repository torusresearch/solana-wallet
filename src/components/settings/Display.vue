<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { Button } from "@/components/common";
import ControllersModule from "@/modules/controllers";

const { t } = useI18n();
</script>
<template>
  <div class="pb-4">
    <div class="text-sm font-body mb-2 text-app-text-600 dark:text-app-text-dark-500">{{ t("walletSettings.selectTheme") }}</div>
    <div class="grid grid-cols-2 space-x-3">
      <div>
        <Button :variant="ControllersModule.isDarkMode ? 'tertiary' : 'primary'" :block="true" @click="ControllersModule.setTheme('light')">{{
          t("walletSettings.light")
        }}</Button>
      </div>
      <div>
        <Button :variant="ControllersModule.isDarkMode ? 'primary' : 'tertiary'" :block="true" @click="ControllersModule.setTheme('dark')">{{
          t("walletSettings.dark")
        }}</Button>
      </div>
    </div>
  </div>
</template>

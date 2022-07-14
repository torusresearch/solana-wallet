<script setup lang="ts">
import { useI18n } from "vue-i18n";

import { Button } from "@/components/common";
import { SettingsPageInteractions } from "@/directives/google-analytics";
import ControllerModule from "@/modules/controllers";
import { isWhiteLabelActive, overrideTheme } from "@/utils/white_label";

const { t } = useI18n();
function changeTheme(theme: "light" | "dark") {
  if (isWhiteLabelActive()) overrideTheme();
  ControllerModule.setTheme(theme);
}
</script>
<template>
  <div class="pb-4">
    <div class="text-sm mb-2 text-app-text-600 dark:text-app-text-dark-500">{{ t("walletSettings.selectTheme") }}</div>
    <div class="grid grid-cols-2 space-x-3">
      <div>
        <Button
          v-ga="SettingsPageInteractions.DISPLAY + 'light'"
          class="w-full"
          :variant="ControllerModule.isDarkMode ? 'tertiary' : 'primary'"
          :block="true"
          @click="changeTheme('light')"
          >{{ t("walletSettings.light") }}</Button
        >
      </div>
      <div>
        <Button
          v-ga="SettingsPageInteractions.DISPLAY + 'dark'"
          :variant="ControllerModule.isDarkMode ? 'primary' : 'tertiary'"
          :block="true"
          class="w-full"
          @click="changeTheme('dark')"
          >{{ t("walletSettings.dark") }}</Button
        >
      </div>
    </div>
  </div>
</template>

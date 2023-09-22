<script setup lang="ts">
import { computed } from "vue";

import { SelectField } from "@/components/common";
import { SettingsPageInteractions, trackUserClick } from "@/directives/google-analytics";
import ControllerModule from "@/modules/controllers";
import { i18n, setLocale } from "@/plugins/i18nPlugin";
import { LOCALES } from "@/utils/enums";

const { t } = i18n.global;

const selectedLanguage = computed({
  get: () => LOCALES.find((x) => x.value === i18n.global.locale) || LOCALES[0],
  set: (value) => {
    if (value) {
      trackUserClick(SettingsPageInteractions.LANGAUGE + (value.value || ""));
      setLocale(i18n, value.value);
      ControllerModule.setLocale(value.value);
    }
  },
});
</script>
<template>
  <div class="pb-4">
    <div class="mb-4">
      <SelectField v-if="selectedLanguage" v-model="selectedLanguage" :label="t('walletSettings.language')" :items="LOCALES" />
    </div>
  </div>
</template>

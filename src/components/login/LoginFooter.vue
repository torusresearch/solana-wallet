<script setup lang="ts">
import { i18n } from "@/plugins/i18nPlugin";

withDefaults(
  defineProps<{
    thirdPartyAuthenticatorList: string;
    isEmbed?: boolean;
  }>(),
  {
    thirdPartyAuthenticatorList: "",
    isEmbed: false,
  }
);
const { t } = i18n.global;
</script>

<template>
  <div class="mt-8 mb-2 w-full" :class="{ 'sm:w-10/12': !isEmbed }">
    <div v-if="!isEmbed" class="text-xs text-app-text-600 dark:text-app-text-dark-500 font-bold mb-2">{{ t("dappLogin.note") }}</div>
    <div v-if="!isEmbed" class="text-xs text-app-text-400 dark:text-app-text-dark-600 font-light mb-2">
      {{ t("login.dataPrivacy") }}
    </div>
    <div v-if="thirdPartyAuthenticatorList" class="text-xs text-app-text-400 dark:text-app-text-dark-600 font-light">
      {{ t("dappLogin.termsAuth01") }} {{ thirdPartyAuthenticatorList }}.
    </div>
  </div>

  <div class="inset-0 flex items-center mt-4 mb-1" aria-hidden="true">
    <div class="w-full border-t border-gray-300" />
  </div>

  <div class="space-x-3">
    <a class="text-xs text-app-primary-500" href="https://docs.tor.us/legal/terms-and-conditions" target="_blank" rel="noopener noreferrer">{{
      t("dappLogin.termsConditions")
    }}</a>
    <a class="text-xs text-app-primary-500" href="https://docs.tor.us/legal/privacy-policy" target="_blank" rel="noopener noreferrer">{{
      t("dappLogin.privacyPolicy")
    }}</a>
    <a class="text-xs text-app-primary-500" href="https://t.me/TorusLabs" target="_blank" rel="noopener noreferrer">{{ t("dappLogin.contactUs") }}</a>
  </div>
</template>

<style scoped></style>

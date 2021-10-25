<script setup lang="ts">
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
</script>

<template>
  <div class="mt-8 mb-2 w-full" :class="{ 'sm:w-10/12': !isEmbed }">
    <div v-if="!isEmbed" class="font-body text-xs text-app-text-600 dark:text-app-text-dark-500 font-bold mb-2">Note:</div>
    <div v-if="!isEmbed" class="font-body text-xs text-app-text-400 dark:text-app-text-dark-600 font-light mb-2">
      Torus does not store any data related to your social logins.
    </div>
    <div v-if="thirdPartyAuthenticatorList" class="font-body text-xs text-app-text-400 dark:text-app-text-dark-600 font-light">
      The following sign-ins involve a third party authenticator: {{ thirdPartyAuthenticatorList }}.
    </div>
  </div>

  <div class="inset-0 flex items-center mt-4 mb-1" aria-hidden="true">
    <div class="w-full border-t border-gray-300" />
  </div>

  <div class="space-x-3">
    <a class="font-body text-xs text-app-primary-500" href="https://docs.tor.us/legal/terms-and-conditions" target="_blank">Terms of Service</a>
    <a class="font-body text-xs text-app-primary-500" href="https://docs.tor.us/legal/privacy-policy" target="_blank">Privacy Policy</a>
    <a class="font-body text-xs text-app-primary-500" href="https://t.me/TorusLabs" target="_blank">Contact us</a>
  </div>
</template>

<style scoped></style>

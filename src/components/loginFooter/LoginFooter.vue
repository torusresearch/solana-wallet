<script setup lang="ts">
import { useI18n } from "vue-i18n";

import Web3AuthLogo from "@/assets/web3auth.svg";

const { t } = useI18n();

const footerSupportLinks = [
  { href: "https://docs.tor.us/legal/terms-and-conditions", translateText: "dappLogin.termsConditions" },
  { href: "https://docs.tor.us/legal/privacy-policy", translateText: "dappLogin.privacyPolicy" },
  { href: "https://t.me/TorusLabs", translateText: "dappLogin.contactUs" },
];
</script>
<template>
  <div class="mt-8 mb-2 w-full">
    <div class="text-xs text-app-text-600 dark:text-app-gray-400 mb-1">Self Custodial Login by</div>
    <img :src="Web3AuthLogo" alt="web3auth" />
    <div class="text-xs text-app-text-400 dark:text-app-text-dark-600 font-light mt-3 mb-4">
      <a class="underline text-app-gray-500 font-normal" href="https://docs.web3auth.io/" target="_blank" rel="noreferrer noopener">
        How does this works?
      </a>
    </div>
    <div class="text-xs text-app-text-600 dark:text-app-text-dark-500 mb-5">Web3Auth does not store any data related to your social logins.</div>
  </div>

  <div class="inset-0 flex items-center mt-4 mb-1" aria-hidden="true">
    <div class="w-full border-t border-gray-300" />
  </div>

  <div class="space-x-3">
    <template v-for="footerSupportLink in footerSupportLinks" :key="footerSupportLink.translateText">
      <a class="text-xs text-app-primary-500" :href="footerSupportLink.href" target="_blank">{{ t(footerSupportLink.translateText) }}</a>
    </template>
  </div>
</template>

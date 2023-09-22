<script setup lang="ts">
import { GithubIcon } from "@toruslabs/vue-icons/symbols";

import { Button } from "@/components/common";
import { i18n } from "@/plugins/i18nPlugin";

const { t } = i18n.global;

const accounts = [
  {
    id: "lionell@tor.us",
    default: true,
  },
  {
    id: "OpenLogin account",
    default: false,
  },
];
</script>
<template>
  <div class="pb-4">
    <div class="text-sm mb-2 text-app-text-600 dark:text-app-text-dark-500">{{ t("tkeySettings.accounts") }}</div>
    <ul class="border dark:border-app-gray-900 rounded-md divide-y dark:divide-gray-900 shadow dark:shadow-dark mb-2">
      <li v-for="account in accounts" :key="account.id" class="flex items-center py-3 px-4">
        <div class="flex items-center">
          <div class="bg-app-gray-400 text-app-text-500 rounded-full flex justify-center items-center w-4 h-4 text-xs mr-2">
            <GithubIcon class="w-3 h-3" />
          </div>
          <div class="text-xs text-app-text-500 dark:text-app-text-dark-500">
            {{ account.id }}
          </div>
        </div>
        <div class="ml-auto flex">
          <div v-if="account.default" class="text-xs text-app-text-500 dark:text-app-text-dark-500">{{ t("tkeySettings.default") }}</div>
          <Button v-else variant="text">{{ t("tkeySettings.switchDefault") }}</Button>
        </div>
      </li>
    </ul>
    <div class="text-xs text-app-text-400 dark:text-app-text-dark-500 px-2">
      {{ `${t("tkeySettings.note")}: ${t("tkeySettings.theSelectedAccount")}` }}
    </div>
  </div>
</template>

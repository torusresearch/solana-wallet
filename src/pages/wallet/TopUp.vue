<script setup lang="ts">
import { RadioGroup, RadioGroupDescription, RadioGroupLabel, RadioGroupOption } from "@headlessui/vue";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import controllerModule from "@/modules/controllers";
import { activeProvider, topupPlugin } from "@/plugins/Topup";
import { TOPUP, TopUpProvider } from "@/plugins/Topup/interface";
import { getBrandColor } from "@/utils/whitelabel";

const router = useRouter();

const routeName = router.currentRoute.value.name === "walletTopUp" ? TOPUP.MOONPAY : router.currentRoute.value.name;
const selectedProvider = ref<TopUpProvider>(topupPlugin[routeName?.toString() || TOPUP.MOONPAY]);
const providers = activeProvider.map((item) => topupPlugin[item]);
const { t } = useI18n();

watch(selectedProvider, () => {
  router.push({ name: selectedProvider.value.name });
});
</script>

<template>
  <div class="py-2">
    <dl class="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-2">
      <RadioGroup v-model="selectedProvider">
        <RadioGroupLabel class="sr-only">{{ t("walletTopUp.serverSize") }}</RadioGroupLabel>
        <div class="space-y-4">
          <RadioGroupOption v-for="provider in providers" :key="provider.name" v-slot="{ checked }" :value="provider" as="template">
            <div
              class="relative grid grid-cols-2 rounded-md border bg-white dark:bg-app-gray-700 shadow dark:shadow-dark px-4 md:px-6 py-4 cursor-pointer hover:bg-app-gray-200 focus:outline-none border-app-primary-500"
              :class="checked ? 'border-app-primary-500' : 'border-app-gray-200 dark:border-transparent'"
            >
              <div class="flex col-span-1 items-center">
                <div class="mr-3">
                  <svg class="w-6 h-6" :class="checked ? 'text-app-primary-500' : 'text-app-gray-600'" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="11" :stroke="getBrandColor() || `currentColor`" />
                    <circle v-if="checked" cx="12" cy="12" r="8" :fill="getBrandColor() || `currentColor`" />
                  </svg>
                </div>
                <img :src="provider.logo(controllerModule.isDarkMode)" :alt="provider.name" class="w-24" />
              </div>
              <RadioGroupDescription as="div" class="col-span-1 whitespace-pre-wrap">
                <div class="text-right font-medium text-xs text-app-text-600 dark:text-app-text-dark-500">
                  {{ `${t("walletTopUp.paywith")} ${provider.paymentMethod}` }}
                </div>
                <div class="text-right font-medium text-xs text-app-text-600 dark:text-app-text-dark-500">
                  <span class="font-bold">{{ `${t("walletTopUp.fees")}:` }}</span
                  >: {{ provider.fee }}
                </div>
                <div class="text-right ml-1 text-xs text-app-text-600 dark:text-app-text-dark-500 md:ml-0">
                  <span class="font-bold">{{ t("walletTopUp.limits") }}</span
                  >: {{ provider.limit }}
                </div>
                <div class="text-right ml-1 text-xs text-app-text-600 dark:text-app-text-dark-500 md:ml-0">
                  <span class="font-bold">{{ t("walletTopUp.currencies") }}</span
                  >:
                  {{ provider.validCryptocurrencies.map((k) => k.value).join(", ") }}
                </div>
              </RadioGroupDescription>
            </div>
          </RadioGroupOption>
        </div>
      </RadioGroup>
      <router-view></router-view>
    </dl>
  </div>
</template>

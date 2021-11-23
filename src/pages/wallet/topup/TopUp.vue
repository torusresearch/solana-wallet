<script setup lang="ts">
import { RadioGroup, RadioGroupDescription, RadioGroupLabel, RadioGroupOption } from "@headlessui/vue";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import WalletTabs from "@/components/WalletTabs.vue";
import { RAMPNETWORK } from "@/utils/enums";
import { TopupProvider, TopupProviders } from "@/utils/topup";

const router = useRouter();

const selectedProvider = ref<TopupProvider>();
const providers = Object.values(TopupProviders);
onMounted(() => {
  selectedProvider.value = TopupProviders[RAMPNETWORK];
  const routeName = router.currentRoute.value.name;
  if (routeName === "walletTopup") {
    // no gateway is selected, navigate to first one
    router.push({ name: "rampNetwork" });
  }
});
</script>

<template>
  <WalletTabs tab="topup">
    <div class="py-2">
      <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
        <RadioGroup v-model="selectedProvider">
          <RadioGroupLabel class="sr-only">Server size</RadioGroupLabel>
          <div class="space-y-4">
            <RadioGroupOption v-for="provider in providers" :key="provider.name" v-slot="{ checked }" :value="provider" as="template">
              <div
                class="
                  relative
                  grid grid-cols-2
                  rounded-md
                  border
                  bg-white
                  dark:bg-app-gray-700
                  shadow
                  dark:shadow-dark
                  px-4
                  sm:px-6
                  py-4
                  cursor-pointer
                  hover:bg-app-gray-200
                  focus:outline-none
                "
                :class="checked ? 'border-app-primary-500' : 'border-app-gray-200 dark:border-transparent'"
              >
                <div class="flex col-span-1 items-center">
                  <div class="mr-3">
                    <svg class="w-6 h-6" :class="checked ? 'text-app-primary-500' : 'text-app-gray-600'" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="11" stroke="currentColor" />
                      <circle v-if="checked" cx="12" cy="12" r="8" fill="currentColor" />
                    </svg>
                  </div>
                  <img :src="provider.logo()" :alt="provider.name" class="w-24" />
                </div>
                <RadioGroupDescription as="div" class="col-span-1">
                  <div class="text-right font-medium text-xs text-app-text-600 dark:text-app-text-dark-500">
                    Pay with {{ provider.paymentMethod }}
                  </div>
                  <div class="text-right font-medium text-xs text-app-text-600 dark:text-app-text-dark-500">
                    <span class="font-bold">Fees</span>: {{ provider.fee }}
                  </div>
                  <div class="text-right ml-1 text-xs text-app-text-600 dark:text-app-text-dark-500 sm:ml-0">
                    <span class="font-bold">Limit</span>: {{ provider.limit }}
                  </div>
                  <div class="text-right ml-1 text-xs text-app-text-600 dark:text-app-text-dark-500 sm:ml-0">
                    <span class="font-bold">Currencies</span>:
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
  </WalletTabs>
</template>

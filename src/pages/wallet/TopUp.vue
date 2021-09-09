<script setup lang="ts">
import { ref } from "vue";
import {
  RadioGroup,
  RadioGroupDescription,
  RadioGroupLabel,
  RadioGroupOption,
} from "@headlessui/vue";

import WalletTabs from "@/components/WalletTabs.vue";
import { Button, SelectField, TextField } from "@/components/common";

const providers = [
  {
    name: "Moonpay",
    description:
      "Moonpay is a secure way to buy cryptocurrency with your payment method. Start by entering an amount below to get a quote before making a purchase",
    paymentMethod: "Credit / Debit / Apple Pay",
    fee: "4.5% or 5 USD",
    limit: "2,000€/day",
    logo: "https://app.tor.us/v1.13.2/img/moonpay-logo.90c07828.svg",
    currencies: ["ETH", "DAI", "TUSD", "USDC", "USDT", "BNB", "BUSD"],
  },
  {
    name: "Wyre",
    description:
      "Wyre is a secure way to buy cryptocurrency with your payment method. Start by entering an amount below to get a quote before making a purchase",
    paymentMethod: "Credit / Debit / Apple Pay",
    fee: "4.9% + 30c or 5 USD",
    limit: "$250/day",
    logo: "https://app.tor.us/v1.13.2/img/wyre-logo.41ddc839.svg",
    currencies: ["ETH", "DAI", "USDT", "USDC"],
  },
];
const selectedProvider = ref(providers[0]);

const currencies = [
  {
    value: "ETH",
    label: "ETH",
  },
  {
    value: "DAI",
    label: "DAI",
  },
  {
    value: "BAT",
    label: "BAT",
  },
  {
    value: "USDT",
    label: "USDT",
  },
  {
    value: "OKB",
    label: "OKB",
  },
];
const selectedCurrency = ref(currencies[0]);
</script>

<template>
  <WalletTabs tab="topup">
    <div class="py-2">
      <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
        <RadioGroup v-model="selectedProvider">
          <RadioGroupLabel class="sr-only">Server size</RadioGroupLabel>
          <div class="space-y-4">
            <RadioGroupOption
              v-for="provider in providers"
              :key="provider.name"
              v-slot="{ checked }"
              :value="provider"
              as="template"
            >
              <div
                class="
                  relative
                  flex
                  rounded-md
                  border
                  bg-white
                  dark:bg-app-gray-700
                  shadow
                  dark:shadow-dark
                  px-6
                  py-4
                  cursor-pointer
                  hover:bg-app-gray-200
                  sm:flex sm:justify-between
                  focus:outline-none
                "
                :class="
                  checked
                    ? 'border-app-primary-500'
                    : 'border-app-gray-200 dark:border-transparent'
                "
              >
                <div class="flex flex-shrink-1 items-center">
                  <div class="mr-3">
                    <svg
                      class="w-6 h-6"
                      :class="
                        checked ? 'text-app-primary-500' : 'text-app-gray-600'
                      "
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle cx="12" cy="12" r="11" stroke="currentColor" />
                      <circle
                        v-if="checked"
                        cx="12"
                        cy="12"
                        r="8"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                  <img
                    :src="provider.logo"
                    :alt="provider.name"
                    style="width: 130px"
                  />
                </div>
                <RadioGroupDescription
                  as="div"
                  class="
                    mt-2
                    flex flex-shrink-0
                    sm:mt-0 sm:block sm:ml-4 sm:text-right
                  "
                >
                  <div
                    class="
                      font-medium
                      text-xs text-app-text-600
                      dark:text-app-text-dark-500
                    "
                  >
                    Pay with {{ provider.paymentMethod }}
                  </div>
                  <div
                    class="
                      font-medium
                      text-xs text-app-text-600
                      dark:text-app-text-dark-500
                    "
                  >
                    <span class="font-bold">Fees</span>: {{ provider.fee }}
                  </div>
                  <div
                    class="
                      ml-1
                      text-xs text-app-text-600
                      dark:text-app-text-dark-500
                      sm:ml-0
                    "
                  >
                    <span class="font-bold">Limit</span>: {{ provider.limit }}
                  </div>
                  <div
                    class="
                      ml-1
                      text-xs text-app-text-600
                      dark:text-app-text-dark-500
                      sm:ml-0
                    "
                  >
                    <span class="font-bold">Currencies</span>:
                    {{ provider.currencies.join(", ") }}
                  </div>
                </RadioGroupDescription>
              </div>
            </RadioGroupOption>
          </div>
        </RadioGroup>
        <form action="#" method="POST">
          <div
            class="
              shadow
              dark:shadow-dark
              bg-white
              dark:bg-app-gray-700
              sm:rounded-md sm:overflow-hidden
            "
          >
            <div class="py-6 px-4 space-y-6 sm:p-6">
              <div>
                <p
                  class="
                    mt-1
                    text-sm text-app-text-600
                    dark:text-app-text-dark-500
                  "
                >
                  {{ selectedProvider.description }}
                </p>
              </div>

              <div class="grid grid-cols-3">
                <div class="col-span-1">
                  <SelectField
                    v-model="selectedCurrency"
                    label="You buy"
                    :items="currencies"
                  />
                </div>
              </div>
              <div class="grid grid-cols-3 space-x-4">
                <div class="col-span-2">
                  <TextField label="You pay" />
                </div>
                <div class="col-span-1">
                  <SelectField class="mt-6" :items="currencies" />
                </div>
              </div>
              <div class="flex flex-col items-end mb-5">
                <div class="text-app-text-600 dark:text-app-text-dark-500">
                  You receive
                </div>
                <div
                  class="
                    text-2xl
                    font-bold
                    text-app-text-600
                    dark:text-app-text-dark-500
                  "
                >
                  0 ETH
                </div>
                <div
                  class="
                    text-xs
                    font-light
                    text-app-text-500
                    dark:text-app-text-dark-500
                  "
                >
                  Rate: 1 ETH = 3697.37 USD
                </div>
              </div>
              <div
                class="
                  text-right text-xs text-app-text-600
                  dark:text-app-text-dark-500
                "
              >
                <div>The process would take approximately 10 - 15 min.</div>
                <div>
                  Please prepare your Identity Card/Passport to complete the
                  purchase.
                </div>
              </div>
            </div>
            <div class="px-4 py-3 mb-4 sm:px-6">
              <Button class="ml-auto mb-2" variant="primary">Save</Button>
              <div
                class="
                  text-right text-xs text-app-text-600
                  dark:text-app-text-dark-500
                "
              >
                You will be redirected to the third party page
              </div>
            </div>
          </div>
        </form>
      </dl>
    </div>
  </WalletTabs>
</template>

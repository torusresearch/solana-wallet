<script setup lang="ts">
import { get } from "@toruslabs/http-helpers";
import { onMounted } from "@vue/runtime-core";
import useVuelidate from "@vuelidate/core";
import { helpers, maxValue, minValue, required } from "@vuelidate/validators";
import { throttle } from "lodash";
import log from "loglevel";
import { ref, watch } from "vue";

import { Button, SelectField, TextField } from "@/components/common";
import ControllerModule from "@/modules/controllers";
import { topupProviders } from "@/pages/wallet/topup/topup-helper";
import { RAMPNETWORK } from "@/utils/enums";

import config from "../../../config";

const selectedProvider = topupProviders[RAMPNETWORK];
const selectedCryptocurrency = ref(selectedProvider.validCryptocurrencies[0]);
const selectedCurrency = ref(selectedProvider.validCurrencies[0]);
const cryptoCurrencyRate = ref(0);
const receivingCryptoAmount = ref(0);
const amount = ref(0);
const isLoadingQuote = ref(false);
let transferData: { feeRate: any; rate: any; decimals: number } | undefined;

watch(selectedCryptocurrency, throttle(refreshTransferEstimate, 500));
watch([selectedCurrency, amount], throttle(evaluateTransactionQuote, 500));

async function refreshTransferEstimate(val: any) {
  transferData = undefined;
  isLoadingQuote.value = true;
  try {
    transferData = await getQuote({ ramp_symbol: val.ramp_symbol });
    isLoadingQuote.value = false;
  } catch (e) {
    // TODO : show error
    isLoadingQuote.value = false;
  }
  evaluateTransactionQuote();
}

export async function getQuote(payload: { ramp_symbol?: any }): Promise<{
  feeRate: number;
  rate: number;
  decimals: number;
}> {
  let response: any;
  try {
    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };
    response = get(`${config.rampApiQuoteHost}`, options);
  } catch (error) {
    log.error(error);
    throw error;
  }
  const asset = (await response).assets.find((item: any) => item.symbol === payload.ramp_symbol); // the ramp asset object
  const rate = asset.price;
  const feeRate = asset.maxFeePercent;
  return { feeRate, rate, decimals: asset.decimals };
}

async function evaluateTransactionQuote() {
  const rate = transferData?.rate[selectedCurrency.value.value] || 0; // per unit price of token in fiat currency
  const feeRate = transferData?.feeRate[selectedCurrency.value.value] / 100 || 0; // per unit price of transaction fees for 1 token in fiat currency
  cryptoCurrencyRate.value = transferData?.rate[selectedCurrency.value.value] || 0;
  receivingCryptoAmount.value = rate && !$v.value.$invalid ? amount.value / (1 + feeRate) / rate : 0; // Final Crypto amount
}
const rules = {
  amount: {
    required: helpers.withMessage("Required", required),
    minValue: helpers.withMessage("Minimum transaction amount is 50.", minValue(50)),
    maxValue: helpers.withMessage("Maximum transaction amount is 20,000.", maxValue(20000)),
  },
};

const $v = useVuelidate(rules, { amount });

const onSave = () => {
  $v.value.$touch();
  if (!$v.value.$invalid) {
    ControllerModule.whatever(
      selectedCryptocurrency.value.ramp_symbol,
      Math.trunc(receivingCryptoAmount.value * Math.pow(10, transferData?.decimals || 0))
    );
  }
};

onMounted(() => {
  refreshTransferEstimate(selectedCryptocurrency.value);
});
</script>

<template>
  <form @submit.prevent="onSave">
    <div class="shadow dark:shadow-dark bg-white dark:bg-app-gray-700 sm:rounded-md sm:overflow-hidden">
      <div class="py-6 px-4 space-y-6 sm:p-6">
        <div>
          <p class="mt-1 text-sm text-app-text-600 dark:text-app-text-dark-500">
            {{ selectedProvider.description }}
          </p>
        </div>

        <div class="grid grid-cols-3">
          <div class="col-span-3 sm:col-span-1">
            <SelectField v-model="selectedCryptocurrency" label="You buy" :items="selectedProvider.validCryptocurrencies" />
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div class="col-span-3 sm:col-span-2">
            <TextField v-model.lazy="amount" :errors="$v.amount.$errors" type="number" label="You pay" />
            <p class="text-left text-xs mt-2 text-app-text-600 dark:text-app-text-dark-500">
              Includes transaction cost of {{ selectedProvider.fee }} <br />
              Minimum transaction amount: 50 {{ selectedCurrency.value }}
            </p>
          </div>
          <div class="col-span-3 sm:col-span-1">
            <SelectField v-model="selectedCurrency" class="sm:mt-6" :items="selectedProvider.validCurrencies" />
          </div>
        </div>
        <div v-if="!isLoadingQuote" class="flex flex-col items-end mb-5">
          <div class="text-app-text-600 dark:text-app-text-dark-500">You receive</div>
          <div class="text-2xl font-bold text-app-text-600 dark:text-app-text-dark-500">
            {{ receivingCryptoAmount }} {{ selectedCryptocurrency.value }}
          </div>
          <div class="text-xs font-light text-app-text-500 dark:text-app-text-dark-500">
            Rate: 1 {{ selectedCryptocurrency.value }} = {{ cryptoCurrencyRate }} {{ selectedCurrency.value }}
          </div>
        </div>
        <p v-if="isLoadingQuote" class="h-16 text-right text-xs text-app-text-600 dark:text-app-text-dark-500">
          Please wait while we fetch fresh quote prices.
        </p>
        <div class="text-right text-xs text-app-text-600 dark:text-app-text-dark-500">
          <div>The process would take approximately 5 - 10 min.</div>
          <div>Please prepare your Identity Card/Passport to complete the purchase.</div>
        </div>
      </div>
      <div class="px-4 py-3 mb-4 sm:px-6">
        <Button class="ml-auto mb-2" variant="primary" type="submit" :disabled="$v.$dirty && $v.$invalid">Save</Button>
        <div class="text-right text-xs text-app-text-600 dark:text-app-text-dark-500">You will be redirected to the third party page</div>
      </div>
    </div>
  </form>
</template>

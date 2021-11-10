<script setup lang="ts">
import { get } from "@toruslabs/http-helpers";
import { useVuelidate } from "@vuelidate/core";
import { helpers, maxValue, minValue, required } from "@vuelidate/validators";
import { throttle } from "lodash-es";
import log from "loglevel";
import { onMounted, ref, watch } from "vue";

import { Button, RoundLoader, SelectField, TextField } from "@/components/common";
import config from "@/config";
import ControllerModule from "@/modules/controllers";
import { RAMPNETWORK } from "@/utils/enums";
import { TopupProviders } from "@/utils/topup";

const selectedProvider = TopupProviders[RAMPNETWORK];
const selectedCryptocurrency = ref(selectedProvider.validCryptocurrencies[0]);
const selectedCurrency = ref(selectedProvider.validCurrencies[0]);
const currency = ControllerModule.torus.currentCurrency;

const cryptoCurrencyRate = ref(0);
const receivingCryptoAmount = ref(0);
const amount = ref(0);
const isLoadingQuote = ref(false);
type QuoteAsset = {
  symbol: string;
  price: { [currency: string]: number };
  maxFeePercent: { [currency: string]: number };
  decimals: number;
};
type QuoteApiResponse = {
  assets: QuoteAsset[];
};
let rampQuoteData: { feeRate: { [currency: string]: number }; rate: { [currency: string]: number }; decimals: number } | undefined;
const rules = {
  amount: {
    required: helpers.withMessage("Required", required),
    minValue: helpers.withMessage("Minimum transaction amount is 10.", minValue(10)),
    maxValue: helpers.withMessage("Maximum transaction amount is 20,000.", maxValue(20000)),
  },
};

const $v = useVuelidate(rules, { amount });

async function getQuote(
  rampSymbol: string
): Promise<{ feeRate: { [currency: string]: number }; rate: { [currency: string]: number }; decimals: number }> {
  let response: Promise<QuoteApiResponse>;
  try {
    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };
    response = get<QuoteApiResponse>(`${config.rampApiQuoteHost}`, options);
  } catch (error) {
    log.error(error);
    throw error;
  }
  const asset = (await response).assets.find((item) => item.symbol === rampSymbol) as QuoteAsset; // the ramp asset object
  return { feeRate: asset.maxFeePercent, rate: asset.price, decimals: asset.decimals };
}

function evaluateTransactionQuote() {
  const rate = rampQuoteData?.rate[selectedCurrency.value.value] || 0; // per unit price of token in fiat currency
  const feeRate = (rampQuoteData?.feeRate[selectedCurrency.value.value] || 0) / 100; // per unit price of transaction fees for 1 token in fiat currency
  cryptoCurrencyRate.value = Number(rate.toFixed(4));
  receivingCryptoAmount.value = Number((rate && !$v.value.$invalid ? amount.value / (1 + feeRate) / rate : 0).toFixed(4)); // Final Crypto amount
}

async function refreshTransferEstimate(val: { value: string; label: string; ramp_symbol: string }) {
  rampQuoteData = undefined;
  isLoadingQuote.value = true;
  try {
    rampQuoteData = await getQuote(val.ramp_symbol);
    isLoadingQuote.value = false;
  } catch (e) {
    // TODO : show error
    isLoadingQuote.value = false;
  }
  evaluateTransactionQuote();
}

watch(selectedCryptocurrency, throttle(refreshTransferEstimate, 500));
watch([selectedCurrency, amount], throttle(evaluateTransactionQuote, 500));

const onSave = () => {
  $v.value.$touch();
  if (!$v.value.$invalid) {
    ControllerModule.torus.handleTopUp({
      selectedCryptoCurrency: selectedCryptocurrency.value.ramp_symbol,
      cryptoAmount: Math.trunc(receivingCryptoAmount.value * 10 ** (rampQuoteData?.decimals || 0)),
    });
  }
};

onMounted(() => {
  selectedCurrency.value = selectedProvider.validCurrencies.find((k) => k.value === currency.toUpperCase()) || selectedProvider.validCurrencies[0];
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
        <div v-if="isLoadingQuote" class="flex flex-row items-start justify-end">
          <p class="h-16 text-right text-xs text-app-text-600 dark:text-app-text-dark-500 mr-3">Please wait while we fetch fresh quote prices.</p>
          <RoundLoader class="loader"></RoundLoader>
        </div>
        <div class="text-right text-xs text-app-text-600 dark:text-app-text-dark-500">
          <div>The process would take approximately 5 - 10 min.</div>
          <div>Please prepare your Identity Card/Passport to complete the purchase.</div>
        </div>
      </div>
      <div class="px-4 py-3 mb-4 sm:px-6">
        <Button class="ml-auto mb-2" variant="primary" type="submit" :disabled="isLoadingQuote || ($v.$dirty && $v.$invalid)">Save</Button>
        <div class="text-right text-xs text-app-text-600 dark:text-app-text-dark-500">You will be redirected to the third party page</div>
      </div>
    </div>
  </form>
</template>
<style>
.loader {
  width: 15px;
  height: 15px;
}
</style>

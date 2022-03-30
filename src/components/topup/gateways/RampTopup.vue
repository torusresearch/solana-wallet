<script setup lang="ts">
import { get } from "@toruslabs/http-helpers";
import { useVuelidate } from "@vuelidate/core";
import { helpers, maxValue, minValue, required } from "@vuelidate/validators";
import throttle from "lodash-es/throttle";
import log from "loglevel";
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import { Button, RoundLoader, SelectField, TextField } from "@/components/common";
import config from "@/config";
import { addToast } from "@/modules/app";
import ControllerModule from "@/modules/controllers";
import { TOPUP, TopupProviders } from "@/utils/topup";

const { t } = useI18n();
const router = useRouter();
const routeName = router.currentRoute.value.name?.toString() || TOPUP.MOONPAY;
const selectedProvider = TopupProviders[routeName];
const selectedCryptocurrency = ref(selectedProvider.validCryptocurrencies[0]);
const selectedCurrency = ref(selectedProvider.validCurrencies[0]);
const currency = ControllerModule.torus.currentCurrency;

const cryptoCurrencyRate = ref(0);
const receivingCryptoAmount = ref(0);
const amount = ref(100);
const isLoadingQuote = ref(false);
type QuoteAsset = {
  symbol: string;
  price: { [currency: string]: number };
  decimals: number;
};
type QuoteApiResponse = {
  assets: QuoteAsset[];
  maxFeePercent: number;
};
let rampQuoteData: { feeRate: number; rate: { [currency: string]: number }; decimals: number } | undefined;
const rules = {
  amount: {
    required: helpers.withMessage("Required", required),
    minValue: helpers.withMessage("Minimum transaction amount is 10.", minValue(10)),
    maxValue: helpers.withMessage("Maximum transaction amount is 20,000.", maxValue(20000)),
  },
};

const $v = useVuelidate(rules, { amount });

async function getQuote(rampSymbol: string): Promise<{ feeRate: number; rate: { [currency: string]: number }; decimals: number }> {
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
  const asset = await response;
  const selected_asset = asset.assets.find((item) => item.symbol === rampSymbol) as QuoteAsset; // the ramp asset object
  return {
    feeRate: asset.maxFeePercent,
    rate: selected_asset.price,
    decimals: selected_asset.decimals,
  };
}

function evaluateTransactionQuote() {
  const rate = rampQuoteData?.rate[selectedCurrency.value.value] || 0; // per unit price of token in fiat currency
  const feeRate = (rampQuoteData?.feeRate || 0) / 100; // per unit price of transaction fees for 1 token in fiat currency
  cryptoCurrencyRate.value = Number(rate.toFixed(4));
  receivingCryptoAmount.value = Number((rate && !$v.value.$invalid ? amount.value / (1 + feeRate) / rate : 0).toFixed(4)); // Final Crypto amount
}

async function refreshTransferEstimate(val: { value: string; label: string; symbol: string }) {
  rampQuoteData = undefined;
  isLoadingQuote.value = true;
  try {
    rampQuoteData = await getQuote(val.symbol);
    isLoadingQuote.value = false;
  } catch (e) {
    // TODO : show error
    isLoadingQuote.value = false;
  }
  evaluateTransactionQuote();
}

watch(selectedCryptocurrency, throttle(refreshTransferEstimate, 500));
watch([selectedCurrency, amount], throttle(evaluateTransactionQuote, 500));

const onTopup = () => {
  $v.value.$touch();
  if (!$v.value.$invalid) {
    ControllerModule.torus
      .handleTopup(TOPUP.RAMPNETWORK, {
        selectedCryptoCurrency: selectedCryptocurrency.value.symbol,
        cryptoAmount: Math.trunc(receivingCryptoAmount.value * 10 ** (rampQuoteData?.decimals || 0)),
      })
      .catch(() => addToast({ message: "Transaction could not complete.", type: "error" }));
  }
};

onMounted(() => {
  selectedCurrency.value = selectedProvider.validCurrencies.find((k) => k.value === currency.toUpperCase()) || selectedProvider.validCurrencies[0];
  refreshTransferEstimate(selectedCryptocurrency.value);
});
</script>

<template>
  <form @submit.prevent="onTopup">
    <div class="shadow dark:shadow-dark bg-white dark:bg-app-gray-700 md:rounded-md md:overflow-hidden">
      <div class="py-6 px-4 space-y-6 md:p-6">
        <div>
          <p class="mt-1 text-sm text-app-text-600 dark:text-app-text-dark-500 whitespace-pre-wrap">
            <span class="capitalize">{{ selectedProvider.name }}</span> {{ t(selectedProvider.description) }}.
          </p>
        </div>

        <div class="grid grid-cols-3">
          <div class="col-span-3 md:col-span-1">
            <SelectField id="ramp_crypto_select" v-model="selectedCryptocurrency" label="You buy" :items="selectedProvider.validCryptocurrencies" />
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div class="col-span-3 md:col-span-2">
            <TextField v-model="amount" :errors="$v.amount.$errors" type="number" label="You pay" />
            <p class="text-left text-xs mt-2 text-app-text-600 dark:text-app-text-dark-500">
              {{ `${t("walletTopUp.includesTransactionCost")} ${selectedProvider.fee}` }}<br />
              {{ `${t("walletTopUp.minTransactionAmount")} 10 ${selectedCurrency.value}` }}
            </p>
          </div>
          <div id="ramp_fiat_select" class="col-span-3 md:col-span-1 md:pt-6">
            <SelectField id="ramp_fiat_select" v-model="selectedCurrency" :items="selectedProvider.validCurrencies" />
          </div>
        </div>
        <div v-if="!isLoadingQuote" class="flex flex-col items-end mb-5">
          <div class="text-app-text-600 dark:text-app-text-dark-500">{{ t("walletTopUp.receive") }}</div>
          <div class="text-2xl font-bold text-app-text-600 dark:text-app-text-dark-500">
            <span id="resCryptoAmt">{{ receivingCryptoAmount }}</span> {{ selectedCryptocurrency.value }}
          </div>
          <div class="text-xs font-light text-app-text-500 dark:text-app-text-dark-500">
            {{ `${t("walletTopUp.rate")}: 1 ${selectedCryptocurrency.value} = ${cryptoCurrencyRate} ${selectedCurrency.value}` }}
          </div>
        </div>
        <div v-if="isLoadingQuote" class="flex flex-row items-start justify-end">
          <p class="h-16 text-right text-xs text-app-text-600 dark:text-app-text-dark-500 mr-3">{{ t("walletTopUp.waitFetch") }}</p>
          <RoundLoader class="loader"></RoundLoader>
        </div>
        <div class="text-right text-xs text-app-text-600 dark:text-app-text-dark-500">
          <div>{{ `${t("walletTopUp.theProcess")} 5 - 10 ${t("walletTransfer.minute")}` }}</div>
          <div>{{ t("walletTopUp.receiveHint") }}</div>
        </div>
      </div>
      <div class="px-4 py-3 mb-4 md:px-6">
        <Button class="ml-auto mb-2" variant="primary" type="submit" :disabled="isLoadingQuote || ($v.$dirty && $v.$invalid)">{{
          t("walletHome.topUp")
        }}</Button>
        <div class="text-right text-xs text-app-text-600 dark:text-app-text-dark-500">{{ t("walletTopUp.redirectMessage") }}</div>
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

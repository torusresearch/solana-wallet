<script setup lang="ts">
import { useVuelidate, ValidationRuleWithParams } from "@vuelidate/core";
import throttle from "lodash-es/throttle";
import log from "loglevel";
import { onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import { Button, RoundLoader, SelectField, TextField } from "@/components/common";
import { addToast } from "@/modules/app";
import ControllerModule from "@/modules/controllers";
import { TOPUP, TopupProviders } from "@/utils/topup";

import { RequestObject } from "./types";

export type QuoteResponse = {
  fee?: number;
  rate: number;
  cryptoAmount: number;
  decimals: number;
};
const props = withDefaults(
  defineProps<{
    // getQuote: (requestObject: RequestObject) => Promise<{ feeRate: number; rate: { [currency: string]: number }; decimals: number }>;
    getQuoteOnFiat: (requestObject: RequestObject) => Promise<QuoteResponse>;
    getQuoteOnAmount: (requestObject: RequestObject) => Promise<QuoteResponse>;
    getQuoteOnCrypto: (requestObject: RequestObject) => Promise<QuoteResponse>;
    rules: {
      amount: {
        required: ValidationRuleWithParams;
        minValue: ValidationRuleWithParams;
        maxValue: ValidationRuleWithParams;
      };
    };
    topupProvider: string;
  }>(),
  {}
);
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
const sendingTopup = ref(false);
const errorMsg = ref("");
let decimals = 0;
const $v = useVuelidate(props.rules, { amount });

async function refreshTransferEstimate(quote: (requestObject: RequestObject) => Promise<QuoteResponse>) {
  if ($v.value.$invalid) {
    errorMsg.value = "Invalid amount";
    return;
  }
  isLoadingQuote.value = true;
  errorMsg.value = "";
  try {
    const response = await quote({
      digital_currency: selectedCryptocurrency.value.symbol,
      fiat_currency: selectedCurrency.value.value,
      requested_amount: amount.value.toString(),
    });
    cryptoCurrencyRate.value = response.rate;
    receivingCryptoAmount.value = response.cryptoAmount;
    decimals = response.decimals;

    isLoadingQuote.value = false;
  } catch (e) {
    // TODO : show error
    log.info(e);
    errorMsg.value = (e as any).message;
    isLoadingQuote.value = false;
  }
}

watch(
  selectedCryptocurrency,
  throttle(() => refreshTransferEstimate(props.getQuoteOnCrypto), 500)
);
watch(
  selectedCurrency,
  throttle(() => refreshTransferEstimate(props.getQuoteOnFiat), 500)
);
watch(
  amount,
  throttle(() => refreshTransferEstimate(props.getQuoteOnAmount), 500)
);
const onTopup = async () => {
  $v.value.$touch();
  if (!$v.value.$invalid) {
    sendingTopup.value = true;
    try {
      await ControllerModule.torus.handleTopup(props.topupProvider, {
        selectedCryptoCurrency: selectedCryptocurrency.value.symbol,
        cryptoAmount: Math.trunc(receivingCryptoAmount.value * 10 ** (decimals || 0)),
        selectedCurrency: selectedCurrency.value.value,
        fiatValue: amount.value,
      });
    } catch (_e) {
      addToast({ message: "Transaction could not complete.", type: "error" });
    }
    sendingTopup.value = false;
  }
};

onMounted(() => {
  selectedCurrency.value = selectedProvider.validCurrencies.find((k) => k.value === currency.toUpperCase()) || selectedProvider.validCurrencies[0];
  refreshTransferEstimate(props.getQuoteOnCrypto);
});
</script>

<template>
  <form @submit.prevent="onTopup">
    <div class="shadow dark:shadow-dark bg-white dark:bg-app-gray-700 sm:rounded-md sm:overflow-hidden">
      <div class="py-6 px-4 space-y-6 sm:p-6">
        <div>
          <p class="mt-1 text-sm text-app-text-600 dark:text-app-text-dark-500 whitespace-pre-wrap">
            <span class="capitalize">{{ selectedProvider.name }}</span> {{ t(selectedProvider.description) }}.
          </p>
        </div>

        <div class="grid grid-cols-3">
          <div class="col-span-3 sm:col-span-1">
            <SelectField v-model="selectedCryptocurrency" label="You buy" :items="selectedProvider.validCryptocurrencies" />
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div class="col-span-3 sm:col-span-2">
            <TextField v-model="amount" :errors="$v.amount.$errors" type="number" label="You pay" />
            <p class="text-left text-xs mt-2 text-app-text-600 dark:text-app-text-dark-500">
              {{ `${t("walletTopUp.includesTransactionCost")} ${selectedProvider.fee}` }}<br />
              <!-- {{ `${t("walletTopUp.minTransactionAmount")} 10 ${selectedCurrency.value}` }} -->
            </p>
          </div>
          <div class="col-span-3 sm:col-span-1 md:pt-6">
            <SelectField v-model="selectedCurrency" :items="selectedProvider.validCurrencies" />
          </div>
        </div>
        <div v-if="!(isLoadingQuote || sendingTopup || errorMsg.length)" class="flex flex-col items-end mb-5">
          <div class="text-app-text-600 dark:text-app-text-dark-500">{{ t("walletTopUp.receive") }}</div>
          <div class="text-2xl font-bold text-app-text-600 dark:text-app-text-dark-500">
            <span id="resCryptoAmt">{{ receivingCryptoAmount }}</span> {{ selectedCryptocurrency.value }}
          </div>
          <div class="text-xs font-light text-app-text-500 dark:text-app-text-dark-500">
            {{ `${t("walletTopUp.rate")}: 1 ${selectedCryptocurrency.value} = ${cryptoCurrencyRate.toFixed(4)} ${selectedCurrency.value}` }}
          </div>
        </div>

        <div v-if="errorMsg.length" class="flex flex-row items-start justify-end">
          <p class="h-16 text-right text-m text-app-error mr-3">{{ errorMsg }}</p>
        </div>
        <div v-if="isLoadingQuote" class="flex flex-row items-start justify-end">
          <p class="h-16 text-right text-xs text-app-text-600 dark:text-app-text-dark-500 mr-3">{{ t("walletTopUp.waitFetch") }}</p>
          <RoundLoader class="loader"></RoundLoader>
        </div>
        <div v-if="sendingTopup" class="flex flex-row items-start justify-end">
          <p class="h-16 text-right text-xs text-app-text-600 dark:text-app-text-dark-500 mr-3">Processing Topup</p>
          <RoundLoader class="loader"></RoundLoader>
        </div>
        <div class="text-right text-xs text-app-text-600 dark:text-app-text-dark-500">
          <div>{{ `${t("walletTopUp.theProcess")} 5 - 10 ${t("walletTransfer.minute")}` }}</div>
          <div>{{ t("walletTopUp.receiveHint") }}</div>
        </div>
      </div>
      <div class="px-4 py-3 mb-4 sm:px-6">
        <Button
          class="ml-auto mb-2"
          variant="primary"
          type="submit"
          :disabled="isLoadingQuote || sendingTopup || ($v.$dirty && $v.$invalid) || errorMsg.length"
          >{{ t("walletHome.topUp") }}</Button
        >
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

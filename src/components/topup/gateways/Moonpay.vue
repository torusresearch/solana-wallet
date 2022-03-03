<script setup lang="ts">
import { get } from "@toruslabs/http-helpers";
import { helpers, maxValue, minValue, required } from "@vuelidate/validators";

import { TOPUP } from "@/plugins/Topup/interface";

import config from "../../../config";
import BaseTopup, { QuoteResponse } from "./BaseTopup.vue";
import { RequestObject } from "./types";

async function getQuote(requestObject: RequestObject): Promise<QuoteResponse> {
  let response: any;

  try {
    const options = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };
    response = await get(
      `${config.moonpayApiQuoteHost}/v3/currencies/${requestObject.digital_currency}/buy_quote?apiKey=${config.moonpayLiveAPIKEY}` +
        `&baseCurrencyCode=${requestObject.fiat_currency.toLowerCase()}&baseCurrencyAmount=${requestObject.requested_amount}&areFeesIncluded=true`,
      options
    );
  } catch (error) {
    const res = await (error as Response).json();
    throw new Error(res.message);
  }

  return {
    fee: response.feeAmount + response.networkFeeAmount + response.extraFeeAmount,
    rate: response.quoteCurrencyPrice,
    cryptoAmount: response.quoteCurrencyAmount,
    decimals: 0,
  };
}

const rules = {
  amount: {
    required: helpers.withMessage("Required", required),
    minValue: helpers.withMessage("Minimum transaction amount is 10.", minValue(10)),
    maxValue: helpers.withMessage("Maximum transaction amount is 200.", maxValue(20000)),
  },
};
</script>
<template>
  <BaseTopup
    :get-quote-on-fiat="getQuote"
    :get-quote-on-amount="getQuote"
    :get-quote-on-crypto="getQuote"
    :topup-provider="TOPUP.MOONPAY"
    :rules="rules"
  />
</template>

<script setup lang="ts">
import { significantDigits } from "@toruslabs/base-controllers";
import { BigNumber } from "bignumber.js";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import QuestionMark from "@/assets/question-circle.svg";
import SolanaLogoURL from "@/assets/solana-mascot.svg";
import { Button, NetworkDisplay } from "@/components/common";
import ControllerModule from "@/modules/controllers";
import { DecodedDataType } from "@/utils/instruction_decoder";

import InstructionDisplay from "./InstructionDisplay.vue";

const { t } = useI18n();
const pricePerToken = computed(() => ControllerModule.torus.conversionRate); // will change this to accept other tokens as well
const currency = computed(() => ControllerModule.torus.currentCurrency);

const props = withDefaults(
  defineProps<{
    receiverPubKey: string;
    cryptoAmount: number;
    cryptoTxFee: number;
    token?: string;
    isGasless?: boolean;
    isOpen?: boolean;
    tokenLogoUrl?: string;
    decodedInst: DecodedDataType[];
    network: string;
    estimatedBalanceChange: number;
    hasEstimationError: boolean;
  }>(),
  {
    senderPubKey: "",
    receiverPubKey: "",
    cryptoAmount: 0.0,
    cryptoTxFee: 0,
    token: "SOL",
    isOpen: false,
    isGasless: true,
    tokenLogoUrl: "",
    estimatedBalanceChange: 0,
    hasEstimationError: false,
  }
);

const expand_inst = ref(false);
const emits = defineEmits(["transferConfirm", "transferCancel", "onCloseModal"]);

const closeModal = () => {
  emits("onCloseModal");
};

const onCancel = () => {
  emits("transferCancel");
};

const onConfirm = () => {
  emits("transferConfirm");
  closeModal();
};

const getFeesInSol = () => {
  if (!props.hasEstimationError) {
    return Math.abs(props.estimatedBalanceChange);
  }
  return props.cryptoTxFee;
};
// const cryptoAmountString = computed(() => {
//   return `${props.cryptoAmount} ${props.token}`;
// });
//
// const fiatAmountString = computed(() => {
//   const totalFiatAmount = new BigNumber(pricePerToken.value).multipliedBy(props.cryptoAmount);
//   return `${significantDigits(totalFiatAmount, false, 2)} ${currency.value}`;
// });
//
// const fiatTxFeeString = computed(() => {
//   return `${new BigNumber(props.cryptoTxFee).multipliedBy(pricePerToken.value).toString()} ${currency.value}`;
// });
const totalCryptoCostString = computed(() => {
  if (props.token === "SOL") {
    const totalCost = new BigNumber(props.cryptoAmount).plus(getFeesInSol());
    return `${totalCost.toString(10)} ${props.token}`;
  }
  return `${props.cryptoAmount.toString(10)} ${props.token} + ${getFeesInSol()} SOL`;
});

const totalFiatCostString = computed(() => {
  const totalCost = new BigNumber(getFeesInSol()).plus(props.cryptoAmount);
  const totalFee = significantDigits(totalCost.multipliedBy(pricePerToken.value), false, 2);
  return `${totalFee.toString(10)} ${currency.value}`;
});
</script>
<template>
  <div
    :class="{ dark: ControllerModule.isDarkMode }"
    class="w-full h-full overflow-hidden bg-white dark:bg-app-gray-800 flex items-center justify-center"
  >
    <div class="content-box h-full w-full transition-all bg-white dark:bg-app-gray-800 shadow-xl flex flex-col justify-between relative">
      <div class="shadow dark:shadow-dark text-center py-6">
        <img class="h-7 absolute left-5" :src="props.tokenLogoUrl || SolanaLogoURL" alt="Solana Logo" />
        <p class="font-header text-lg font-bold text-app-text-600 dark:text-app-text-dark-500">
          {{ t("walletSettings.paymentConfirmation") }}
        </p>
      </div>
      <div class="mt-4 px-6">
        <div class="flex flex-col">
          <NetworkDisplay :network="network" />
          <p class="whitespace-no-wrap overflow-hidden overflow-ellipsis text-xs text-app-text-500 dark:text-app-text-dark-500 mt-3">
            {{ `${t("walletTransfer.pay")} ${t("walletActivity.to")}` }} : {{ props.receiverPubKey }}
          </p>
        </div>
      </div>
      <hr class="m-5" />
      <div class="mt-4 px-6 items-center no-scrollbar overflow-y-auto">
        <div class="flex flex-col justify-start items-start">
          <span class="flex flex-row justify-between items-center w-full text-sm text-app-text-500 dark:text-app-text-dark-500">
            <p>{{ t("walletTopUp.youSend") }}</p>
            <p>{{ props.cryptoAmount }} {{ props.token }}</p>
          </span>

          <span class="flex flex-row mt-3 justify-between items-center w-full text-sm text-app-text-500 dark:text-app-text-dark-500">
            <p>{{ t("walletTransfer.transferFee") }} <img :src="QuestionMark" alt="QuestionMark" class="ml-2 float-right mt-1 cursor-pointer" /></p>
            <p>{{ props.isGasless ? "Paid by DApp" : props.cryptoTxFee + " " + props.token }}</p>
          </span>
          <span class="flex flex-row mt-3 justify-between items-center w-full text-sm font-body text-app-text-500 dark:text-app-text-dark-500">
            <p>Estimated Transaction Changes <img :src="QuestionMark" alt="QuestionMark" class="ml-2 float-right mt-1 cursor-pointer" /></p>
            <p v-if="!props.hasEstimationError" :class="[props.isGasless ? '' : 'italic text-red-500']">
              {{ props.isGasless ? "Paid by DApp" : "-" + getFeesInSol() + " " + "SOL" }}
            </p>
            <p v-else class="italic text-red-500">Transaction might fail.</p>
          </span>
          <span class="flex flex-row mt-3 justify-between items-center w-full text-sm font-body text-app-text-500 dark:text-app-text-dark-500">
            <p>Transaction Fee <img :src="QuestionMark" alt="QuestionMark" class="ml-2 float-right mt-1 cursor-pointer" /></p>
            <p>{{ props.isGasless ? "Paid by DApp" : props.cryptoTxFee + " " + props.token }}</p>
          </span>

          <p
            class="text-right mt-4 text-sm cursor-pointer ml-auto text-app-text-accent"
            @click="() => (expand_inst = !expand_inst)"
            @keydown.enter="() => (expand_inst = !expand_inst)"
          >
            {{ expand_inst ? "Hide details" : "View more details" }}
          </p>
          <InstructionDisplay :is-expand="expand_inst" :decoded-inst="decodedInst" />
        </div>
      </div>
      <hr class="m-5" />
      <div class="flex px-6">
        <p class="text-sm text-app-text-600 dark:text-app-text-dark-400 font-bold">{{ t("walletTransfer.totalCost") }}</p>
        <div class="ml-auto text-right">
          <p class="text-sm font-bold text-app-text-600 dark:text-app-text-dark-400">~ {{ totalCryptoCostString }}</p>
          <p class="text-xs text-app-text-400 dark:text-app-text-dark-400">~ {{ totalFiatCostString }}</p>
        </div>
      </div>
      <div class="flex flex-row items-center my-4 mx-4">
        <Button class="flex-auto mx-1" :block="true" variant="tertiary" @click="onCancel">{{ t("dappTransfer.cancel") }}</Button>
        <Button class="flex-auto mx-1" :block="true" variant="primary" @click="onConfirm">{{ t("dappTransfer.confirm") }}</Button>
      </div>
    </div>
  </div>
</template>
<style scoped>
hr {
  border-color: #555555;
}
@screen gt-xs {
  .content-box {
    max-width: 400px;
    max-height: 600px;
  }
}
</style>

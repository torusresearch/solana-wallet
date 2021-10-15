<script setup lang="ts">
import { Dialog, DialogOverlay, DialogTitle, TransitionChild, TransitionRoot } from "@headlessui/vue";
import { significantDigits } from "@toruslabs/base-controllers";
import { BigNumber } from "bignumber.js";
import { computed } from "vue";

import QuestionMark from "@/assets/question-circle.svg";
import SolanaLogoURL from "@/assets/solana-mascot.svg";
import { Button, NetworkDisplay } from "@/components/common";
import { app } from "@/modules/app";
import ControllersModule from "@/modules/controllers";

const pricePerToken = computed(() => ControllersModule.torusState.CurrencyControllerState.conversionRate); // will change this to accept other tokens as well
const currency = computed(() => ControllersModule.torusState.CurrencyControllerState.currentCurrency);

const props = withDefaults(
  defineProps<{
    senderPubKey: string;
    receiverPubKey: string;
    receiverVerifierId: string;
    receiverVerifier: string;
    cryptoAmount: number;
    cryptoTxFee: number;
    token?: string;
    transferDisabled?: boolean;
    isGasless?: boolean;
    isOpen?: boolean;
    tokenLogoUrl?: string;
  }>(),
  {
    senderPubKey: "",
    receiverPubKey: "",
    receiverVerifierId: "",
    receiverVerifier: "solana",
    cryptoAmount: 0.0,
    cryptoTxFee: 0,
    token: "SOL",
    transferDisabled: false,
    isOpen: false,
    isGasless: true,
    tokenLogoUrl: "",
  }
);

const emits = defineEmits(["transferConfirm", "onCloseModal"]);

const closeModal = () => {
  emits("onCloseModal");
};

const onCancel = () => {
  closeModal();
};

const onConfirm = () => {
  emits("transferConfirm");
  closeModal();
};

const cryptoAmountString = computed(() => {
  return `${props.cryptoAmount} ${props.token}`;
});

const fiatAmountString = computed(() => {
  const totalFiatAmount = new BigNumber(pricePerToken.value).multipliedBy(props.cryptoAmount);
  return `${significantDigits(totalFiatAmount, false, 2)} ${currency.value}`;
});

const fiatTxFeeString = computed(() => {
  return `${new BigNumber(props.cryptoTxFee).multipliedBy(pricePerToken.value).toString()} ${currency.value}`;
});
const totalCryptoCostString = computed(() => {
  const totalCost = new BigNumber(props.cryptoAmount).plus(props.cryptoTxFee);
  return `${totalCost.toString(10)} ${props.token}`;
});

const totalFiatCostString = computed(() => {
  const totalCost = new BigNumber(props.cryptoTxFee).plus(props.cryptoAmount);
  const totalFee = significantDigits(totalCost.multipliedBy(pricePerToken.value), false, 2);
  return `${totalFee.toString(10)} ${currency.value}`;
});
</script>
<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog :class="{ dark: app.isDarkMode }" as="div" @close="closeModal">
      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="min-h-screen px-4 text-center">
          <DialogOverlay class="fixed inset-0 opacity-30 bg-gray-200 dark:bg-gray-500" />

          <span class="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>

          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <div
              class="
                inline-block
                w-full
                max-w-sm
                my-8
                overflow-hidden
                text-left
                align-middle
                transition-all
                transform
                bg-white
                dark:bg-app-gray-700
                shadow-xl
                rounded-md
              "
            >
              <DialogTitle as="div" class="shadow dark:shadow-dark text-center py-6 flex flex-row justify-around items-center" tabindex="0">
                <div>
                  <img class="h-7 mx-auto w-auto mb-1" :src="props.tokenLogoUrl || SolanaLogoURL" alt="Solana Logo" />
                </div>
                <div class="font-header text-lg font-bold text-app-text-600 dark:text-app-text-dark-500 title-box">Payment Confirmation</div>
              </DialogTitle>
              <div class="mt-4 px-6 items-center">
                <div class="flex flex-col justify-start items-start">
                  <NetworkDisplay />
                  <p class="rec_pub_key text-xs text-app-text-500 dark:text-app-text-dark-500 mt-3">Pay to : {{ props.receiverPubKey }}</p>
                </div>
              </div>
              <hr class="m-5" />
              <div class="mt-4 px-6 items-center">
                <div class="flex flex-col justify-start items-start">
                  <span class="flex flex-row justify-between items-center w-full text-sm font-body text-app-text-500 dark:text-app-text-dark-500">
                    <p>You Pay</p>
                    <p>{{ props.cryptoAmount }} {{ props.token }}</p>
                  </span>

                  <span
                    class="flex flex-row mt-3 justify-between items-center w-full text-sm font-body text-app-text-500 dark:text-app-text-dark-500"
                  >
                    <p>Transaction Fee <img :src="QuestionMark" class="ml-2 float-right mt-1 cursor-pointer" /></p>
                    <p>{{ props.isGasless ? "Paid by DApp" : props.cryptoTxFee + " " + props.token }}</p>
                  </span>
                  <p class="text-right mt-4 text-sm font-body cursor-pointer view-details text-app-text-accent">View more details</p>
                </div>
              </div>
              <hr class="m-5" />
              <div class="flex px-6">
                <div class="font-body text-sm text-app-text-600 dark:text-app-text-dark-400 font-bold">Total Cost</div>
                <div class="ml-auto text-right">
                  <div class="font-body text-sm font-bold text-app-text-600 dark:text-app-text-dark-400">~ {{ totalCryptoCostString }}</div>
                  <div class="font-body text-xs text-app-text-400 dark:text-app-text-dark-400">~ {{ totalFiatCostString }}</div>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3 m-6">
                <div><Button class="ml-auto" block variant="tertiary" @click="onCancel">Cancel</Button></div>
                <div><Button class="ml-auto" block variant="primary" @click="onConfirm">Confirm</Button></div>
              </div>
            </div>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
<style scoped>
.title-box {
  transform: translateX(-35px);
}
hr {
  border-color: #555555;
}
.rec_pub_key {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}
.view-details {
  margin-left: auto;
}
</style>

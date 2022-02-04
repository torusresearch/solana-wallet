<script setup lang="ts">
import { Dialog, DialogOverlay, DialogTitle, TransitionChild, TransitionRoot } from "@headlessui/vue";
import { addressSlicer, significantDigits } from "@toruslabs/base-controllers";
import { WiFiIcon } from "@toruslabs/vue-icons/connection";
import { BigNumber } from "bignumber.js";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import SolanaLogoURL from "@/assets/solana-mascot.svg";
import { Button } from "@/components/common";
import { tokens } from "@/components/transfer/token-helper";
import ControllerModule from "@/modules/controllers";
import { SolAndSplToken } from "@/utils/interfaces";

const { t } = useI18n();
const currency = computed(() => ControllerModule.torus.currentCurrency);

const props = withDefaults(
  defineProps<{
    senderPubKey: string;
    receiverPubKey: string;
    receiverVerifierId: string;
    receiverVerifier: string;
    cryptoAmount: number;
    cryptoTxFee: number;
    tokenSymbol?: string;
    transferDisabled?: boolean;
    isOpen?: boolean;
    token: Partial<SolAndSplToken>;
  }>(),
  {
    senderPubKey: "",
    receiverPubKey: "",
    receiverVerifierId: "",
    receiverVerifier: "solana",
    cryptoAmount: 0,
    cryptoTxFee: 0,
    tokenSymbol: "SOL",
    transferDisabled: false,
    isOpen: false,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    token: tokens.value[0],
  }
);

function isSPLToken(): boolean {
  return !!props.token.mintAddress;
}
const pricePerToken = computed<number>((): number => {
  if (isSPLToken()) {
    return props.token?.price?.[currency.value.toLowerCase()] || 0;
  }
  return ControllerModule.torus.conversionRate;
});
const emits = defineEmits(["transferConfirm", "onCloseModal"]);

const closeModal = () => {
  emits("onCloseModal");
};

const onCancel = () => {
  closeModal();
};

const onConfirm = () => {
  closeModal();
  emits("transferConfirm");
};

// Amount to send
const cryptoAmountString = computed(() => {
  return `${props.cryptoAmount} ${props.tokenSymbol}`;
});

const fiatAmountString = computed(() => {
  const totalFiatAmount = new BigNumber(pricePerToken.value).multipliedBy(props.cryptoAmount);
  return `${significantDigits(totalFiatAmount, false, 2)} ${currency.value}`;
});

// Total cost
const totalFiatCostString = computed(() => {
  const totalCost = new BigNumber(props.cryptoTxFee).plus(props.cryptoAmount);
  const totalFee = significantDigits(totalCost.multipliedBy(pricePerToken.value), false, 2);
  return `${totalFee.toString(10)} ${currency.value}`;
});

const totalCryptoCostString = computed(() => {
  if (isSPLToken()) {
    return `${props.cryptoAmount} ${props.tokenSymbol} + ${props.cryptoTxFee} SOL`;
  }
  const totalCost = new BigNumber(props.cryptoAmount).plus(props.cryptoTxFee);
  return `${totalCost.toString(10)} ${props.tokenSymbol}`;
});

// Transaction fee
const fiatTxFeeString = computed(() => {
  return `${new BigNumber(props.cryptoTxFee).multipliedBy(pricePerToken.value).toFixed(5).toString()} ${currency.value}`;
});
const refDiv = ref(null);
</script>
<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog :open="isOpen" :class="{ dark: ControllerModule.isDarkMode }" as="div" :initial-focus="refDiv" @close="closeModal">
      <div ref="refDiv" class="fixed inset-0 z-10 overflow-y-auto">
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
              class="inline-block w-full max-w-sm text-left align-middle transition-all transform bg-white dark:bg-app-gray-700 shadow-xl rounded-md"
            >
              <DialogTitle as="div" class="shadow dark:shadow-dark text-center py-6" tabindex="0">
                <div>
                  <img class="h-7 mx-auto w-auto mb-1" :src="SolanaLogoURL" alt="Solana Logo" />
                </div>
                <div class="font-header text-lg font-bold text-app-text-600 dark:text-app-text-dark-500">
                  {{ t("walletTransfer.confirmTransaction") }}
                </div>
              </DialogTitle>
              <div class="mt-5 px-6 items-center">
                <div class="flex items-center">
                  <div class="pl-5 flex-none">
                    <div
                      class="flex justify-center border border-app-gray-400 dark:border-transparent shadow dark:shadow-dark2 rounded-full w-12 h-12"
                    >
                      <img class="w-6" :src="SolanaLogoURL" alt="Solana Logo" />
                    </div>
                  </div>
                  <div class="flex-grow line_connect">
                    <hr />
                  </div>
                  <div class="pr-5 flex-none">
                    <div
                      class="flex justify-center border border-app-gray-400 dark:border-transparent shadow dark:shadow-dark2 rounded-full w-12 h-12"
                    >
                      <!-- <img class="w-6" src="https://app.tor.us/v1.13.2/img/login-facebook.14920ebc.svg" alt="" /> -->
                      <img class="w-6" :src="SolanaLogoURL" alt="Solana Logo" />
                    </div>
                  </div>
                </div>
                <div class="flex mt-1">
                  <div class="flex-none w-20 text-center">
                    <!-- <div class="overflow-ellipsis truncate text-xxs text-app-text-500 dark:text-app-text-dark-500">tom@gmail.com</div> -->
                    <div class="truncate text-xxs text-app-text-500 dark:text-app-text-dark-500">
                      {{ addressSlicer(senderPubKey) }}
                    </div>
                  </div>
                  <div class="flex-grow text-xs text-app-text-500 dark:text-app-text-dark-500 flex items-center justify-center -mt-14">
                    <WiFiIcon class="w-3 h-3 mr-1" /> {{ `Solana ${t("walletActivity.network")}` }}
                  </div>
                  <div class="flex-none w-20 text-center">
                    <div v-if="receiverVerifier !== 'solana'" class="truncate text-xxs text-app-text-500 dark:text-app-text-dark-500">
                      {{ receiverVerifierId }}
                    </div>
                    <div class="truncate text-xxs text-app-text-500 dark:text-app-text-dark-500">
                      {{ addressSlicer(receiverPubKey) }}
                    </div>
                  </div>
                </div>
                <hr class="mt-3 mb-5" />
                <div class="flex mb-5">
                  <div class="text-xs text-app-text-500 dark:text-app-text-dark-500">{{ t("walletTransfer.amountToSend") }}</div>
                  <div class="ml-auto text-right">
                    <div class="text-xs font-bold text-app-text-500 dark:text-app-text-dark-500">{{ cryptoAmountString }}</div>
                    <div class="text-xs text-app-text-400 dark:text-app-text-dark-600">~ {{ fiatAmountString }}</div>
                  </div>
                </div>
                <div class="flex">
                  <div class="text-xs text-app-text-500 dark:text-app-text-dark-500">{{ t("walletTransfer.fee-max-transaction") }}</div>
                  <div class="ml-auto text-right">
                    <div class="text-xs font-bold text-app-text-500 dark:text-app-text-dark-500">{{ fiatTxFeeString }}</div>
                    <div class="text-xs text-app-text-400 dark:text-app-text-dark-600">
                      (In &lt; {{ t("walletTransfer.fee-edit-time-sec", { time: "30" }) }})
                    </div>
                  </div>
                </div>
                <hr class="my-5" />

                <div class="flex">
                  <div class="text-sm text-app-text-600 dark:text-app-text-dark-400 font-bold">{{ t("walletTransfer.totalCost") }}</div>
                  <div class="ml-auto text-right">
                    <div class="text-sm font-bold text-app-text-600 dark:text-app-text-dark-400">~ {{ totalCryptoCostString }}</div>
                    <div class="text-xs text-app-text-400 dark:text-app-text-dark-400">~ {{ totalFiatCostString }}</div>
                  </div>
                </div>
              </div>

              <div class="flex flex-row items-center my-4 mx-3">
                <Button class="flex-auto mx-2" :block="true" variant="tertiary" @click="onCancel">{{ t("walletTransfer.cancel") }}</Button>
                <Button class="flex-auto mx-2" :block="true" variant="primary" :disabled="transferDisabled" @click="onConfirm">{{
                  t("walletTransfer.confirm")
                }}</Button>
              </div>
            </div>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
<style scoped>
.line_connect {
  transform: translateY(-7px);
}
</style>

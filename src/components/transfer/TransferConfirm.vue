<script setup lang="ts">
import { Dialog, DialogOverlay, DialogTitle, TransitionChild, TransitionRoot } from "@headlessui/vue";
import { addressSlicer, significantDigits } from "@toruslabs/base-controllers";
import { WiFiIcon } from "@toruslabs/vue-icons/connection";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import SolanaLogoURL from "@/assets/solana-mascot.svg";
import { Button } from "@/components/common";
import { tokens } from "@/components/transfer/token-helper";
import ControllerModule from "@/modules/controllers";
import { AccountEstimation, SolAndSplToken } from "@/utils/interfaces";

import EstimateChanges from "../payments/EstimateChanges.vue";

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
    estimatedBalanceChange: AccountEstimation[];
    hasEstimationError: string;
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
    hasEstimationError: "",
  }
);
function isSPLToken(): boolean {
  return !!props.token.mintAddress;
}
function getSolCost(): number {
  if (!props.hasEstimationError) {
    const solChanges = props.estimatedBalanceChange.find((item) => item.symbol === "SOL");
    if (solChanges) return Math.abs(solChanges.changes);
  }
  return props.cryptoTxFee + props.cryptoAmount;
}
function getTokenChanges(): number {
  if (!props.hasEstimationError) {
    const tokenChanges = props.estimatedBalanceChange.find((item) => item.symbol !== "SOL");
    if (tokenChanges) return Math.abs(tokenChanges.changes);
  }
  return props.cryptoAmount;
}

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

// Amount to send
const cryptoAmountString = computed(() => {
  return `${props.cryptoAmount} ${props.tokenSymbol}`;
});

const fiatAmountString = computed(() => {
  const totalFiatAmount =
    props.cryptoAmount * (isSPLToken() ? props.token?.price?.[currency.value.toLowerCase()] || 0 : ControllerModule.torus.conversionRate);
  return `${significantDigits(totalFiatAmount, false, 2)} ${currency.value}`;
});

// Total cost
const totalFiatCostString = computed(() => {
  let totalCost = getSolCost() * ControllerModule.torus.conversionRate;
  if (isSPLToken()) totalCost += getTokenChanges() * (props.token?.price?.[currency.value.toLowerCase()] || 0);
  const totalFee = significantDigits(totalCost, false, 2);
  return `${totalFee.toString(10)} ${currency.value}`;
});

const totalCryptoCostString = computed(() => {
  if (isSPLToken()) {
    return `${getTokenChanges()} ${props.tokenSymbol} + ${getSolCost()} SOL`;
  }
  const totalCost = significantDigits(getSolCost(), false, 2);
  return `${totalCost.toString(10)} ${props.tokenSymbol}`;
});

// Transaction fee
const fiatTxFeeString = computed(() => {
  const fee = significantDigits(props.cryptoTxFee * ControllerModule.torus.conversionRate, false, 2);
  return `${fee.toString(10)} ${currency.value}`;
});
const refDiv = ref(null);
</script>
<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog :open="isOpen" :class="{ dark: ControllerModule.isDarkMode }" as="div" :initial-focus="refDiv" @close="closeModal">
      <div ref="refDiv" class="fixed inset-0 z-30 overflow-y-auto">
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
              class="relative inline-block w-full max-w-sm text-left align-middle transition-all transform bg-white dark:bg-app-gray-700 shadow-xl rounded-md"
            >
              <DialogTitle as="div" class="shadow dark:shadow-dark text-center py-6">
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
                  <div class="grow -translate-y-[7px]">
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
                  <div class="grow text-xs text-app-text-500 dark:text-app-text-dark-500 flex items-center justify-center -mt-14">
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
                <div v-if="isSPLToken()">
                  <hr class="mt-3 mb-5" />
                  <div class="font-body text-xs text-app-text-500 dark:text-app-text-dark-500 mb-2">
                    <EstimateChanges
                      :estimated-balance-change="props.estimatedBalanceChange"
                      :has-estimation-error="props.hasEstimationError"
                      :is-expand="true"
                    />
                  </div>
                </div>
                <div class="flex">
                  <div class="text-xs text-app-text-500 dark:text-app-text-dark-500">{{ t("walletTransfer.fee-max-transaction") }}</div>
                  <div class="ml-auto text-right">
                    <div class="text-xs font-bold text-app-text-500 dark:text-app-text-dark-500">
                      {{ significantDigits(props.cryptoTxFee, false, 2) }} SOL
                    </div>
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
<style scoped></style>

<script setup lang="ts">
import { significantDigits } from "@toruslabs/base-controllers";
import { BigNumber } from "bignumber.js";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import QuestionMark from "@/assets/question-circle.svg";
import SolanaLogoURL from "@/assets/solana-mascot.svg";
import { Button, NetworkDisplay } from "@/components/common";
import ControllerModule from "@/modules/controllers";
import { getDomainFromUrl } from "@/utils/helpers";
import { DecodedDataType } from "@/utils/instruction_decoder";
import { AccountEstimation } from "@/utils/interfaces";

import InstructionDisplay from "./InstructionDisplay.vue";

const { t } = useI18n();
const pricePerToken = computed(() => ControllerModule.torus.conversionRate); // will change this to accept other tokens as well
const currency = computed(() => ControllerModule.torus.currentCurrency);

const props = withDefaults(
  defineProps<{
    receiverPubKey: string;
    txFee?: number;
    isGasless?: boolean;
    tokenLogoUrl?: string;
    decodedInst: DecodedDataType[];
    network: string;
    estimationInProgress: boolean;
    estimatedBalanceChange: AccountEstimation[];
    hasEstimationError: string;
    origin: string;
  }>(),
  {
    senderPubKey: "",
    receiverPubKey: "",
    txFee: 0,
    isOpen: false,
    isGasless: true,
    tokenLogoUrl: "",
    hasEstimationError: "",
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

const getTotalInSol = () => {
  const solChanges = props.estimatedBalanceChange.find((item) => item.address === ControllerModule.selectedAddress);
  if (solChanges) return Math.abs(solChanges.changes);
  return 0;
};

const totalFiatCostString = computed(() => {
  const totalCost = new BigNumber(getTotalInSol());
  const totalFee = significantDigits(totalCost.multipliedBy(pricePerToken.value), false, 2);
  return `${totalFee.toString(10)} ${currency.value}`;
});

const received = computed(() => props.estimatedBalanceChange.filter((item) => item.changes > 0));
const payable = computed(() => props.estimatedBalanceChange.filter((item) => item.changes < 0));
</script>
<template>
  <div class="content-box h-full w-full transition-all bg-white dark:bg-app-gray-800 shadow-xl flex flex-col justify-between relative">
    <!-- Header and Logo -->
    <div class="shadow dark:shadow-dark text-center py-6 dark:bg-app-gray-700" tabindex="0">
      <img class="h-7 absolute left-5" :src="props.tokenLogoUrl || SolanaLogoURL" alt="Solana Logo" />
      <div class="font-header text-lg font-bold text-app-text-600 dark:text-app-text-dark-500 title-box">
        {{ t("walletSettings.paymentConfirmation") }}
      </div>
    </div>

    <!-- Network Display and Origin -->
    <div class="mt-4 px-6">
      <div class="flex flex-col">
        <NetworkDisplay :network="network" />
      </div>
      <div class="text-sm text-app-text-500 dark:text-app-text-dark-500">
        {{ t("walletTransfer.requestFrom") }}
        <a :href="props.origin" target="_blank" class="text-sm text-app-text-accent">{{ getDomainFromUrl(props.origin) }}</a>
      </div>
    </div>

    <hr class="m-5" />

    <div class="mt-4 px-6 items-center no-scrollbar overflow-y-auto flex-grow">
      <div class="flex flex-col justify-start items-start">
        <!-- You Receive  -->
        <span v-if="hasEstimationError" class="font-body text-xs font-thin text-red-500 italic text-right mb-3">
          <span v-if="hasEstimationError.includes('transaction might failed')">{{ t("walletTransfer.estimated-fail") }}</span>
          <span v-else>{{ t("walletTransfer.estimate-unable") }}</span>
        </span>
        <span
          v-if="received.length > 0"
          class="flex flex-row justify-between items-start w-full text-sm text-app-text-500 dark:text-app-text-dark-500 mb-3"
        >
          <p>{{ t("walletTransfer.youReceive") }}</p>
          <div>
            <div v-for="item in received" :key="item.symbol" class="italic text-red-500 text-right">
              <div :class="item.changes >= 0 && 'text-green-400'">{{ item.changes + "   " + item.symbol.substring(0, 8) }}</div>
            </div>
          </div>
        </span>

        <!-- Transaction Fee -->
        <span class="flex flex-row mt-3 justify-between items-center w-full text-sm text-app-text-500 dark:text-app-text-dark-500">
          <p>{{ t("walletTransfer.transactionFee") }} <img :src="QuestionMark" alt="QuestionMark" class="ml-2 float-right mt-1 cursor-pointer" /></p>
          <p>{{ props.isGasless ? "Paid by DApp" : props.txFee + " SOL" }}</p>
        </span>

        <!-- Instruction Display -->
        <p
          class="text-right w-full mt-4 text-sm cursor-pointer view-details text-app-text-accent"
          @click="() => (expand_inst = !expand_inst)"
          @keydown="() => (expand_inst = !expand_inst)"
        >
          {{ expand_inst ? "Hide details" : "View more details" }}
        </p>
        <InstructionDisplay :is-expand="expand_inst" :decoded-inst="decodedInst" />
      </div>
    </div>

    <hr class="m-5" />
    <!-- Total amount payable -->
    <div v-if="payable.length" class="flex px-6">
      <div class="text-sm text-app-text-600 dark:text-app-text-dark-400 font-bold">{{ t("walletTransfer.amountPayable") }}</div>
      <div class="ml-auto text-right">
        <div v-for="item in payable" :key="item.symbol" class="italic text-red-500 text-right">
          <div :class="item.changes >= 0 && 'text-green-400'">{{ item.changes + "   " + item.symbol.substring(0, 8) }}</div>
        </div>
        <div v-if="getTotalInSol() && payable.length === 1" class="text-xs text-app-text-400 dark:text-app-text-dark-400">
          ~ {{ totalFiatCostString }}
        </div>
      </div>
    </div>

    <!-- Button  -->
    <div class="flex flex-row items-center my-4 mx-4">
      <Button class="flex-auto mx-1" :block="true" variant="tertiary" @click="onCancel">{{ t("dappTransfer.cancel") }}</Button>
      <Button class="flex-auto mx-1" :block="true" variant="primary" @click="onConfirm">{{ t("dappTransfer.confirm") }}</Button>
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

<script setup lang="ts">
/* eslint-disable vuejs-accessibility/anchor-has-content */
import { Dialog, DialogOverlay, DialogTitle, TransitionChild, TransitionRoot } from "@headlessui/vue";
import { addressSlicer } from "@toruslabs/base-controllers";
import { getChainIdToNetwork } from "@toruslabs/solana-controllers";
import { ExternalLinkIcon } from "@toruslabs/vue-icons/basic";
import BigNumber from "bignumber.js";
import { computed } from "vue";

import FallbackNft from "@/assets/nft.png";
import { Button } from "@/components/common";
import ControllerModule from "@/modules/controllers";
import { setFallbackImg } from "@/utils/helpers";
import { SolAndSplToken } from "@/utils/interfaces";

import NetworkDisplay from "../common/NetworkDisplay.vue";

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
  }
);
const currency = computed(() => ControllerModule.torus.currentCurrency);
const pricePerToken = computed<number>((): number => {
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
// Transaction fee
const fiatTxFeeString = computed(() => {
  return `${new BigNumber(props.cryptoTxFee).multipliedBy(pricePerToken.value).toFixed(5).toString()} ${currency.value}`;
});

const explorerUrl = computed(() => {
  return `${ControllerModule.torus.blockExplorerUrl}/account/${props.receiverPubKey}/?cluster=${getChainIdToNetwork(ControllerModule.torus.chainId)}`;
});
</script>
<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog :class="{ dark: ControllerModule.isDarkMode }" as="div" @close="closeModal">
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
                px-4
                font-body
              "
            >
              <DialogTitle as="div" class="shadow dark:shadow-dark text-center py-6" tabindex="0">
                <p class="font-header text-lg font-bold text-app-text-600 dark:text-app-text-dark-500">Confirm Transaction</p>
              </DialogTitle>
              <div class="flex flex-col justify-start items-start py-4 border-b border-gray-700">
                <NetworkDisplay></NetworkDisplay>
                <span class="flex flex-row justify-start items-center w-full mt-4">
                  <p class="text-sm font-bold text-app-text-500 dark:text-app-text-dark-500 mr-1">
                    Send to: {{ addressSlicer(props.receiverPubKey) }}
                  </p>
                  <a :href="explorerUrl" target="_blank" rel="noreferrer noopener" class="h-4"
                    ><ExternalLinkIcon class="w-4 h-4 text-app-text-500" />
                  </a>
                </span>
              </div>
              <div class="flex flex-row justify-start items-center py-6">
                <div class="img_preview img-loader-container">
                  <img
                    :src="props.token.metaplexData?.offChainMetaData?.image"
                    alt="TOKEN IMAGE"
                    class="img_preview"
                    @error="setFallbackImg($event.target, FallbackNft)"
                  />
                </div>
                <div class="flex flex-col justify-center items-start h-full w-full ml-6">
                  <div class="flex flex-col justify-center items-start flex-auto w-full">
                    <p class="property-name text-app-text-600 dark:text-app-text-dark-white">Name</p>
                    <p class="property-value text-app-text-500 dark:text-app-text-dark-500">{{ props.token.metaplexData?.name }}</p>
                  </div>
                  <div class="flex flex-col justify-center items-start flex-auto py-5 w-full">
                    <p class="property-name text-app-text-600 dark:text-app-text-dark-white">Symbol</p>
                    <p class="property-value text-app-text-500 dark:text-app-text-dark-500">{{ props.token.metaplexData?.symbol }}</p>
                  </div>
                  <div class="flex flex-col justify-center items-start flex-auto w-full">
                    <p class="property-name text-app-text-600 dark:text-app-text-dark-white">View NFT</p>
                    <a
                      class="property-value text-app-text-500 dark:text-app-text-dark-500"
                      :href="`https://solscan.io/token/${props.token.mintAddress}`"
                      target="_blank"
                      >{{ props.token.metaplexData?.name }}</a
                    >
                  </div>
                </div>
              </div>
              <div
                class="
                  border-b border-gray-700
                  text-app-text-500
                  dark:text-app-text-dark-500
                  text-xs
                  font-light
                  flex flex-row
                  justify-start
                  items-center
                  pb-8
                  pt-2
                "
              >
                <p class="flex-auto">Transaction Fee</p>
                <p>{{ props.cryptoTxFee }} SOL</p>
              </div>
              <div class="flex flex-row items- justify-start w-full mt-8">
                <p class="flex flex-auto text-sm font-bold text-app-text-600 dark:text-app-text-dark-500">Total Cost</p>
                <div class="flex flex-col items-start justify-start">
                  <p class="text-sm font-bold text-app-text-600 dark:text-app-text-dark-white">{{ props.cryptoTxFee }} SOL</p>
                  <p class="text-xxs text-app-text-600 dark:text-app-text-dark-600 w-full text-right">~{{ fiatTxFeeString }}</p>
                </div>
              </div>
              <div class="flex flex-row justify-around items-center m-6">
                <p class="text-sm text-app-text-500 dark:text-app-text-dark-500 cursor-pointer" @click="onCancel" @keydown="onCancel">Cancel</p>
                <div><Button class="ml-auto" :block="true" variant="primary" :disabled="transferDisabled" @click="onConfirm">Confirm</Button></div>
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
.img-container {
  min-width: 160px;
}
.img_preview {
  max-width: 160px;
  height: 160px;
  min-width: 160px;
  border-radius: 6px;
  object-fit: cover;
}
.property-name {
  font-weight: bold;
  font-size: 14px;
  line-height: 18px;
}
.property-value {
  font-weight: normal;
  font-size: 14px;
  line-height: 18px;
}
</style>
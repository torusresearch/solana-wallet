<script setup lang="ts">
import { Dialog, DialogOverlay, DialogTitle, TransitionChild, TransitionRoot } from "@headlessui/vue";
import { addressSlicer } from "@toruslabs/base-controllers";

import SolanaLogoURL from "@/assets/solana-mascot.svg";
import { Button } from "@/components/common";
import ControllersModule from "@/modules/controllers";
import { SolAndSplToken } from "@/utils/interfaces";

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
</script>
<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog :class="{ dark: ControllersModule.isDarkMode }" as="div" @close="closeModal">
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
              class="inline-block w-full max-w-sm my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-app-gray-700 shadow-xl rounded-md"
            >
              <DialogTitle as="div" class="shadow dark:shadow-dark text-center py-6" tabindex="0">
                <div>
                  <img class="h-7 mx-auto w-auto mb-1" :src="SolanaLogoURL" alt="Solana Logo" />
                </div>
                <div class="font-header text-lg font-bold text-app-text-600 dark:text-app-text-dark-500">Confirm Transaction</div>
              </DialogTitle>
              <div class="mt-5 px-6 items-center">
                <div class="flex flex-col items-center">
                  <div class="font-header text-lg font-bold text-app-text-600 dark:text-app-text-dark-500">{{ props.token.metaplexData?.name }}</div>
                  <img :src="props.token.metaplexData?.offChainMetaData?.image" alt="loading" />
                  <div class="font-header text-lg font-bold text-app-text-600 dark:text-app-text-dark-500">
                    Send to {{ addressSlicer(props.receiverPubKey) }}
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3 m-6">
                <div><Button class="ml-auto" :block="true" variant="tertiary" @click="onCancel">Cancel</Button></div>
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
</style>

<script setup lang="ts">
import { Dialog, DialogOverlay, DialogTitle, TransitionChild, TransitionRoot } from "@headlessui/vue";
import { NFTInfo } from "@toruslabs/solana-controllers";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

import FallbackNft from "@/assets/nft.png";
import { Button } from "@/components/common";
import ControllerModule from "@/modules/controllers";
import { getImgProxyUrl, setFallbackImg } from "@/utils/helpers";

import NetworkDisplay from "../common/NetworkDisplay.vue";
import PreviewNFT from "../transfer/PreviewNFT.vue";

const props = withDefaults(
  defineProps<{
    senderPubKey: string;
    tokenSymbol?: string;
    transferDisabled?: boolean;
    isOpen?: boolean;
    mintAddress: string;
    token: Partial<NFTInfo | undefined>;
  }>(),
  {
    senderPubKey: "",
    tokenSymbol: "SOL",
    transferDisabled: false,
    isOpen: false,
  }
);

const { t } = useI18n();

const emits = defineEmits(["transferConfirm", "transferReject", "onCloseModal"]);

const closeModal = () => {
  emits("onCloseModal");
};

const onCancel = () => {
  emits("transferReject");
};

const onConfirm = () => {
  emits("transferConfirm");
  closeModal();
};

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
              class="relative inline-block w-full max-w-sm my-8 overflow-hidden text-left align-middle transition-all bg-white dark:bg-app-gray-700 shadow-xl rounded-md px-4"
            >
              <DialogTitle as="div" class="shadow dark:shadow-dark text-center py-6 w-full">
                <p class="font-header text-lg font-bold text-app-text-600 dark:text-app-text-dark-500">Burn NFT</p>
              </DialogTitle>
              <div class="flex flex-col justify-start items-start py-4 border-b border-gray-700">
                <NetworkDisplay></NetworkDisplay>
              </div>
              <div class="flex flex-row justify-start items-center py-6">
                <div class="img_preview img-loader-container">
                  <img
                    :src="getImgProxyUrl(props.token?.offChainMetaData?.image)"
                    alt="TOKEN IMAGE"
                    class="img_preview"
                    @error="setFallbackImg($event.target, FallbackNft)"
                  />
                </div>
                <PreviewNFT :token="props.token" :mint-address="props.mintAddress" />
              </div>
              <div class="flex flex-row items-center my-6 mx-3">
                <Button class="flex-auto mx-2 w-1/2" :block="true" variant="tertiary" @click="onCancel">
                  {{ t("walletTransfer.cancel") }}
                </Button>
                <Button class="flex-auto mx-2 w-1/2" :block="true" variant="primary" :disabled="transferDisabled" @click="onConfirm">{{
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
.img_preview {
  max-width: 160px;
  min-width: 160px;
  @apply h-40 rounded-md object-cover;
}
.property-name {
  @apply font-bold text-sm leading-4;
}
.property-value {
  @apply text-sm leading-4;
}
</style>

<script setup lang="ts">
import { Dialog, DialogOverlay, DialogTitle, TransitionChild, TransitionRoot } from "@headlessui/vue";
import { XIcon } from "@heroicons/vue/solid";
import QRCode, { Options } from "@solana/qr-code-styling";
import Button from "@toruslabs/vue-components/common/Button.vue";
import Loader from "@toruslabs/vue-components/common/Loader.vue";
import { CopyIcon } from "@toruslabs/vue-icons/basic";
import log from "loglevel";
import { computed, onMounted, ref, watch } from "vue";

import SolanaLogoURL from "@/assets/solana-dark.svg";
import SolanaLightLogoURL from "@/assets/solana-light.svg";
import SolanaLogo from "@/assets/solana-mascot.svg";
import { copyText } from "@/utils/helpers";
import { getWhiteLabelLogoDark, getWhiteLabelLogoLight, isWhiteLabelDark } from "@/utils/whitelabel";

const props = withDefaults(
  defineProps<{
    isOpen?: boolean;
    publicAddress: string;
    description?: string;
    isDarkMode?: boolean;
  }>(),
  {
    isOpen: false,
    isDarkMode: false,
    description: "",
  }
);
const emits = defineEmits(["onClose"]);

const closeModal = () => {
  emits("onClose");
};

const refDiv = ref(null);
const qrsrc = ref("");
const isImageLoading = ref(false);

const copyPrivKey = () => {
  copyText(props.publicAddress || "");
};
const qrOptions = {
  width: 256,
  height: 256,
  type: "svg",
  image: SolanaLogo,
  dotsOptions: {
    color: "black",
    type: "rounded",
  },
  // backgroundOptions: {
  // color: "#e9ebee",
  // },
  imageOptions: {
    crossOrigin: "anonymous",
    margin: 15,
  },
} as Partial<Options>;
const qr = new QRCode({
  ...qrOptions,
  data: props.publicAddress,
});

onMounted(async () => {
  isImageLoading.value = true;
  const blobimg = await qr.getRawData();
  if (blobimg) qrsrc.value = URL.createObjectURL(blobimg);
  else {
    log.error("invalid qr generation");
    // popup error message:
  }
  isImageLoading.value = false;
});

const downloadQr = () => {
  qr.download({ name: "qrcode", extension: "svg" });
};

const publicAddress = computed(() => props.publicAddress);
watch(publicAddress, () => {
  qr.update({
    ...qrOptions,
    data: publicAddress.value,
  });
});
</script>
<template>
  <TransitionRoot appear :show="props.isOpen" as="template">
    <Dialog ref="refDiv" :open="props.isOpen" :initial-focus="refDiv" as="div" :class="{ dark: isDarkMode }" @close="closeModal">
      <div class="fixed inset-0 z-30 overflow-y-auto">
        <div class="min-h-screen px-4 text-center">
          <DialogOverlay class="fixed inset-0 opacity-30 bg-gray-200 dark:bg-gray-600" />

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
            <div class="relative inline-block w-fit sm:w-128 align-middle transition-all bg-white dark:bg-app-gray-700 rounded-md shadow">
              <DialogTitle as="div" class="rounded-md flex justify-center py-8 relative" tabindex="0">
                <img
                  class="block h-4 w-auto"
                  :src="isDarkMode ? getWhiteLabelLogoLight() || SolanaLightLogoURL : getWhiteLabelLogoDark() || SolanaLogoURL"
                  alt="Solana Logo"
                />
                <XIcon class="w-6 h-6 absolute top-3 right-3 text-app-text-500 cursor-pointer" @click="closeModal" />
              </DialogTitle>

              <div class="flex flex-col justify-center items-center">
                <div class="text-xs flex flex-row w-full justify-center dark:text-white mt-4 pl-4 pr-4">
                  <span class="break-all">
                    {{ props.publicAddress }}
                  </span>
                  <Button variant="text" @click="copyPrivKey()">
                    <CopyIcon class="w-4 h-4 ml-2" />
                    <!-- {{ t("walletSettings.clickCopy") }} -->
                  </Button>
                </div>
                <img v-if="!isImageLoading" :src="qrsrc" alt="qrcode" class="p-4 m-8 bg-white" />
                <div v-else>
                  <Loader :use-spinner="true" :is-dark="isWhiteLabelDark()" />
                </div>

                <Button class="w-fit mb-7" @click="downloadQr"> Download QR Code</Button>
              </div>
            </div>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

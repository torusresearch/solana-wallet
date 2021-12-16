<script setup lang="ts">
import { Dialog, DialogOverlay, TransitionChild, TransitionRoot } from "@headlessui/vue";
import { WifiIcon } from "@heroicons/vue/outline";
import { addressSlicer } from "@toruslabs/base-controllers";
import { SolanaTransactionActivity } from "@toruslabs/solana-controllers";
import Button from "@toruslabs/vue-components/common/Button.vue";
import { ArrowBoldForvardIcon } from "@toruslabs/vue-icons/arrows";
import { GoogleIcon } from "@toruslabs/vue-icons/auth";
import { PlusIcon } from "@toruslabs/vue-icons/basic";
import { CreditcardFaceIcon } from "@toruslabs/vue-icons/finance";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import SolanaLogo from "@/assets/solana-dark.svg";
import SolanaLogoLight from "@/assets/solana-light.svg";
import ControllerModule from "@/modules/controllers";

const { t } = useI18n();
const selectedNetworkDisplayName = computed(() => ControllerModule.selectedNetworkDisplayName);
const selectedPublicKey = computed(() => ControllerModule.selectedAddress);
const formattedBalance = computed(() => ControllerModule.userBalance);
const currentFiatCurrency = computed(() => ControllerModule.torus.currentCurrency);
const userInfo = computed(() => ControllerModule.torus.userInfo);

withDefaults(
  defineProps<{
    isOpen?: boolean;
    lastTransaction: SolanaTransactionActivity;
  }>(),
  {
    isOpen: false,
  }
);
const emits = defineEmits(["onClose", "showWallet"]);

const closePanel = () => {
  emits("onClose");
};
const showWallet = (path: string) => {
  emits("showWallet", path);
};
</script>

<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog :class="{ dark: ControllerModule.isDarkMode }" as="div" @close="closePanel">
      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="min-h-screen text-center">
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
            <div class="widget-container">
              <div class="p-4 text-left">
                <div class="flex text-xs text-app-text-500 dark:text-app-text-dark-500">
                  <div class="rounded-full border-2 border-app-gray-400">
                    <div class="rounded-full w-8 h-8 overflow-hidden border-2 border-white dark:border-app-gray-800">
                      <img :src="userInfo.profileImage" alt="" srcset="" />
                    </div>
                  </div>
                  <div class="ml-2">
                    <div class="flex items-center font-semibold">
                      <GoogleIcon class="w-3 h-3 mr-2" />
                      {{ userInfo.verifierId }}
                    </div>
                    <div class="flex items-center"><CreditcardFaceIcon class="w-3 h-3 mr-2" />{{ addressSlicer(selectedPublicKey) }}</div>
                  </div>
                </div>
                <div class="flex mt-5 -mb-2 text-app-text-500 dark:text-app-text-dark-500">
                  <div>
                    <div class="text-xs">{{ t("dappPopup.totalValue") }}</div>
                    <div class="text-base font-semibold">{{ formattedBalance }} {{ currentFiatCurrency?.toUpperCase() }}</div>
                  </div>
                  <div class="ml-auto flex">
                    <button
                      class="w-10 h-10 mr-2 rounded-full shadow-md dark:shadow-dark2 flex items-center justify-center focus-within:outline-none"
                      @click="() => showWallet('wallet/transfer')"
                    >
                      <ArrowBoldForvardIcon class="w-4 h-4 text-app-primary-500" />
                    </button>
                    <button
                      class="w-10 h-10 rounded-full shadow-md dark:shadow-dark2 flex items-center justify-center focus-within:outline-none"
                      @click="() => showWallet('wallet/topup')"
                    >
                      <PlusIcon class="w-4 h-4 text-app-primary-500" />
                    </button>
                  </div>
                </div>
                <div class="text-xxs inline-flex items-center text-app-text-500 dark:text-app-text-dark-500">
                  <WifiIcon class="w-2 h-2 mr-1" />{{ selectedNetworkDisplayName }}
                </div>
                <div class="mt-5">
                  <div class="flex border-b pb-1">
                    <div class="text-xs text-app-text-500 dark:text-app-text-dark-500">{{ t("dappPopup.recentActivity") }}</div>
                    <div class="ml-auto">
                      <Button variant="text" @click="() => showWallet('wallet/home')">{{ t("dappPopup.openWallet") }}</Button>
                    </div>
                  </div>
                  <div v-if="lastTransaction" class="flex w-full items-center mt-2">
                    <div class="w-10 h-10 rounded-full shadow-md dark:shadow-dark2 flex items-center justify-center">
                      <img :src="SolanaLogo" alt="activity icon" />
                    </div>
                    <div class="flex flex-grow ml-4 text-xs text-app-text-500 dark:text-app-text-dark-500">
                      <div>
                        <div>{{ t("dappPopup.lastSign") }}</div>
                        <div>{{ addressSlicer(lastTransaction.signature) }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button class="torus-widget__button">
                <img class="torus-widget__button-img" :src="SolanaLogoLight" alt="Login icon" />
              </button>
            </div>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<style scoped>
.widget-container {
  @apply inline-block w-80 pb-5 bg-white dark:bg-app-gray-800 absolute left-9 bottom-9 shadow rounded-md;
}
.torus-widget__button {
  @apply bg-app-primary-500 flex items-center justify-center shadow absolute focus-within:outline-none;
  left: -22px;
  bottom: -22px;
  height: 56px;
  width: 56px;
  border-radius: 28px;
}
.torus-widget__button-img {
  @apply block;
  max-width: 30px;
  max-height: 30px;
}
</style>

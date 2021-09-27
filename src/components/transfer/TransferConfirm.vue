<script setup lang="ts">
import { Dialog, DialogOverlay, DialogTitle, TransitionChild, TransitionRoot } from "@headlessui/vue";
import { WiFiIcon } from "@toruslabs/vue-icons/connection";

import SolanaLogoURL from "@/assets/solana-dark.svg";
import SolanaLightLogoURL from "@/assets/solana-light.svg";
import { Button } from "@/components/common";
import { app } from "@/modules/app";

withDefaults(
  defineProps<{
    isOpen?: boolean;
  }>(),
  {
    isOpen: false,
  }
);

const emits = defineEmits(["onCloseModal"]);
const closeModal = () => {
  emits("onCloseModal");
};
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
              <DialogTitle as="div" class="shadow dark:shadow-dark text-center py-6" tabindex="0">
                <div><img class="h-7 mx-auto w-auto mb-1" :src="app.isDarkMode ? SolanaLightLogoURL : SolanaLogoURL" alt="Casper Logo" /></div>
                <div class="font-header text-lg font-bold text-app-text-600 dark:text-app-text-dark-500">Confirm Transaction</div>
              </DialogTitle>
              <div class="mt-5 px-6 items-center">
                <div class="flex items-center">
                  <div class="pl-5 flex-none">
                    <div
                      class="flex justify-center border border-app-gray-400 dark:border-transparent shadow dark:shadow-dark2 rounded-full w-12 h-12"
                    >
                      <img class="w-6" src="https://app.tor.us/v1.13.2/img/login-facebook.14920ebc.svg" alt="" />
                    </div>
                  </div>
                  <div class="flex-grow">
                    <hr />
                  </div>
                  <div class="pr-5 flex-none">
                    <div
                      class="flex justify-center border border-app-gray-400 dark:border-transparent shadow dark:shadow-dark2 rounded-full w-12 h-12"
                    >
                      <img class="w-6" src="https://app.tor.us/v1.13.2/img/login-facebook.14920ebc.svg" alt="" />
                    </div>
                  </div>
                </div>
                <div class="flex mt-1">
                  <div class="flex-none w-20 text-center">
                    <div class="overflow-ellipsis truncate text-xxs text-app-text-500 dark:text-app-text-dark-500">tom@gmail.com</div>
                    <div class="overflow-ellipsis truncate text-xxs text-app-text-500 dark:text-app-text-dark-500">
                      0x0F48654993568658514F982C87A5BDd01D80969F
                    </div>
                  </div>
                  <div class="flex-grow text-xs text-app-text-500 dark:text-app-text-dark-500 flex items-center justify-center -mt-14">
                    <WiFiIcon class="w-3 h-3 mr-1" /> Casper Network
                  </div>
                  <div class="flex-none w-20 text-center">
                    <div class="overflow-ellipsis truncate text-xxs text-app-text-500 dark:text-app-text-dark-500">tom@gmail.com</div>
                    <div class="overflow-ellipsis truncate text-xxs text-app-text-500 dark:text-app-text-dark-500">
                      0x0F48654993568658514F982C87A5BDd01D80969F
                    </div>
                  </div>
                </div>
                <hr class="mt-3 mb-5" />
                <div class="flex mb-5">
                  <div class="font-body text-xs text-app-text-500 dark:text-app-text-dark-500">Amount to send</div>
                  <div class="ml-auto text-right">
                    <div class="font-body text-xs font-bold text-app-text-500 dark:text-app-text-dark-500">0.009968499999769 ETH</div>
                    <div class="font-body text-xs text-app-text-400 dark:text-app-text-dark-600">~ 33.0737 USD</div>
                  </div>
                </div>
                <div class="flex">
                  <div class="font-body text-xs text-app-text-500 dark:text-app-text-dark-500">Max Transaction Fee</div>
                  <div class="ml-auto text-right">
                    <div class="font-body text-xs font-bold text-app-text-500 dark:text-app-text-dark-500">0.1 USD</div>
                    <div class="font-body text-xs text-app-text-400 dark:text-app-text-dark-600">(In &lt; 30 seconds)</div>
                  </div>
                </div>
                <hr class="my-5" />

                <div class="flex">
                  <div class="font-body text-sm text-app-text-600 dark:text-app-text-dark-400 font-bold">Total Cost</div>
                  <div class="ml-auto text-right">
                    <div class="font-body text-sm font-bold text-app-text-600 dark:text-app-text-dark-400">~0.01 ETH</div>
                    <div class="font-body text-xs text-app-text-400 dark:text-app-text-dark-400">~ 33.18 USD</div>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3 m-6">
                <div><Button class="ml-auto" block variant="tertiary" @click="closeModal">Cancel</Button></div>
                <div><Button class="ml-auto" block variant="primary" @click="closeModal">Confirm</Button></div>
              </div>
            </div>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

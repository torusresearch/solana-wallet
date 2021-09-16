<script setup lang="ts">
import { Dialog, DialogOverlay, DialogTitle, TransitionChild, TransitionRoot } from "@headlessui/vue";
import { CopyIcon, EyeIcon, EyeNoIcon } from "@toruslabs/vue-icons/basic";
import { KeyIcon } from "@toruslabs/vue-icons/security";
import { ref } from "vue";

import { Button } from "@/components/common";
import { app } from "@/modules/app";
import ControllersModule from "@/modules/controllers";

const isOpen = ref(false);
const isKeyShown = ref(false);
const key =
  ControllersModule.torusState.KeyringControllerState.wallets.find(
    (it) => it.address === ControllersModule.torusState.PreferencesControllerState.selectedAddress
  )?.privateKey ?? "Key not found";

const closeModal = () => {
  isOpen.value = false;
};
const openModal = () => {
  isOpen.value = true;
};
</script>
<template>
  <div
    class="
      flex
      p-3
      items-center
      cursor-pointer
      rounded rounded:md
      hover:bg-app-gray-200
      dark:hover:bg-app-gray-400 dark:hover:text-app-text-500
      text-app-text-600
      dark:text-app-text-dark-500
    "
    @click="openModal"
  >
    <KeyIcon class="w-5 h-5 mr-5" />
    <div class="font-body">Account Details</div>
  </div>
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
                max-w-2xl
                p-6
                my-8
                overflow-hidden
                text-left
                align-middle
                transition-all
                transform
                bg-white
                dark:bg-app-gray-700
                shadow-xl
                rounded-2xl
              "
            >
              <DialogTitle
                as="h3"
                class="text-lg font-bold leading-6 text-app-text-500 dark:text-app-text-dark-400 focus-within:outline-none"
                tabindex="0"
                >Private Key</DialogTitle
              >
              <div class="mt-5 flex items-center">
                <div class="flex items-center text-app-text-400 dark:text-app-text-dark-500">
                  <KeyIcon class="w-5 h-5 mr-3" />
                  <div class="font-body font-medium">Show Private Key</div>
                </div>
                <div class="ml-auto">
                  <Button variant="text" @click="isKeyShown = !isKeyShown">
                    <EyeNoIcon v-if="isKeyShown" class="w-5 h-5" />
                    <EyeIcon v-else class="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <div v-if="isKeyShown" class="pl-8 flex items-center mt-2">
                <div class="font-body text-xs text-app-text-500 dark:text-app-text-dark-600 mr-2">{{ key }}</div>
                <Button variant="text">
                  <CopyIcon class="w-4 h-4 mr-1" />
                  Click to copy
                </Button>
              </div>

              <div class="mt-8">
                <Button class="ml-auto" variant="tertiary" @click="closeModal">Close</Button>
              </div>
            </div>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { Dialog, DialogOverlay, TransitionChild, TransitionRoot } from "@headlessui/vue";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

import TorusLogoURL from "@/assets/torus-logo.svg";
import TorusLogoLightURL from "@/assets/torus-logo-light.svg";
import { getTailwindColor } from "@/utils/tailwindHelper";
import { isWhiteLabelDark } from "@/utils/whitelabel";

import ControllerModule from "../../modules/controllers";
import BoxLoader from "../common/BoxLoader.vue";

const { t } = useI18n();

const refDiv = ref(null);
</script>
<template>
  <TransitionRoot appear :show="true" as="template">
    <Dialog :open="true" as="div" :initial-focus="refDiv">
      <div ref="refDiv" class="fixed inset-0 z-30 overflow-y-auto" :class="{ dark: ControllerModule.isDarkMode }">
        <div class="min-h-screen px-4 flex justify-center items-center">
          <DialogOverlay class="fixed inset-0 opacity-30 bg-gray-200 dark:bg-gray-500" />
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <div class="login-container bg-white dark:bg-app-gray-900">
              <div class="flex flex-col justify-center items-center p-10">
                <BoxLoader :background-color="isWhiteLabelDark() ? getTailwindColor('gray', 0) : getTailwindColor('gray', 900)" />
              </div>
              <div class="w-full mt-6 mb-12 text-center">
                <span class="dark:text-white text-app-text-600 text-opacity-70 text-xs font-normal mr-2">{{ t("dappLogin.poweredBy") }}</span>
                <img
                  :src="ControllerModule.isDarkMode ? TorusLogoLightURL : TorusLogoURL"
                  alt="Torus Logo"
                  class="h-4 w-auto opacity-70 inline-block"
                />
              </div>
            </div>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<style scoped>
.login-container {
  @apply flex
        flex-col
        items-center
        w-full
        max-w-xs
        my-4
        overflow-hidden
        text-left
        transition-all
        shadow
        rounded-lg
        relative
        z-20;
  height: auto;
  font-family: "DM Sans", "Roboto", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-weight: 500;
}
.dapp-logo {
  min-width: 24px;
  min-height: 24px;
  max-width: 48px;
  max-height: 48px;
}
</style>

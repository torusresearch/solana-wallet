<script setup lang="ts">
import { Dialog, DialogOverlay, DialogTitle, TransitionChild, TransitionRoot } from "@headlessui/vue";
import { XIcon } from "@heroicons/vue/solid";
import { LOGIN_PROVIDER } from "@toruslabs/openlogin";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

import TorusLogoLightURL from "@/assets/torus-logo-light.svg";
import { LoginButtons } from "@/components/login";
import config from "@/config";
import ControllerModule from "@/modules/controllers";
import { LOGIN_CONFIG } from "@/utils/enums";

withDefaults(
  defineProps<{
    isOpen?: boolean;
    otherWallets?: string;
  }>(),
  {
    isOpen: false,
    otherWallets: "false",
  }
);

const { t } = useI18n();

const emits = defineEmits(["onClose", "onLogin"]);

const closeModal = () => {
  emits("onClose");
};
const onLogin = (provider: string, userEmail: string) => {
  emits("onLogin", provider, userEmail);
};

const loginButtonsArray: LOGIN_CONFIG[] = Object.values(config.loginConfig);

const activeButton = ref<string>(LOGIN_PROVIDER.GOOGLE);

const setActiveButton = (provider: string) => {
  activeButton.value = provider;
};
const refDiv = ref(null);
</script>
<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog :open="isOpen" :class="{ dark: ControllerModule.isDarkMode || true }" as="div" :initial-focus="refDiv">
      <div ref="refDiv" class="fixed inset-0 z-10 overflow-y-auto">
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
            <div class="login-container">
              <DialogTitle as="div" class="py-0 px-4 relative focus-within:outline-none bg-transparent w-full" tabindex="0">
                <h1 class="font-bold text-white text-2xl mt-10 text-center">
                  {{ t("login.setupWallet") }}
                </h1>
                <div
                  class="w-7 h-7 absolute top-3 right-3 cursor-pointer rounded-full bg-white bg-opacity-5 flex items-center justify-center"
                  @click="closeModal"
                  @keydown="closeModal"
                >
                  <XIcon class="w-5 h-5 text-white text-opacity-70 hover:text-opacity-100" />
                </div>
              </DialogTitle>
              <p class="text-white text-opacity-80 font-normal text-sm mt-4 text-center px-7">
                {{ t("login.poweredBy") }}
              </p>
              <div class="mt-8 w-full px-4">
                <LoginButtons
                  :is-embed="true"
                  :active-button="activeButton"
                  :login-buttons="loginButtonsArray"
                  @on-login="onLogin"
                  @on-hover="setActiveButton"
                />
              </div>
              <div class="w-full mt-6 mb-12 text-center">
                <span class="text-white text-opacity-70 text-xs font-normal mr-2">{{ t("dappLogin.poweredBy") }}</span>
                <img :src="TorusLogoLightURL" alt="Torus Logo" class="h-4 w-auto opacity-70 inline-block" />
              </div>
              <div
                v-if="otherWallets === 'true'"
                class="mt-auto pt-4 pb-6 px-2 w-full border-t-2 border-solid border-white border-opacity-10 text-center"
              >
                <span class="cursor-pointer text-base text-white font-normal hover:text-opacity-80" tabindex="0">{{
                  t("login.differentWallet")
                }}</span>
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
    transform
    bg-white
    dark:bg-app-gray-800
    shadow
    rounded-lg;
  height: auto;
  font-family: "DM Sans", "Roboto", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-weight: 500;
  background-color: #10141f !important;
}
</style>

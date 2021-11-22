<script setup lang="ts">
import { Dialog, DialogOverlay, DialogTitle, TransitionChild, TransitionRoot } from "@headlessui/vue";
import { XIcon } from "@heroicons/vue/solid";
import { LOGIN_PROVIDER } from "@toruslabs/openlogin";
import { ref } from "vue";

import TorusLogoLightURL from "@/assets/torus-logo-light.svg";
import { LoginButtons } from "@/components/login";
import config from "@/config";
import ControllersModule from "@/modules/controllers";
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

const emits = defineEmits(["onClose", "onLogin"]);

const closeModal = () => {
  emits("onClose");
};
const onLogin = (provider: string, userEmail: string) => {
  emits("onLogin", provider, userEmail);
};

// TODO: integrate
const loginButtonsArray: LOGIN_CONFIG[] = Object.values(config.loginConfig);

const activeButton = ref<string>(LOGIN_PROVIDER.GOOGLE);

const setActiveButton = (provider: string) => {
  activeButton.value = provider;
};
</script>
<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog :class="{ dark: ControllersModule.isDarkMode || true }" as="div">
      <div class="fixed inset-0 z-10 overflow-y-auto">
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
                <h1 class="font-bold text-white login-title mt-14 text-center">Setup your digital wallet</h1>
                <div
                  class="w-8 h-8 absolute top-4 right-4 cursor-pointer rounded-full bg-white bg-opacity-5 flex items-center justify-center"
                  @click="closeModal"
                  @keydown="closeModal"
                >
                  <XIcon class="w-6 h-6 text-white text-opacity-70 hover:text-opacity-100" />
                </div>
              </DialogTitle>
              <p class="text-white text-opacity-80 font-normal text-xl mt-4 text-center px-7">
                Powered by Torus — Use it now, and on any app that accepts Torus.
              </p>
              <div class="mt-14 w-full px-4">
                <LoginButtons
                  :is-embed="true"
                  :active-button="activeButton"
                  :login-buttons="loginButtonsArray"
                  @on-login="onLogin"
                  @on-hover="setActiveButton"
                />
              </div>
              <div class="flex justify-center items-center mt-9">
                <span class="text-white text-opacity-70 mr-2 text-xs font-normal">Powered by</span>
                <img :src="TorusLogoLightURL" alt="Torus Logo" class="h-4 w-auto opacity-70" />
              </div>
              <div
                v-if="otherWallets === 'true'"
                class="mt-auto pt-4 pb-6 px-2 w-full border-t-2 border-solid border-white border-opacity-10 text-center"
              >
                <span class="cursor-pointer text-base text-white font-normal hover:text-opacity-80" tabindex="0"
                  >Want to try a different wallet?</span
                >
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
    max-w-sm
    my-8
    overflow-hidden
    text-left
    transition-all
    transform
    bg-white
    dark:bg-app-gray-800
    shadow
    rounded-lg;
  height: 45rem;
  font-family: "DM Sans", "Roboto", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-weight: 500;
  background-color: #10141f !important;
}

.login-title {
  font-size: 1.75rem;
  line-height: 2.1rem;
}
</style>

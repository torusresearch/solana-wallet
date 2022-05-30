<script setup lang="ts">
import { Dialog, DialogOverlay, DialogTitle, TransitionChild, TransitionRoot } from "@headlessui/vue";
import { XIcon } from "@heroicons/vue/solid";
import { LOGIN_PROVIDER } from "@toruslabs/openlogin";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { LoginButtons } from "@/components/login";
import config from "@/config";
import { LOGIN_CONFIG } from "@/utils/enums";
import { hideCrispButton } from "@/utils/helpers";

import ControllerModule from "../../modules/controllers";

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

onMounted(() => {
  hideCrispButton();
});
</script>
<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog :open="isOpen" as="div" :initial-focus="refDiv">
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
            <div class="login-container bg-white dark:bg-app-gray-800">
              <DialogTitle as="div" class="py-0 px-4 relative focus-within:outline-none bg-transparent w-full" tabindex="0">
                <h1 class="font-bold dark:text-white text-app-text-600 text-2xl mt-10 text-center">
                  {{ t("login.setupWallet") }}
                </h1>
                <div
                  class="w-7 h-7 absolute top-3 right-3 cursor-pointer rounded-full bg-opacity-3 dark:bg-white dark:bg-opacity-5 flex items-center justify-center"
                  @click="closeModal"
                  @keydown="closeModal"
                >
                  <XIcon class="w-5 h-5 text-app-gray-800 dark:text-white text-opacity-70 hover:text-opacity-100" />
                </div>
              </DialogTitle>
              <p class="dark:text-white text-app-text-600 text-opacity-80 font-normal text-sm mt-4 text-center px-7">
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
              <div class="text-xs text-app-text-600 dark:text-app-text-dark-500 font-light mt-6">
                {{ t("dappLogin.selfCustodial") }}
              </div>
              <img src="../../assets/web3auth-logo.svg" alt="web3auth logo" />
              <div class="text-xs text-app-text-600 dark:text-app-text-dark-500 font-light mb-12">
                <a
                  class="font-body text-xs text-app-text-400 dark:text-app-text-dark-600 font-light underline"
                  href="https://docs.web3auth.io/"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {{ t("dappLogin.howWorks") }}
                </a>
              </div>
              <div
                v-if="otherWallets === 'true'"
                class="mt-auto pt-4 pb-6 px-2 w-full border-t-2 border-solid border-white border-opacity-10 text-center"
              >
                <span class="cursor-pointer text-base dark:text-white text-app-text-600 font-normal hover:text-opacity-80" tabindex="0">{{
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
    shadow
    rounded-lg
    relative
    z-20;
  height: auto;
  font-family: "DM Sans", "Roboto", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-weight: 500;
}
</style>

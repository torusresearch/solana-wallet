<script setup lang="ts">
import { Dialog, DialogOverlay, DialogTitle, TransitionChild, TransitionRoot } from "@headlessui/vue";
import { XIcon } from "@heroicons/vue/solid";
import { LOGIN_PROVIDER } from "@toruslabs/openlogin";
import { computed, ref } from "vue";

import { LoginButtons, LoginFooter, LoginTitle } from "@/components/login";
import config from "@/config";
import ControllersModule from "@/modules/controllers";
import { LOGIN_CONFIG } from "@/utils/enums";
import { thirdPartyAuthenticators } from "@/utils/helpers";

withDefaults(
  defineProps<{
    isOpen?: boolean;
  }>(),
  {
    isOpen: false,
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
const activeButtonDetails = computed(() => {
  return loginButtonsArray.find((x) => x.loginProvider === activeButton.value);
});

const thirdPartyAuthenticatorList = computed(() => {
  return thirdPartyAuthenticators(loginButtonsArray);
});

const setActiveButton = (provider: string) => {
  activeButton.value = provider;
};
</script>
<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog :class="{ dark: ControllersModule.isDarkMode || true }" as="div">
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
            <div class="login-container">
              <DialogTitle
                as="div"
                class="bg-white dark:bg-app-gray-700 shadow dark:shadow-dark rounded-md py-7 px-6 relative focus-within:outline-none"
                tabindex="0"
              >
                <LoginTitle :is-embed="true" :button-details="activeButtonDetails" />
                <XIcon class="w-6 h-6 absolute top-3 right-3 text-app-text-500 cursor-pointer" @click="closeModal" />
              </DialogTitle>
              <div class="p-6">
                <LoginButtons
                  :is-embed="true"
                  :active-button="activeButton"
                  :login-buttons="loginButtonsArray"
                  @on-login="onLogin"
                  @on-hover="setActiveButton"
                />
                <LoginFooter :third-party-authenticator-list="thirdPartyAuthenticatorList" :is-embed="true" />
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
  @apply inline-block
    w-full
    max-w-sm
    my-8
    overflow-hidden
    text-left
    align-middle
    transition-all
    transform
    bg-white
    dark:bg-app-gray-800
    shadow
    rounded-md;
}
</style>

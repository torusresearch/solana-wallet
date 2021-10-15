<script setup lang="ts">
import { LOGIN_PROVIDER, LOGIN_PROVIDER_TYPE } from "@toruslabs/openlogin";
import useVuelidate from "@vuelidate/core";
import { email, required } from "@vuelidate/validators";
import log from "loglevel";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import SolanaLogoURL from "@/assets/solana-dark.svg";
import SolanaLightLogoURL from "@/assets/solana-light.svg";
import { addToast, app } from "@/modules/app";

import { Button } from "../components/common";
import TextField from "../components/common/TextField.vue";
import ControllerModule from "../modules/controllers";

const router = useRouter();
const userEmail = ref("");
const isLoading = ref(false);

const rules = computed(() => {
  return {
    userEmail: { required, email },
  };
});
const $v = useVuelidate(rules, { userEmail });

onMounted(() => {
  const address = ControllerModule.torusState.PreferencesControllerState.selectedAddress;
  if (address) router.push("/wallet/home");
});

const onLogin = async (loginProvider: LOGIN_PROVIDER_TYPE, userEmail: string) => {
  try {
    isLoading.value = true;
    await ControllerModule.triggerLogin({
      loginProvider,
      login_hint: userEmail,
    });
    const address = ControllerModule.torusState.PreferencesControllerState.selectedAddress;
    if (address) router.push("/wallet/home");
  } catch (error) {
    log.error(error);
    addToast({
      message: "Something went wrong, please try again.",
      type: "error",
    });
  } finally {
    isLoading.value = false;
  }
};

const onEmailLogin = () => {
  $v.value.$touch();
  if (!$v.value.$invalid) {
    onLogin(LOGIN_PROVIDER.EMAIL_PASSWORDLESS, userEmail.value);
  }
};
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-app-gray-800 grid grid-cols-2">
    <div class="col-span-1 flex items-center">
      <div class="grid grid-cols-6 w-full">
        <div class="col-span-4 col-start-2 w-full mx-auto">
          <img class="block mb-7 h-7 w-auto" :src="app.isDarkMode ? SolanaLightLogoURL : SolanaLogoURL" alt="Casper Logo" />
          <div class="font-header text-app-text-500 dark:text-app-text-dark-400 text-3xl mb-4">
            <div>Your Google</div>
            <div>digital wallet in one-click</div>
          </div>
          <div class="grid grid-cols-3 gap-2 w-10/12">
            <div class="col-span-3">
              <Button variant="tertiary" :block="true" @click="onLogin('google')"
                ><img class="w-6 mr-2" src="https://app.tor.us/v1.13.2/img/login-google.aca78493.svg" alt="" />Continue with Google</Button
              >
            </div>
            <div class="col-span-1">
              <Button variant="tertiary" icon :block="true" @click="onLogin('facebook')">
                <img class="w-6" src="https://app.tor.us/v1.13.2/img/login-facebook.14920ebc.svg" alt="" />
              </Button>
            </div>
            <div class="col-span-1">
              <Button variant="tertiary" icon :block="true" @click="onLogin('twitter')">
                <img class="w-6" src="https://app.tor.us/v1.13.2/img/login-twitter.9caed22d.svg" alt="" />
              </Button>
            </div>
            <div class="col-span-1">
              <Button variant="tertiary" icon :block="true" @click="onLogin('discord')">
                <img class="w-6" src="https://app.tor.us/v1.13.2/img/login-discord.8a29d113.svg" alt="" />
              </Button>
            </div>
          </div>
          <div class="mt-3 relative w-10/12">
            <div class="absolute inset-0 flex items-center" aria-hidden="true">
              <div class="w-full border-t border-app-text-400" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white dark:bg-app-gray-800 text-app-text-500 dark:text-app-text-dark-600">or</span>
            </div>
          </div>
          <div class="mt-3 w-10/12">
            <form @submit.prevent="onEmailLogin">
              <TextField v-model.lazy="userEmail" variant="dark-bg" class="mb-3" placeholder="Enter your email" :errors="$v.userEmail.$errors" />
              <Button variant="tertiary" :block="true" type="submit">Continue with Email</Button>
            </form>
          </div>
          <div class="mt-8 mb-2 w-10/12">
            <div class="font-body text-xs text-app-text-600 dark:text-app-text-dark-500 font-bold mb-2">Note:</div>
            <div class="font-body text-xs text-app-text-400 dark:text-app-text-dark-600 font-light mb-2">
              Torus does not store any data related to your social logins.
            </div>
            <div class="font-body text-xs text-app-text-400 dark:text-app-text-dark-600 font-light">
              The following sign-ins involve a third party authenticator: Apple, Email, GitHub, Kakao, LINE, LinkedIn, Twitter, WeChat.
            </div>
          </div>

          <div class="inset-0 flex items-center mt-4 mb-1" aria-hidden="true">
            <div class="w-full border-t border-gray-300" />
          </div>

          <div class="space-x-3">
            <a class="font-body text-xs text-app-primary-500" href="https://docs.tor.us/legal/terms-and-conditions" target="_blank"
              >Terms of Service</a
            >
            <a class="font-body text-xs text-app-primary-500" href="https://docs.tor.us/legal/privacy-policy" target="_blank">Privacy Policy</a>
            <a class="font-body text-xs text-app-primary-500" href="https://t.me/TorusLabs" target="_blank">Contact us</a>
          </div>
        </div>
      </div>
    </div>
    <div class="col-span-1 flex items-center">
      <div class="grid grid-cols-8 w-full">
        <div class="col-span-6 col-start-2 w-full mx-auto text-center text-app-text-500 dark:text-app-text-dark-500">
          <img src="https://app.tor.us/v1.13.2/img/login-bg-1.4fa6ad65.svg" alt="" />
          <div class="font-header text-xl mb-2">Interact with thousands of apps on the blockchain</div>
          <div class="font-body text-base">Access the decentralised world with Torus</div>

          <Button size="small" variant="tertiary" class="mx-auto mt-5">Visit our website</Button>
        </div>
      </div>
    </div>
  </div>
</template>

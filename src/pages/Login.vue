<script setup lang="ts">
import { LOGIN_PROVIDER, LOGIN_PROVIDER_TYPE } from "@toruslabs/openlogin";
import Loader from "@toruslabs/vue-components/common/Loader.vue";
import { useVuelidate } from "@vuelidate/core";
import { email, required } from "@vuelidate/validators";
import log from "loglevel";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import Landing from "@/assets/auth/landing.svg";
import SolanaLogoURL from "@/assets/solana-dark.svg";
import SolanaLightLogoURL from "@/assets/solana-light.svg";
import TorusLogoURL from "@/assets/torus-logo.svg";
import TorusLogoLightURL from "@/assets/torus-logo-light.svg";
import { addToast, app } from "@/modules/app";

import { Button } from "../components/common";
import TextField from "../components/common/TextField.vue";
import ControllerModule from "../modules/controllers";
import { redirectToResult, useRedirectFlow } from "../utils/redirectflow_helpers";

const { isRedirectFlow, method, resolveRoute } = useRedirectFlow();

const { t } = useI18n();
const router = useRouter();
const userEmail = ref("");
const isLoading = ref(false);

const rules = computed(() => {
  return {
    userEmail: { required, email },
  };
});
const $v = useVuelidate(rules, { userEmail });

const selectedAddress = computed(() => ControllerModule.selectedAddress);

onMounted(() => {
  if (selectedAddress.value && isRedirectFlow) redirectToResult(method, { success: true, selectedAddress: selectedAddress.value }, resolveRoute);
  if (selectedAddress.value && !isRedirectFlow) router.push("/wallet/home");
});

const onLogin = async (loginProvider: LOGIN_PROVIDER_TYPE, emailString?: string) => {
  try {
    isLoading.value = true;
    await ControllerModule.triggerLogin({
      loginProvider,
      login_hint: emailString,
    });
    const redirect = new URLSearchParams(window.location.search).get("redirectTo"); // set by the router
    if (redirect) router.push(`${redirect}&resolveRoute=${resolveRoute}${window.location.hash}`);
    else if (isRedirectFlow) {
      redirectToResult(method, { success: true, selectedAddress: selectedAddress.value }, resolveRoute);
    } else if (selectedAddress.value) {
      isLoading.value = false;
      router.push("/wallet/home");
    }
  } catch (error) {
    log.error(error);
    if (isRedirectFlow) {
      redirectToResult(method, { success: false }, resolveRoute, false);
    }
    addToast({
      message: t("login.loginError"),
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
  <div class="height-full bg-white dark:bg-app-gray-800 grid grid-cols-6 py-3" :class="[isLoading ? 'overflow-hidden' : '']">
    <div class="col-span-6 md:col-span-4 lg:col-span-3 h-full flex items-center">
      <div class="grid grid-cols-12 w-full">
        <div class="col-start-2 col-end-12 xl:col-start-3 xl:col-end-10">
          <img class="block mb-4 h-6 w-auto" :src="app.isDarkMode ? TorusLogoLightURL : TorusLogoURL" alt="Torus Logo" />
          <div class="flex items-center border-b w-56 pb-4 mb-9">
            <div class="mr-2 text-base text-app-text-500 dark:text-app-text-dark-500">
              {{ t("dappLogin.buildOn") }}
            </div>
            <img class="h-3 w-auto" :src="app.isDarkMode ? SolanaLightLogoURL : SolanaLogoURL" alt="Solana Logo" />
          </div>
          <div class="font-header text-app-text-500 dark:text-app-text-dark-400 text-3xl mb-4" :style="{ maxWidth: '360px' }">
            {{ t("login.title") }}
          </div>
          <div class="grid grid-cols-3 gap-2 w-full">
            <div class="col-span-3">
              <Button variant="tertiary" :block="true" class="w-full" @click="onLogin('google')"
                ><img class="w-6 mr-2" src="https://app.tor.us/v1.13.2/img/login-google.aca78493.svg" alt="" />{{
                  t("dappLogin.continue", { verifier: "Google" })
                }}</Button
              >
            </div>
            <div class="col-span-1">
              <Button variant="tertiary" icon :block="true" class="w-full" @click="onLogin('facebook')">
                <img class="w-6" src="https://app.tor.us/v1.13.2/img/login-facebook.14920ebc.svg" alt="" />
              </Button>
            </div>
            <div class="col-span-1">
              <Button variant="tertiary" icon :block="true" class="w-full" @click="onLogin('twitter')">
                <img class="w-6" src="https://app.tor.us/v1.13.2/img/login-twitter.9caed22d.svg" alt="" />
              </Button>
            </div>
            <div class="col-span-1">
              <Button variant="tertiary" icon :block="true" class="w-full" @click="onLogin('discord')">
                <img class="w-6" src="https://app.tor.us/v1.13.2/img/login-discord.8a29d113.svg" alt="" />
              </Button>
            </div>
          </div>
          <div class="mt-3 relative w-full">
            <div class="absolute inset-0 flex items-center" aria-hidden="true">
              <div class="w-full border-t border-app-text-400" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white dark:bg-app-gray-800 text-app-text-500 dark:text-app-text-dark-600">or</span>
            </div>
          </div>
          <div class="mt-3 w-full">
            <form @submit.prevent="onEmailLogin">
              <TextField
                v-model.lazy="userEmail"
                variant="dark-bg"
                class="mb-3"
                :placeholder="t('login.enterYourEmail')"
                :errors="$v.userEmail.$errors"
              />
              <Button variant="tertiary" :block="true" type="submit" class="w-full mt-2">{{
                t("dappLogin.continue", { verifier: t("loginCountry.email") })
              }}</Button>
            </form>
          </div>
          <div class="mt-8 mb-2 w-full">
            <div class="text-xs text-app-text-600 dark:text-app-text-dark-500 font-bold mb-2">
              {{ t("dappLogin.note") }}
            </div>
            <div class="text-xs text-app-text-400 dark:text-app-text-dark-600 font-light mb-2">
              {{ t("login.dataPrivacy") }}
            </div>
            <div class="text-xs text-app-text-400 dark:text-app-text-dark-600 font-light">
              {{ `${t("dappLogin.termsAuth01")} ${t("dappLogin.termsAuth02")}` }}
            </div>
          </div>

          <div class="inset-0 flex items-center mt-4 mb-1" aria-hidden="true">
            <div class="w-full border-t border-gray-300" />
          </div>

          <div class="space-x-3">
            <a class="text-xs text-app-primary-500" href="https://docs.tor.us/legal/terms-and-conditions" target="_blank">{{
              t("dappLogin.termsConditions")
            }}</a>
            <a class="text-xs text-app-primary-500" href="https://docs.tor.us/legal/privacy-policy" target="_blank">{{
              t("dappLogin.privacyPolicy")
            }}</a>
            <a class="text-xs text-app-primary-500" href="https://t.me/TorusLabs" target="_blank">{{ t("dappLogin.contactUs") }}</a>
          </div>
        </div>
      </div>
    </div>
    <div class="col-span-6 md:col-span-2 lg:col-span-3 h-full flex items-center">
      <div class="grid grid-cols-8 w-full">
        <div class="col-span-6 col-start-2 w-full mx-auto text-center text-app-text-500 dark:text-app-text-dark-500">
          <img :src="Landing" alt="" />
          <div class="font-header text-xl mb-2">
            {{ t("dappLogin.sendReceive") }}
          </div>
          <div class="text-base">{{ t("dappLogin.transactEasy") }} <br />{{ t("login.slide1Subtitle2") }}</div>
        </div>
      </div>
    </div>
    <div v-if="isLoading" class="spinner">
      <Loader></Loader>
      <p class="absolute bottom-12 text-white text-center">{{ t("dappLogin.completeVerification") }}.</p>
    </div>
  </div>
</template>
<style scoped>
.spinner {
  position: fixed;
  background: rgba(0, 0, 0, 0.884);
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}
</style>

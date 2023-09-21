<script setup lang="ts">
import { LOGIN_PROVIDER, LOGIN_PROVIDER_TYPE } from "@toruslabs/openlogin-utils";
import { Loader } from "@toruslabs/vue-components/common";
import { useVuelidate } from "@vuelidate/core";
import { email, required } from "@vuelidate/validators";
import { throttle } from "lodash-es";
import log from "loglevel";
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import DiscordLoginImage from "@/assets/auth/login-discord.svg";
import FacebookLoginImage from "@/assets/auth/login-facebook.svg";
import GoogleLoginImage from "@/assets/auth/login-google.svg";
import TwitterLoginImage from "@/assets/auth/login-twitter.svg";
import LoginDropDown from "@/components/loginDropdown/LoginDropDown.vue";
import LoginFooter from "@/components/loginFooter/LoginFooter.vue";
import LoginSlider from "@/components/loginSlider/LoginSlider.vue";
import { LoginInteractions } from "@/directives/google-analytics";
import { addToast, app } from "@/modules/app";
import { AVAILABLE_WEBSITES } from "@/utils/enums";
import { isWhiteLabelDark } from "@/utils/whitelabel";

import { Button } from "../components/common";
import TextField from "../components/common/TextField.vue";
import ControllerModule from "../modules/controllers";
import { redirectToResult, useRedirectFlow } from "../utils/redirectflowHelpers";

const { isRedirectFlow, method, jsonrpc, req_id, resolveRoute } = useRedirectFlow();

const socialLoginOptions = [
  {
    googleAnalyticsTag: LoginInteractions.LOGIN_GOOGLE,
    loginType: LOGIN_PROVIDER.GOOGLE,
    imageHeight: "30px",
    imageClass: "w-6 mr-2 login-button-images",
    divClass: "col-span-3",
    imageSrc: GoogleLoginImage,
    imgAltText: "Login with Google",
    buttonLoginText: true,
    translateLoginText: "dappLogin.continue",
    verifier: "Google",
  },
  {
    googleAnalyticsTag: LoginInteractions.LOGIN_FACEBOOK,
    imageClass: "w-6 login-button-images",
    loginType: LOGIN_PROVIDER.FACEBOOK,
    imageSrc: FacebookLoginImage,
    imgAltText: "Login with Facebook",
  },
  {
    googleAnalyticsTag: LoginInteractions.LOGIN_TWITTER,
    loginType: LOGIN_PROVIDER.TWITTER,
    imageClass: "w-6 login-button-images",
    imageSrc: TwitterLoginImage,
    imgAltText: "Login with Twitter",
  },
  {
    googleAnalyticsTag: LoginInteractions.LOGIN_DISCORD,
    imageClass: "w-6 login-button-images",
    loginType: LOGIN_PROVIDER.DISCORD,
    imageSrc: DiscordLoginImage,
    imgAltText: "Login with Discord",
  },
];

const listOfChains = ref<{ value: string; label: string; img?: string; link?: string }[]>([
  { label: "Solana", value: "Solana", img: "icon-solana.svg", link: AVAILABLE_WEBSITES.Solana },
  { label: "Ethereum", value: "Ethereum", img: "icon-ethereum.svg", link: AVAILABLE_WEBSITES.Ethereum },
  { label: "Polygon", value: "Polygon", img: "icon-polygon.svg", link: AVAILABLE_WEBSITES.Polygon },
  { label: "Binance", value: "Binance", img: "icon-binance.svg", link: AVAILABLE_WEBSITES.Binance },
]);
const selectedChain = ref(listOfChains.value[0]);

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

const hasSelectedPrivateKey = computed(() => ControllerModule.hasSelectedPrivateKey);
const selectedAddress = computed(() => ControllerModule.selectedAddress);

onMounted(() => {
  log.info("app is dark mode", app);
  if (hasSelectedPrivateKey.value && isRedirectFlow) {
    redirectToResult(jsonrpc, { success: true, data: { selectedAddress: selectedAddress.value }, method }, req_id, resolveRoute);
  }
});

watch(hasSelectedPrivateKey, () => {
  if (hasSelectedPrivateKey.value && !isRedirectFlow) router.push("/wallet/home");
});

const saveLoginStateToWindow = (value: boolean): void => {
  if (typeof window !== "undefined") {
    window.loginInProgress = value;
  }
};
const onLogin = async (loginProvider: LOGIN_PROVIDER_TYPE, emailString?: string) => {
  try {
    isLoading.value = true;
    saveLoginStateToWindow(isLoading.value);
    await ControllerModule.triggerLogin({
      loginProvider,
      login_hint: emailString,
      waitSaving: isRedirectFlow,
    });
    const redirect = new URLSearchParams(window.location.search).get("redirectTo"); // set by the router
    if (redirect) router.push(`${redirect}?resolveRoute=${resolveRoute}${window.location.hash}`);
    else if (isRedirectFlow) {
      redirectToResult(jsonrpc, { success: true, data: { selectedAddress: selectedAddress.value }, method }, req_id, resolveRoute);
    } else if (selectedAddress.value) {
      isLoading.value = false;
      router.push("/wallet/home");
    }
  } catch (error) {
    log.error(error);
    if (isRedirectFlow) {
      redirectToResult(jsonrpc, { success: false, method }, req_id, resolveRoute);
    }
    addToast({
      message: t("login.loginError"),
      type: "error",
    });
  } finally {
    isLoading.value = false;
    saveLoginStateToWindow(isLoading.value);
  }
};

const onEmailLogin = () => {
  $v.value.$touch();
  if (!$v.value.$invalid) {
    onLogin(LOGIN_PROVIDER.EMAIL_PASSWORDLESS, userEmail.value);
  }
};

watch(
  selectedChain,
  throttle(() => {
    window.location.href = selectedChain.value.link || "";
  }, 500)
);
</script>

<template>
  <div class="height-full bg-white dark:bg-app-loginBg grid grid-cols-6 py-3" :class="[isLoading ? 'overflow-hidden' : '']">
    <div class="grid grid-cols-12 col-span-6 md:col-span-4 lg:col-span-3 2xl:col-span-2 2xl:col-start-2 h-full md:h-auto">
      <div class="col-end-12 col-span-10 lg:col-end-13 lg:col-span-9 xl:col-end-12 xl:col-span-8 2xl:col-end-10 2xl:col-span-9 md:m-auto">
        <div class="grid grid-cols-12 md-h-screen md:h-auto login-container md:bg-[#1f2a37]">
          <div class="col-start-2 col-span-10 mb-32 md:col-start-3 md:col-span-8 md:mb-[10%] md:mt-[10%]">
            <img
              height="1.5rem"
              width="auto"
              class="block h-6 w-auto my-7"
              :src="require(`../assets/torus-logo-${app.isDarkMode ? 'white' : 'blue'}.svg`)"
              alt="Torus Logo"
            />
            <div class="font-header text-app-text-500 dark:text-app-text-dark-500 text-2xl ml-auto mr-auto flex">
              <span class="mr-1.5"> Your </span>
              <LoginDropDown v-model="selectedChain" size="small" :items="listOfChains" />
            </div>
            <div class="font-header text-app-text-500 dark:text-app-text-dark-500 text-xl md:mb-4 mb-8 ml-auto mr-auto">wallet in one click</div>
            <div class="grid grid-cols-3 gap-2 w-full mx-auto">
              <template v-for="loginButton in socialLoginOptions" :key="loginButton.loginType">
                <div :class="loginButton.divClass || `col-span-1`">
                  <Button
                    size="large"
                    :v-ga="loginButton.googleAnalyticsTag"
                    variant="tertiary"
                    :block="true"
                    class="border-2 border-app-gray-500 dark:bg-app-loginBg border-solid w-full dark:text-app-gray-400"
                    @click="onLogin(loginButton.loginType)"
                    ><img
                      width="1.5rem"
                      :height="loginButton.imageHeight || `auto`"
                      :class="loginButton.imageClass || `w-6`"
                      :src="loginButton.imageSrc"
                      :alt="loginButton.imgAltText"
                    />
                    <template v-if="loginButton.buttonLoginText">
                      {{ t(loginButton.translateLoginText, { verifier: loginButton.verifier }) }}
                    </template>
                  </Button>
                </div>
              </template>
            </div>
            <div class="mt-3 relative w-full">
              <div class="absolute inset-0 flex items-center" aria-hidden="true">
                <div class="w-full border-t border-app-text-400"></div>
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
                  class="mb-3 dark:text-app-text-dark-500 dark:bg-app-loginBg"
                  :placeholder="t('login.enterYourEmail')"
                  :errors="$v.userEmail.$errors"
                />
                <Button
                  v-ga="LoginInteractions.LOGIN_EMAIL"
                  variant="tertiary"
                  :block="true"
                  type="submit"
                  class="w-full mt-2 dark:text-app-gray-400 dark:bg-app-loginBg"
                  >{{ t("dappLogin.continue", { verifier: t("loginCountry.email") }) }}
                </Button>
              </form>
            </div>
            <div class="hidden md:inline-block">
              <LoginFooter />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="col-span-6 md:col-span-2 lg:col-span-3 xl:col-span-2 h-full flex items-center">
      <div class="grid grid-cols-8 w-full">
        <div class="col-span-6 col-start-2 w-full mx-auto text-center text-app-text-500 dark:text-app-text-dark-500">
          <LoginSlider />
        </div>
      </div>
    </div>
    <div class="flex md:hidden flex-col col-span-6 md:col-span-2 lg:col-span-3 h-full justify-center mx-10 items-center">
      <LoginFooter />
    </div>
    <div v-if="isLoading" class="flex justify-center items-center fixed bg-white dark:bg-app-gray-800 inset-0 h-full w-full z-10">
      <Loader :use-spinner="true" :is-dark="isWhiteLabelDark()" />
      <p class="absolute bottom-12 text-white text-center">{{ t("dappLogin.completeVerification") }}.</p>
    </div>
  </div>
</template>

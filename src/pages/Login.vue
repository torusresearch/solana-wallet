<script setup lang="ts">
import { LOGIN_PROVIDER_TYPE } from "@toruslabs/openlogin";
import log from "loglevel";
import { ref } from "vue";
import { useRouter } from "vue-router";

import { requireLoggedIn } from "@/modules/auth";

import { Button } from "../components/common";
import TextField from "../components/common/TextField.vue";
import ControllerModule from "../modules/controllers";

const router = useRouter();
const email = ref("");
const isLoading = ref(false);

requireLoggedIn();

const onLogin = async (loginProvider: LOGIN_PROVIDER_TYPE) => {
  try {
    isLoading.value = true;
    await ControllerModule.triggerLogin({
      loginProvider,
      login_hint: email.value ?? "",
    });
    const address = ControllerModule.torusState.PreferencesControllerState.selectedAddress;
    if (address) router.push("/wallet/home");
  } catch (error) {
    log.error(error);
    alert("Something went wrong, please try again.");
  } finally {
    isLoading.value = false;
  }
};
</script>
<template>
  <div class="min-h-screen bg-gray-100 grid grid-cols-2">
    <div class="col-span-1 flex items-center">
      <div class="grid grid-cols-6 w-full">
        <div class="col-span-4 col-start-2 w-full mx-auto">
          <img class="mb-7" src="https://app.tor.us/v1.13.2/img/torus-logo-blue.829106db.svg" alt="" />
          <div class="font-header text-app-text-500 text-3xl mb-4">
            <div>Your Google</div>
            <div>digital wallet in one-click</div>
          </div>
          <div class="grid grid-cols-3 gap-2 w-10/12">
            <div class="col-span-3">
              <Button variant="tertiary" block @click="onLogin('google')"
                ><img class="w-6 mr-2" src="https://app.tor.us/v1.13.2/img/login-google.aca78493.svg" alt="" />Continue with Google</Button
              >
            </div>
            <div class="col-span-1">
              <Button variant="tertiary" icon block @click="onLogin('facebook')">
                <img class="w-6" src="https://app.tor.us/v1.13.2/img/login-facebook.14920ebc.svg" alt="" />
              </Button>
            </div>
            <div class="col-span-1">
              <Button variant="tertiary" icon block @click="onLogin('twitter')">
                <img class="w-6" src="https://app.tor.us/v1.13.2/img/login-twitter.9caed22d.svg" alt="" />
              </Button>
            </div>
            <div class="col-span-1">
              <Button variant="tertiary" icon block @click="onLogin('discord')">
                <img class="w-6" src="https://app.tor.us/v1.13.2/img/login-discord.8a29d113.svg" alt="" />
              </Button>
            </div>
          </div>
          <div class="mt-3 relative w-10/12">
            <div class="absolute inset-0 flex items-center" aria-hidden="true">
              <div class="w-full border-t border-app-text-400" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-gray-100 text-app-text-500">or</span>
            </div>
          </div>
          <div class="mt-3 w-10/12">
            <form @submit.prevent="onLogin">
              <TextField v-model="email" class="mb-3" placeholder="Enter your email" />
              <Button variant="tertiary" block type="submit">Continue with Email</Button>
            </form>
          </div>
          <div class="mt-8 mb-2 w-10/12">
            <div class="font-body text-xs text-app-text-600 font-bold mb-2">Note:</div>
            <div class="font-body text-xs text-app-text-400 font-light mb-2">Torus does not store any data related to your social logins.</div>
            <div class="font-body text-xs text-app-text-400 font-light">
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
        <div class="col-span-6 col-start-2 w-full mx-auto text-center">
          <img src="https://app.tor.us/v1.13.2/img/login-bg-1.4fa6ad65.svg" alt="" />
          <div class="font-header text-xl text-app-text-500 mb-2">Interact with thousands of apps on the blockchain</div>
          <div class="font-body text-base text-app-text-500">From Finance, Games, Exchanges and more</div>
          <div class="font-body text-base text-app-text-500">Access the decentralised world with Torus</div>

          <Button size="small" variant="tertiary" class="mx-auto mt-5">Visit our website</Button>
        </div>
      </div>
    </div>
  </div>
</template>

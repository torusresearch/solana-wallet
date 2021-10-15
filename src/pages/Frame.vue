<script setup lang="ts">
import { LOGIN_PROVIDER_TYPE } from "@toruslabs/openlogin";
import { SUPPORTED_NETWORKS } from "@toruslabs/solana-controllers";
import log from "loglevel";
import { computed, onMounted, reactive, ref } from "vue";

import { BUTTON_POSITION, EmbedInitParams } from "@/utils/enums";
import { isMain, promiseCreator } from "@/utils/helpers";

import { Button } from "../components/common";
import ControllerModule from "../modules/controllers";

const { resolve, promise } = promiseCreator<void>();

let dappOrigin = window.location.ancestorOrigins[0] || "";
const initParams = reactive<EmbedInitParams>({
  buttonPosition: BUTTON_POSITION.BOTTOM_LEFT,
  torusWidgetVisibility: true,
  apiKey: "torus-default",
  network: SUPPORTED_NETWORKS.testnet,
});

const hashParams = new URLSearchParams(window.location.hash.slice(1));
const specifiedOrigin = hashParams.get("origin");
function startLogin() {
  try {
    const handleMessage = (ev: MessageEvent) => {
      const { origin, data } = ev;
      if (origin === specifiedOrigin) {
        window.removeEventListener("message", handleMessage);
        // Add torus controller origin setup
        if (!dappOrigin) {
          dappOrigin = origin;
        }
        const { buttonPosition, torusWidgetVisibility, apiKey, network } = data;
        initParams.buttonPosition = buttonPosition;
        initParams.torusWidgetVisibility = torusWidgetVisibility;
        initParams.apiKey = apiKey;
        initParams.network = network;

        if (resolve) resolve();
      }
    };
    window.addEventListener("message", handleMessage);
  } catch (error) {
    log.error(error);
  }
}

startLogin();
const isLoading = ref<boolean>(false);
const isLoginInProgress = computed(() => ControllerModule.torusState.EmbedControllerState.loginInProgress);
const oauthModalVisibility = computed(() => ControllerModule.torusState.EmbedControllerState.oauthModalVisibility);
const torusWidgetVisibility = computed(() => ControllerModule.torusState.EmbedControllerState.torusWidgetVisibility);

log.info("state of frame", isLoginInProgress, oauthModalVisibility, torusWidgetVisibility);

onMounted(async () => {
  if (!isMain) {
    await promise;
    ControllerModule.init({
      EmbedControllerState: {
        buttonPosition: initParams.buttonPosition,
        torusWidgetVisibility: initParams.torusWidgetVisibility,
        apiKey: initParams.apiKey,
        oauthModalVisibility: false,
        loginInProgress: false,
      },
      ...(initParams.network && {
        NetworkControllerState: {
          chainId: initParams.network.chainId,
          properties: {},
          providerConfig: initParams.network,
        },
      }),
    });
    ControllerModule.setupCommunication(dappOrigin);
  }
});

const onLogin = async (loginProvider: LOGIN_PROVIDER_TYPE, userEmail?: string) => {
  try {
    await ControllerModule.triggerLogin({
      loginProvider,
      login_hint: userEmail,
    });
  } catch (error) {
    log.error(error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-[calc(50%+1rem)] bg-white dark:bg-app-gray-800 flex justify-center items-center"></div>
  <div v-if="oauthModalVisibility">
    <Button variant="tertiary" icon block @click="onLogin('twitter')">
      <img class="w-6" src="https://app.tor.us/v1.13.2/img/login-twitter.9caed22d.svg" alt="" />
    </Button>
    <Button variant="tertiary" icon block @click="onLogin('google')">
      <img class="w-6" src="https://app.tor.us/v1.13.2/img/login-twitter.9caed22d.svg" alt="" />
    </Button>
  </div>
  <div v-if="isLoginInProgress">
    <h2>Loading</h2>
  </div>
  <div v-if="torusWidgetVisibility">
    <h2>Widget</h2>
  </div>
</template>

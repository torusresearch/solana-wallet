<script setup lang="ts">
import { LOGIN_PROVIDER_TYPE } from "@toruslabs/openlogin";
import { SolanaTransactionActivity } from "@toruslabs/solana-controllers";
import log from "loglevel";
import { computed, onMounted } from "vue";

import { PopupLogin, PopupWidget } from "@/components/frame";
import { BUTTON_POSITION, EmbedInitParams } from "@/utils/enums";
import { isMain, promiseCreator } from "@/utils/helpers";

import ControllerModule from "../modules/controllers";
import { WALLET_SUPPORTED_NETWORKS } from "../utils/const";

const { resolve, promise } = promiseCreator<void>();
let dappOrigin = window.location.ancestorOrigins[0] || "";
const initParams = {
  buttonPosition: BUTTON_POSITION.BOTTOM_LEFT,
  isIFrameFullScreen: false,
  apiKey: "torus-default",
  network: WALLET_SUPPORTED_NETWORKS["testnet"],
  dappMetadata: {
    icon: "",
    name: "",
  },
} as EmbedInitParams;

const hashParams = new URLSearchParams(window.location.hash.slice(1));
const specifiedOrigin = hashParams.get("origin");
function startLogin() {
  try {
    const handleMessage = (ev: MessageEvent) => {
      const { origin, data } = ev;
      if (origin === specifiedOrigin) {
        window.removeEventListener("message", handleMessage);
        log.info("received info from origin", origin, data);
        // Add torus controller origin setup
        if (!dappOrigin) {
          dappOrigin = origin;
        }
        const { buttonPosition, apiKey, network, dappMetadata } = data;
        initParams.buttonPosition = buttonPosition;
        initParams.apiKey = apiKey;
        initParams.network = network;
        initParams.dappMetadata = dappMetadata;
        if (resolve) resolve();
      }
    };
    window.addEventListener("message", handleMessage);
  } catch (error) {
    log.error(error);
  }
}
startLogin();
const isLoggedIn = computed(() => ControllerModule.torusState.PreferencesControllerState.selectedAddress !== "");
const isLoginInProgress = computed(() => ControllerModule.torusState.EmbedControllerState.loginInProgress);
const oauthModalVisibility = computed(() => ControllerModule.torusState.EmbedControllerState.oauthModalVisibility);
const isIFrameFullScreen = computed(() => ControllerModule.torusState.EmbedControllerState.isIFrameFullScreen);
const allTransactions = computed(() => ControllerModule.selectedNetworkTransactions);
const lastTransaction = computed(() => {
  const txns = allTransactions.value;
  // txns.sort((x, y) => {
  //   const xTime = new Date(x.updated_at).getTime();
  //   const yTime = new Date(y.updated_at).getTime();
  //   return yTime - xTime;
  // });
  // return txns.length > 0 ? txns[0] : ({} as SolanaTransactionActivity);
  return txns[0] as SolanaTransactionActivity;
});
// const toggleIframeFullScreen = () => {
//   ControllerModule.toggleIframeFullScreen();
// };
onMounted(async () => {
  if (!isMain) {
    await promise;
    log.info("initializing controllers with origin", dappOrigin);
    ControllerModule.init({
      state: {
        EmbedControllerState: {
          buttonPosition: initParams.buttonPosition,
          isIFrameFullScreen: initParams.isIFrameFullScreen,
          apiKey: initParams.apiKey,
          oauthModalVisibility: false,
          loginInProgress: false,
          dappMetadata: initParams.dappMetadata,
        },
        ...(initParams.network && {
          NetworkControllerState: {
            chainId: initParams.network.chainId,
            properties: {},
            providerConfig: initParams.network,
          },
        }),
      },
      origin: dappOrigin,
    });
    ControllerModule.setupCommunication(dappOrigin);
  }
});
const onLogin = async (loginProvider: LOGIN_PROVIDER_TYPE, userEmail?: string) => {
  try {
    ControllerModule.torus.hideOAuthModal();
    await ControllerModule.triggerLogin({
      loginProvider,
      login_hint: userEmail,
    });
  } catch (error) {
    log.error(error);
  }
};
const cancelLogin = (): void => {
  log.info("cancelLogin");
  ControllerModule.torus.emit("LOGIN_RESPONSE", "User cancelled login");
};
const loginFromWidget = () => {
  ControllerModule.torus.loginFromWidgetButton();
};
const closePanel = () => {
  ControllerModule.closeIframeFullScreen();
};
</script>

<template>
  <div class="min-h-screen flex justify-center ite1ms-center">
    <PopupLogin :is-open="oauthModalVisibility && !isLoggedIn" @onClose="cancelLogin" @on-login="onLogin" />
    <PopupWidget
      :last-transaction="lastTransaction"
      :is-iframe-full-screen="isIFrameFullScreen"
      :is-logged-in="isLoggedIn"
      :button-position="initParams.buttonPosition"
      :is-login-in-progress="isLoginInProgress"
      @show-login-modal="loginFromWidget"
      @toggle-panel="ControllerModule.toggleIframeFullScreen"
      @close-panel="closePanel"
    />
  </div>
</template>

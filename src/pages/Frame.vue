<script setup lang="ts">
import { LOGIN_PROVIDER_TYPE } from "@toruslabs/openlogin";
import { SolanaTransactionActivity } from "@toruslabs/solana-controllers";
import log from "loglevel";
import { computed, onMounted, ref, watch } from "vue";

import { PopupLogin, PopupWidget } from "@/components/frame";
import { i18n, setLocale } from "@/plugins/i18nPlugin";
import { BUTTON_POSITION, EmbedInitParams } from "@/utils/enums";
import { hideCrispButton, isCrispClosed, isMain, promiseCreator, recordDapp } from "@/utils/helpers";
import { setWhiteLabel } from "@/utils/whitelabel";

import ControllerModule from "../modules/controllers";
import { WALLET_SUPPORTED_NETWORKS } from "../utils/const";

const { resolve, promise } = promiseCreator<void>();
let dappOrigin = window.location.ancestorOrigins ? window.location.ancestorOrigins[0] : "";

const initParams = {
  buttonPosition: BUTTON_POSITION.BOTTOM_LEFT,
  isIFrameFullScreen: false,
  apiKey: "torus-default",
  network: WALLET_SUPPORTED_NETWORKS.mainnet,
  isCustomNetwork: false,
  dappMetadata: {
    icon: "",
    name: "",
  },
  extraParams: {},
} as EmbedInitParams;

const showUI = ref(false);
const isLogin = ref(false);

const hashParams = new URLSearchParams(window.location.hash.slice(1));
const specifiedOrigin = hashParams.get("origin");

function startLogin() {
  try {
    const handleMessage = (ev: MessageEvent) => {
      const { origin, data } = ev;
      if (origin === specifiedOrigin) {
        recordDapp(origin);
        window.removeEventListener("message", handleMessage);
        log.info("received info from origin", origin, data);
        // Add torus controller origin setup
        if (!dappOrigin) {
          dappOrigin = origin;
        }
        const { buttonPosition, apiKey, network, dappMetadata, extraParams, whiteLabel } = data;
        setWhiteLabel(whiteLabel);
        setLocale(i18n, whiteLabel?.defaultLanguage || "en");
        if (typeof network === "string") {
          if (network === "mainnet-beta") initParams.network = WALLET_SUPPORTED_NETWORKS.mainnet;
          else if (network === "mainnet" || network === "testnet" || network === "devnet") initParams.network = WALLET_SUPPORTED_NETWORKS[network];
        } else {
          initParams.network = network;
          initParams.isCustomNetwork = true;
        }
        initParams.buttonPosition = buttonPosition;
        initParams.apiKey = apiKey;
        initParams.dappMetadata = dappMetadata;
        initParams.extraParams = extraParams;
        if (resolve) resolve();
      }
    };
    window.addEventListener("message", handleMessage);
  } catch (error) {
    log.error(error);
  }
}
startLogin();

const isLoggedIn = computed(() => ControllerModule.hasSelectedPrivateKey);
const isLoginInProgress = computed(() => ControllerModule.torus.embedLoginInProgress);
const oauthModalVisibility = computed(() => ControllerModule.torus.embedOauthModalVisibility);
const isIFrameFullScreen = computed(() => ControllerModule.torus.embedIsIFrameFullScreen);
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

watch(isIFrameFullScreen, () => {
  if (!isIFrameFullScreen.value && !isCrispClosed()) hideCrispButton();
});

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
            isCustomNetwork: initParams.isCustomNetwork,
            network: "loading",
          },
        }),
      },
      origin: dappOrigin,
    });

    ControllerModule.setupCommunication(dappOrigin);
    showUI.value = true;
    hideCrispButton();
  }
});
const onLogin = async (loginProvider: LOGIN_PROVIDER_TYPE, userEmail?: string) => {
  try {
    isLogin.value = true;
    ControllerModule.torus.hideOAuthModal();
    await ControllerModule.triggerLogin({
      loginProvider,
      login_hint: userEmail,
    });
    isLogin.value = false;
  } catch (error) {
    isLogin.value = false;
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
  <div class="min-h-screen flex justify-center items-center">
    <PopupLogin
      :is-open="oauthModalVisibility || !isLoggedIn || isLoginInProgress"
      :other-wallets="initParams.extraParams?.otherWallets"
      :is-login="isLogin"
      :is-login-in-progress="isLoginInProgress"
      @on-close="cancelLogin"
      @on-login="onLogin"
    />
    <PopupWidget
      :last-transaction="lastTransaction"
      :is-iframe-full-screen="isIFrameFullScreen"
      :is-logged-in="isLoggedIn"
      :button-position="initParams.buttonPosition"
      :is-login-in-progress="isLoginInProgress"
      @show-login-modal="loginFromWidget"
      @toggle-panel="ControllerModule.toggleIframeFullScreen"
      @close-panel="closePanel"
      @show-wallet="ControllerModule.openWalletPopup"
    />
  </div>
</template>

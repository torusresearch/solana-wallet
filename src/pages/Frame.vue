<script setup lang="ts">
// import { LOGIN_PROVIDER_TYPE } from "@toruslabs/openlogin";
import { LOGIN_PROVIDER_TYPE } from "@toruslabs/openlogin-utils";
import { SolanaTransactionActivity } from "@toruslabs/solana-controllers";
import log from "loglevel";
import { computed, onMounted, ref, watch } from "vue";

import OpenLoginHandler from "@/auth/OpenLoginHandler";
import { PopupLoader, PopupLogin, PopupWidget } from "@/components/frame";
import { i18n, setLocale } from "@/plugins/i18nPlugin";
import { BUTTON_POSITION, EmbedInitParams } from "@/utils/enums";
import { hideCrispButton, isCrispClosed, isMain, promiseCreator, recordDapp } from "@/utils/helpers";
import { setWhiteLabel } from "@/utils/whitelabel";

import ControllerModule, { torus } from "../modules/controllers";
import { WALLET_SUPPORTED_NETWORKS } from "../utils/const";

const { resolve, promise } = promiseCreator<void>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).$crisp.push(["do", "chat:hide"]);
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
const isEmbedLoginInProgress = computed(() => ControllerModule.torusState.EmbedControllerState.loginInProgress);
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

    const openloginInstance = await OpenLoginHandler.getInstance(true);
    if (openloginInstance.privKey) {
      const address = await torus.addAccount(
        openloginInstance.privKey,
        {
          email: "",
          name: "",
          profileImage: "",
          ...openloginInstance.getUserInfo(),
        },
        true
      );
      torus.setSelectedAccount(address);
    }

    ControllerModule.setupCommunication(dappOrigin);
    showUI.value = true;
    hideCrispButton();
  }
});
const onLogin = async (loginProvider: LOGIN_PROVIDER_TYPE, userEmail?: string) => {
  try {
    torus.embededOAuthLoginInProgress();
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
  torus.emit("LOGIN_RESPONSE", "User cancelled login");
};
const loginFromWidget = () => {
  torus.loginFromWidgetButton();
};
const closePanel = () => {
  ControllerModule.closeIframeFullScreen();
};
</script>

<template>
  <div class="min-h-screen flex justify-center items-center">
    <PopupLoader v-if="isEmbedLoginInProgress" />
    <PopupLogin :is-open="oauthModalVisibility" :other-wallets="initParams.extraParams?.otherWallets" @on-close="cancelLogin" @on-login="onLogin" />
    <!-- remove the isEmbedLoginInProgress in v-if, if want to show loading button on the bottom left -->
    <PopupWidget
      v-if="!oauthModalVisibility && !isEmbedLoginInProgress"
      :last-transaction="lastTransaction"
      :is-iframe-full-screen="isIFrameFullScreen"
      :is-logged-in="isLoggedIn"
      :button-position="initParams.buttonPosition"
      :is-login-in-progress="isEmbedLoginInProgress"
      @show-login-modal="loginFromWidget"
      @toggle-panel="ControllerModule.toggleIframeFullScreen"
      @close-panel="closePanel"
      @show-wallet="ControllerModule.openWalletPopup"
    />
  </div>
</template>

<script setup lang="ts">
import { Keypair } from "@solana/web3.js";
import { PopupData } from "@toruslabs/base-controllers";
import { BroadcastChannel } from "@toruslabs/broadcast-channel";
import { get } from "@toruslabs/http-helpers";
import { getED25519Key } from "@toruslabs/openlogin-ed25519";
import { subkey } from "@toruslabs/openlogin-subkey";
import { OpenloginUserInfo, safeatob } from "@toruslabs/openlogin-utils";
import { Button, Loader } from "@toruslabs/vue-components/common";
import base58 from "bs58";
import log from "loglevel";
import { onErrorCaptured, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

import config from "@/config";
import { generateTorusAuthHeaders, openCrispChat } from "@/utils/helpers";

import OpenLoginFactory from "../auth/OpenLogin";
import { APPLE, OpenLoginPopupResponse, ProjectAccountType } from "../utils/enums";

const { t } = useI18n();

const loading = ref(true);
const selectedAccountIndex = ref(0);
const accountsProps = ref<ProjectAccountType[]>([]);
const accounts: ProjectAccountType[] = [];
let channel: string;
let userInfo: OpenloginUserInfo;
let sessionId: string;

const selectAccount = (index: number) => {
  selectedAccountIndex.value = index;
};

const continueToApp = async (selectedIndex: number) => {
  loading.value = true;
  try {
    // move selected key to the first position of keys
    const id = selectedIndex;
    if (id > -1) {
      const selectedAccount = accounts[id];
      accounts.splice(id, 1);
      accounts.unshift(selectedAccount);
    }

    log.info(accounts);
    const bc = new BroadcastChannel(channel, { webWorkerSupport: false });
    await bc.postMessage({
      data: {
        userInfo,
        privKey: accounts[0].privKey,
        accounts,
        sessionId,
      },
    } as PopupData<OpenLoginPopupResponse>);
  } catch (error) {
    log.error(error, "something went wrong");
  }
  // expecting popup closed
  // loading.value = false;
};

onErrorCaptured(() => {
  openCrispChat();
});

async function endLogin() {
  try {
    const { hash } = useRoute();
    const hashParams = new URLSearchParams(hash.slice(1));
    const error = hashParams.get("error");

    if (error) {
      throw new Error(error);
    }

    const openLoginInstance = await OpenLoginFactory.getInstance();

    const openLoginState = openLoginInstance.state;
    const { tKey, oAuthPrivateKey, ed25519PrivKey } = openLoginState;

    if (!ed25519PrivKey) {
      throw new Error("Login unsuccessful");
    }

    userInfo = openLoginInstance.getUserInfo();
    sessionId = openLoginInstance.sessionId;

    const openLoginStore = openLoginState.userInfo;
    if (!openLoginStore?.appState) {
      throw new Error("Login unsuccessful");
    }
    const appState = JSON.parse(safeatob(decodeURIComponent(decodeURIComponent(openLoginStore.appState as string))));
    const { instanceId } = appState;
    channel = instanceId;

    // Main wallet's Accoun
    // const { sk: secretKey } = getED25519Key(privKey.padStart(64, "0"));
    const secretKey = Buffer.from(ed25519PrivKey!, "hex");

    const typeOfLoginDisplay = userInfo.typeOfLogin.charAt(0).toUpperCase() + userInfo.typeOfLogin.slice(1);
    const accountDisplay = (userInfo.typeOfLogin !== APPLE && userInfo.email) || userInfo.name;
    const mainKeyPair = Keypair.fromSecretKey(secretKey);
    accounts.push({
      app: `${typeOfLoginDisplay} ${accountDisplay}`,
      solanaPrivKey: base58.encode(mainKeyPair.secretKey),
      privKey: ed25519PrivKey,
      name: `Solana Wallet ${window.location.origin}`,
      address: `${mainKeyPair.publicKey.toBase58()}`,
    });

    // derive app scoped keys from tkey
    const userDapps: Record<string, string> = {};

    let matchedDappHost = -1;
    const dappOrigin = sessionStorage.getItem("dappOrigin") || window.location.origin;
    const dappHost = new URL(dappOrigin || "");

    if (tKey && oAuthPrivateKey) {
      try {
        // projects are stored on oAuthPrivateKey but subkey is derived from tkey

        const headers = generateTorusAuthHeaders(oAuthPrivateKey);
        log.info(headers, "headers");
        const response = await get<{ user_projects: [{ last_login: string; project_id: string; hostname: string; name: string }] }>(
          `${config.developerDashboardUrl}/projects/user-projects?chain_namespace=solana`,
          {
            headers,
          }
        );
        log.info(response, "User projects from developer dashboard");
        const userProjects = response.user_projects ?? [];
        userProjects.sort((a, b) => (a.last_login < b.last_login ? 1 : -1));
        userProjects.forEach((project, idx) => {
          const subKey = subkey(tKey, Buffer.from(project.project_id, "base64"));
          const paddedSubKey = subKey.padStart(64, "0");
          const { sk } = getED25519Key(paddedSubKey);
          const keyPair = Keypair.fromSecretKey(sk);
          userDapps[keyPair.publicKey.toBase58()] = `${project.name} (${project.hostname})`;
          accounts.push({
            app: `${project.name}`,
            solanaPrivKey: base58.encode(keyPair.secretKey),
            privKey: paddedSubKey,
            name: `${project.name} (${project.hostname})`,
            address: keyPair.publicKey.toBase58(),
          });

          if (dappHost.host === project.hostname) matchedDappHost = idx + 1;
        });
      } catch (error2: unknown) {
        log.error("Failed to derive app-scoped keys", error2);
      }
    }

    if (matchedDappHost >= 0) {
      continueToApp(matchedDappHost);
    }

    if (accounts.length <= 1) {
      continueToApp(0);
      return;
    }

    accountsProps.value = accounts;
    loading.value = false;
  } catch (error) {
    // TODO: Display error to user and show crisp chat
    log.error(error);
    openCrispChat();
  }
}

endLogin();
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-app-gray-800 flex justify-center items-center">
    <Loader v-if="loading" :use-spinner="true" />
    <div v-else class="account_container">
      <div class="text-xl text-app-text-600 dark:text-app-text-dark-400 font-bold mb-8 text-center">{{ t("login.selectAnAccount") }}</div>
      <div class="flex flex-col items-center">
        <div class="account-list overflow-y-scroll no-scrollbar break-all">
          <button
            v-for="({ app, address }, index) in accountsProps"
            :key="address"
            type="button"
            :value="index"
            class="flex flex-col overflow-hidden w-full mt-1 mb-1 hover:border-cyan-100 text-app-primary-500"
            @click="() => selectAccount(index)"
          >
            <div
              class="flex flex-col account-item-checkbox w-full overflow-hidden"
              :class="[
                selectedAccountIndex === index
                  ? 'bg-white dark:bg-app-gray-600 border-2 border-cyan-300 dark:border-gray-600'
                  : 'bg-white dark:bg-app-gray-700 hover:border-cyan-600 border border-app-gray-500 dark:border-transparent shadow dark:shadow-dark',
              ]"
            >
              <div class="account-app font-bold text-app-text-600 dark:text-app-text-dark-500">{{ app }}</div>
              <div class="account-address text_2--text text-app-text-600 dark:text-app-text-dark-500">{{ address }}</div>
            </div>
          </button>
        </div>
      </div>
      <Button
        id="less-details-link"
        large
        color="white"
        text
        class="px-8 mt-8 w-full white--text gmt-wallet-transfer"
        @click="() => continueToApp(selectedAccountIndex)"
      >
        {{ t("login.continueToApp") }}
      </Button>
    </div>
  </div>
</template>

<style>
.account_container {
  width: 480px;
  max-width: 90%;
}

.account-list {
  width: 100%;
  max-height: 300px;
  /* overflow-y: auto; */
  margin: auto;
  /* padding: 0 10px; */
}

.account-item-checkbox {
  justify-content: center;
  padding: 10px 20px;
  border-radius: 6px;
}

.account-app {
  font-size: 14px;
}

.account-address {
  font-size: 12px;
}
</style>

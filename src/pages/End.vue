<script setup lang="ts">
import { Keypair } from "@solana/web3.js";
import { broadcastChannelOptions, PopupData } from "@toruslabs/base-controllers";
import { BroadcastChannel } from "@toruslabs/broadcast-channel";
import { get } from "@toruslabs/http-helpers";
import { OpenloginUserInfo } from "@toruslabs/openlogin";
import { getED25519Key } from "@toruslabs/openlogin-ed25519";
import { subkey } from "@toruslabs/openlogin-subkey";
import { safeatob } from "@toruslabs/openlogin-utils";
import Button from "@toruslabs/vue-components/common/Button.vue";
import base58 from "bs58";
import log from "loglevel";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";

import { BoxLoader } from "@/components/common";
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

const selectAccount = (index: number) => {
  selectedAccountIndex.value = index;
};

const continueToApp = async () => {
  loading.value = true;
  try {
    // move selected key to the first position of keys
    const id = selectedAccountIndex.value;
    if (id > -1) {
      const selectedAccount = accounts[id];
      accounts.splice(id, 1);
      accounts.unshift(selectedAccount);
    }

    log.info(accounts);
    const bc = new BroadcastChannel(channel, broadcastChannelOptions);
    await bc.postMessage({
      data: {
        userInfo,
        privKey: accounts[0].privKey,
        accounts,
      },
    } as PopupData<OpenLoginPopupResponse>);
  } catch (error) {
    log.error(error, "something went wrong");
  }
  loading.value = false;
};

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
    const { privKey, tKey, oAuthPrivateKey } = openLoginState;

    if (!privKey) {
      throw new Error("Login unsuccessful");
    }

    userInfo = await openLoginInstance.getUserInfo();
    const openLoginStore = openLoginState.store.getStore();
    if (!openLoginStore.appState) {
      throw new Error("Login unsuccessful");
    }
    const appState = JSON.parse(safeatob(decodeURIComponent(decodeURIComponent(openLoginStore.appState as string))));
    const { instanceId } = appState;
    channel = instanceId;

    // Main wallet's Account
    const { sk: secretKey } = getED25519Key(privKey.padStart(64, "0"));
    const typeOfLoginDisplay = userInfo.typeOfLogin.charAt(0).toUpperCase() + userInfo.typeOfLogin.slice(1);
    const accountDisplay = (userInfo.typeOfLogin !== APPLE && userInfo.email) || userInfo.name;
    const mainKeyPair = Keypair.fromSecretKey(secretKey);
    accounts.push({
      app: `${typeOfLoginDisplay} ${accountDisplay}`,
      solanaPrivKey: base58.encode(mainKeyPair.secretKey),
      privKey,
      name: `Solana Wallet ${window.location.origin}`,
      address: `${mainKeyPair.publicKey.toBase58()}`,
    });

    // derive app scoped keys from tkey
    const userDapps: Record<string, string> = {};
    // const keys: { privKey: string; name: string; address: string }[] = [];

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
        userProjects.forEach((project) => {
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
        });
      } catch (error2: unknown) {
        log.error("Failed to derive app-scoped keys", error2);
      }
    }

    if (accounts.length <= 1) continueToApp();

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
    <BoxLoader v-if="loading" />
    <div v-else>
      <div class="text-xl text-app-text-dark-400 font-bold mb-8 text-center">{{ t("login.selectAnAccount") }}</div>
      <div>
        <div class="account-list overflow-y-scroll no-scrollbar">
          <button
            v-for="({ app, address }, index) in accountsProps"
            :key="address"
            :value="index"
            class="flex flex-col overflow-hidden w-full mt-1 mb-1 hover:border-cyan-100"
            @click="() => selectAccount(index)"
          >
            <div
              class="flex flex-col account-item-checkbox w-full overflow-hidden"
              :class="[selectedAccountIndex === index ? 'bg-app-gray-600 border-cyan-50' : 'bg-app-gray-700 ']"
            >
              <div class="account-app font-weight-bold text-app-text-dark-400">{{ app }}</div>
              <div class="account-address text_2--text text-app-text-dark-400">{{ address }}</div>
            </div>
          </button>
        </div>
      </div>
      <Button id="less-details-link" large color="white" text class="px-8 mt-8 w-full white--text gmt-wallet-transfer" @click="continueToApp">
        {{ t("login.continueToApp") }}
      </Button>
    </div>
  </div>
</template>

<style>
.account-list {
  width: 420px;
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

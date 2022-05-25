<script setup lang="ts">
import { Keypair } from "@solana/web3.js";
import { broadcastChannelOptions, PopupData } from "@toruslabs/base-controllers";
import { BroadcastChannel } from "@toruslabs/broadcast-channel";
import { get } from "@toruslabs/http-helpers";
import { getED25519Key } from "@toruslabs/openlogin-ed25519";
import { subkey } from "@toruslabs/openlogin-subkey";
import { safeatob } from "@toruslabs/openlogin-utils";
import log from "loglevel";
import { useRoute } from "vue-router";

import { BoxLoader } from "@/components/common";
import config from "@/config";
import { generateTorusAuthHeaders } from "@/utils/helpers";

import OpenLoginFactory from "../auth/OpenLogin";
import type { OpenLoginPopupResponse } from "../utils/enums";

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
    const userInfo = await openLoginInstance.getUserInfo();
    const openLoginStore = openLoginState.store.getStore();
    if (!openLoginStore.appState) {
      throw new Error("Login unsuccessful");
    }
    const appState = JSON.parse(safeatob(decodeURIComponent(decodeURIComponent(openLoginStore.appState as string))));
    const { instanceId } = appState;

    // derive app scoped keys from tkey
    const userDapps: Record<string, string> = {};
    const keys: { privKey: string; name: string; address: string }[] = [];
    if (tKey && oAuthPrivateKey) {
      try {
        // projects are stored on oAuthPrivateKey but subkey is derived from tkey

        const headers = generateTorusAuthHeaders(oAuthPrivateKey);
        log.info(headers, "headers");
        const response = await get<{ user_projects: [{ last_login: string; project_id: string; hostname: string; name: string }] }>(
          `${config.developerDashboardUrl}/projects/user-projects?chain_namespace=evm`,
          {
            headers,
          }
        );
        log.info(response, "User projects from developer dashboard");
        const userProjects = response.user_projects ?? [];
        userProjects.sort((a, b) => (a.last_login < b.last_login ? 1 : -1));
        userProjects.forEach((project) => {
          const subKey = subkey(tKey, Buffer.from(project.project_id, "base64"));
          const { sk } = getED25519Key(subKey);
          const keyPair = Keypair.fromSecretKey(sk);
          userDapps[keyPair.publicKey.toBase58()] = `${project.name} (${project.hostname})`;
          keys.push({
            privKey: Buffer.from(keyPair.secretKey).toString("hex"),
            name: `${project.name} (${project.hostname})`,
            address: keyPair.publicKey.toBase58(),
          });
        });
      } catch (error2: unknown) {
        log.error("Failed to derive app-scoped keys", error2);
      }
    }

    const bc = new BroadcastChannel(instanceId, broadcastChannelOptions);
    await bc.postMessage({
      data: {
        userInfo,
        privKey,
        keys,
      },
    } as PopupData<OpenLoginPopupResponse>);
  } catch (error) {
    log.error(error);
    // TODO: Display error to user and show crisp chat
  }
}

endLogin();
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-app-gray-800 flex justify-center items-center">
    <BoxLoader />
  </div>
</template>

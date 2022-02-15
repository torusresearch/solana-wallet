<script setup lang="ts">
import { broadcastChannelOptions, PopupData } from "@toruslabs/base-controllers";
import { safeatob } from "@toruslabs/openlogin-utils";
import { BroadcastChannel } from "broadcast-channel";
import log from "loglevel";
import { useRoute } from "vue-router";

import { BoxLoader } from "@/components/common";

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
    const { privKey } = openLoginState;

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
    try {
      const bc = new BroadcastChannel(instanceId, broadcastChannelOptions);
      await bc.postMessage({
        data: {
          userInfo,
          privKey,
        },
      } as PopupData<OpenLoginPopupResponse>);
    } catch (e) {
      window.opener.postMessage(
        {
          target: "login",
          data: {
            userInfo,
            privKey,
          },
        },
        window.origin
      );
      setTimeout(window.close, 1000);
    }
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

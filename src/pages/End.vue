<script setup lang="ts">
import { broadcastChannelOptions, PopupData } from "@toruslabs/base-controllers";
import { safeatob } from "@toruslabs/openlogin-utils";
import { BroadcastChannel } from "broadcast-channel";
import log from "loglevel";
import { useRoute } from "vue-router";

import { OpenLoginPopupResponse } from "@/utils/enums";

import OpenLoginFactory from "../auth/OpenLogin";

async function endLogin() {
  try {
    const hash = useRoute().hash;
    const hashParams = new URLSearchParams(hash.slice(1));
    const error = hashParams.get("error");

    if (error) {
      throw new Error(error);
    }

    const openLoginInstance = await OpenLoginFactory.getInstance();
    const openLoginState = openLoginInstance.state;
    const privKey = openLoginState.privKey;

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

    const bc = new BroadcastChannel(instanceId, broadcastChannelOptions);
    await bc.postMessage({
      data: {
        userInfo,
        privKey,
      },
    } as PopupData<OpenLoginPopupResponse>);
  } catch (error) {
    log.error(error);
    // TODO: Display error to user and show crisp chat
  }
}

endLogin();
</script>

<script setup lang="ts">
import { Loader } from "@toruslabs/vue-components/common";
import log from "loglevel";
import { onErrorCaptured } from "vue";
import { useRoute } from "vue-router";

import { openCrispChat } from "@/utils/helpers";

import OpenLoginFactory from "../auth/OpenLogin";

onErrorCaptured(() => {
  openCrispChat();
});
async function startLogin() {
  try {
    const { query } = useRoute();
    const { loginProvider, state, ...rest } = query;
    if (!loginProvider) throw new Error("Invalid Login Provider");
    const openLoginInstance = await OpenLoginFactory.getInstance();
    await openLoginInstance.login({
      loginProvider: loginProvider as string,
      appState: state as string,
      extraLoginOptions: rest,
      relogin: true,
    });
  } catch (error) {
    log.error(error);
    openCrispChat();
  }
}

startLogin();
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-app-gray-800 flex flex-col justify-center items-center">
    <Loader :use-spinner="true" />
  </div>
</template>

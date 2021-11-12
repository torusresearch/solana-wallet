<script setup lang="ts">
import log from "loglevel";
import { useRoute } from "vue-router";

import { BoxLoader } from "@/components/common";

import OpenLoginFactory from "../auth/OpenLogin";

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
  }
}

startLogin();
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-app-gray-800 flex justify-center items-center">
    <BoxLoader />
  </div>
</template>

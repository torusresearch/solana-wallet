<script setup lang="ts">
import { DiscoverDapp } from "@toruslabs/base-controllers";
// import log from "loglevel";
import { computed } from "vue";

const props = defineProps<{
  dapp: DiscoverDapp;
}>();

const logo = computed(() => props.dapp?.logo?.[0].url || "");

// const dappUrl =
//   window.location.origin === ControllerModule.torus.origin ? props.dapp.url : props.dapp.url.concat("?dappLink=", ControllerModule.torus.origin);

const onDappClick = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const instanceId = searchParams.get("instanceId") || "";
  const dappOriginURL = sessionStorage.getItem(instanceId);

  if (dappOriginURL) {
    const dappUrl = new URL(props.dapp.url);
    localStorage.setItem(`dappOriginURL-${dappUrl.origin}`, dappOriginURL);
  }
};
</script>
<template>
  <a
    :href="dapp.url"
    class="flex bg-white hover:bg-app-gray-200 dark:bg-app-gray-700 border border-app-gray-200 dark:border-transparent shadow dark:shadow-dark rounded-lg p-4"
    rel="noreferrer noopener"
    @click="onDappClick"
  >
    <img class="w-12 h-12" :src="logo" alt="Dapp Logo" />
    <div class="pl-2 -mt-1 overflow-x-hidden">
      <p class="text-sm text-app-text-600 dark:text-app-text-dark-500 font-bold">{{ dapp.title }}</p>
      <p class="text-xs text-app-text-400 dark:text-app-text-dark-700">{{ dapp.category }}</p>
      <p class="text-xs text-app-gray-600 text-ellipsis whitespace-nowrap">{{ dapp.desc }}</p>
    </div>
  </a>
</template>

<style scoped></style>

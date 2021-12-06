<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";

import WalletTabs from "@/components/WalletTabs.vue";
import ControllersModule from "@/modules/controllers";

const router = useRouter();
const selectedTab = ref<string>(`${router.currentRoute.value.meta.tab}` || "home");
let logoutTimeout: unknown;
onMounted(() => {
  logoutTimeout = ControllersModule.initJWTCheck();
  router.beforeResolve((to, from, next) => {
    selectedTab.value = `${to.meta.tab}`;
    next();
  });
});
onUnmounted(() => {
  clearTimeout(logoutTimeout as number);
});
</script>
<template>
  <WalletTabs :tab="selectedTab">
    <router-view></router-view>
  </WalletTabs>
</template>

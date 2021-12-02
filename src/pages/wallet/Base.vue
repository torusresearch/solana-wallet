<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import WalletTabs from "@/components/WalletTabs.vue";

const router = useRouter();
const selectedTab = ref<string>(`${router.currentRoute.value.meta.tab}` || "home");
onMounted(() => {
  router.beforeResolve((to, from, next) => {
    selectedTab.value = `${to.meta.tab}`;
    next();
  });
});
</script>
<template>
  <WalletTabs :tab="selectedTab">
    <router-view></router-view>
  </WalletTabs>
</template>

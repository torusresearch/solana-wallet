<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import WalletTabs from "@/components/WalletTabs.vue";

const router = useRouter();
const showRouterChild = ref(false);
const selectedTab = ref<string>(`${router.currentRoute.value.meta.tab}` || "home");
const shouldShowHeader = ref<boolean>(`${router.currentRoute.value.meta.tabHeader}` !== "false");
onMounted(() => {
  router.beforeResolve((to, from, next) => {
    selectedTab.value = `${to.meta.tab}`;
    shouldShowHeader.value = `${to.meta.tabHeader}` !== "false";
    next();
  });
  // to queue the render of Router-view just after Base.vue mounting is complete, so that Teleports can function properly
  setTimeout(() => {
    showRouterChild.value = true;
  });
});
</script>
<template>
  <WalletTabs :tab="selectedTab" :show-header="shouldShowHeader">
    <router-view v-if="showRouterChild"></router-view>
  </WalletTabs>
</template>

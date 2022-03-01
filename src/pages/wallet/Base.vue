<script setup lang="ts">
import * as Sentry from "@sentry/vue";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import WalletTabs from "@/components/WalletTabs.vue";
import ControllerModule from "@/modules/controllers";
import { NAVIGATION_LIST } from "@/utils/enums";

const router = useRouter();
const showRouterChild = ref(false);
const selectedTab = ref<keyof typeof NAVIGATION_LIST>((`${router.currentRoute.value.meta.tab}` as keyof typeof NAVIGATION_LIST) || "home");
const shouldShowHeader = ref<boolean>(`${router.currentRoute.value.meta.tabHeader}` !== "false");
onMounted(() => {
  router.beforeResolve((to, from, next) => {
    selectedTab.value = `${to.meta.tab}` as keyof typeof NAVIGATION_LIST;
    shouldShowHeader.value = `${to.meta.tabHeader}` !== "false";
    next();
  });
  // to queue the render of Router-view just after Base.vue mounting is complete, so that Teleports can function properly
  setTimeout(() => {
    showRouterChild.value = true;
  });
  Sentry.setUser({ email: ControllerModule.torus?.userInfo?.email || ControllerModule.torus?.selectedAddress || "unknown" });
});
</script>
<template>
  <WalletTabs :tab="selectedTab" :show-header="shouldShowHeader">
    <router-view v-if="showRouterChild"></router-view>
  </WalletTabs>
</template>

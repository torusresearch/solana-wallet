<script setup lang="ts">
import { DiscoverDapp } from "@toruslabs/base-controllers";
import log from "loglevel";
import { computed, onMounted, ref } from "vue";
import { VueI18nTranslation } from "vue-i18n";
import { useRoute } from "vue-router";

import { RoundLoader, SelectField } from "@/components/common";
import DappItem from "@/components/discover/DappItem.vue";
import ControllerModule from "@/modules/controllers";
import { i18n } from "@/plugins/i18nPlugin";

const t = i18n.global.t as VueI18nTranslation;

const ALL_CATEGORIES = {
  value: "All DApps",
  label: "All DApps",
};

const selectedCategory = ref(ALL_CATEGORIES);

const dapps = ref<DiscoverDapp[]>([]);
const redirectUrl = ref<URL>();
const loading = ref<boolean>(false);

onMounted(async () => {
  try {
    loading.value = true;
    const route = useRoute();
    if (route.query.url) {
      redirectUrl.value = new URL(route.query.url as string);
      if (redirectUrl.value) {
        const searchParams = new URLSearchParams(window.location.search);
        const instanceId = searchParams.get("instanceId") || "";
        const dappOriginURL = sessionStorage.getItem(instanceId);

        if (dappOriginURL) {
          const dappUrl = redirectUrl.value;
          localStorage.setItem(`dappOriginURL-${dappUrl.origin}`, dappOriginURL);
        }

        window.location.href = redirectUrl.value.href;
      }
    }
  } catch (error) {
    log.error(error);
  } finally {
    // Fetch dapps
    if (!redirectUrl.value) {
      const dappsList = await ControllerModule.getDappList();
      dapps.value = dappsList;
    }

    loading.value = false;
  }
});

const categoryList = computed(() => {
  return [
    ALL_CATEGORIES,
    ...new Set(
      dapps.value
        .reduce((categories, dapp) => {
          if (dapp?.category?.length) {
            const found = categories.find((category: { value: string; label: string }) => category.value === dapp.category);
            if (!found)
              categories.push({
                value: dapp.category,
                label: dapp.category,
              });
          }
          return categories;
        }, [])
        ?.sort()
    ),
  ];
});

const filteredDapps = computed(() => {
  const filtered =
    dapps.value.filter((dapp) => {
      return (
        (selectedCategory.value.value === ALL_CATEGORIES.value || selectedCategory.value.value === dapp.category) &&
        ControllerModule.torus.chainId === "0x1" &&
        dapp.network === "mainnet"
      );
    }) || [];
  return filtered;
});
</script>

<template>
  <div v-if="loading" class="pt-6 text-center">
    <RoundLoader class="w-10 h-10 mx-auto mb-4" color="border-white" />
    <div class="text-sm text-app-text-600 dark:text-app-text-dark-500">
      {{ redirectUrl ? t("walletDiscover.redirecting", { url: redirectUrl.href }) : t("walletDiscover.loading") }}
    </div>
  </div>
  <div v-else-if="filteredDapps.length === 0 && !redirectUrl" class="pt-6 text-center">
    <div class="text-sm text-app-text-600 dark:text-app-text-dark-500">{{ t("walletDiscover.noData") }}</div>
  </div>
  <div v-else class="pt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
    <DappItem v-for="dapp in filteredDapps" :key="dapp.url" :dapp="dapp" />
  </div>
  <Teleport to="#rightPanel">
    <div class="flex ml-auto w-fit">
      <span class="w-44">
        <SelectField v-model="selectedCategory" :items="categoryList" />
      </span>
    </div>
  </Teleport>
</template>
<style scoped></style>

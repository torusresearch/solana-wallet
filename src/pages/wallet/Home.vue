<script setup lang="ts">
import { defineAsyncComponent } from "vue";
import { useI18n } from "vue-i18n";

import SolanaMascot from "@/assets/solana-mascot.svg";
import { Button, Card } from "@/components/common";

const asyncWalletBalance = defineAsyncComponent({
  loader: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "WalletBalance" */ "@/components/WalletBalance.vue"),
  delay: 500,
  suspensible: false,
});

const asyncTokensAssetsBalance = defineAsyncComponent({
  loader: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "TokensAssetsBalance" */ "@/components/TokensAssetsBalance.vue"),
  delay: 500,
  suspensible: false,
});

const { t } = useI18n();
</script>

<template>
  <div class="py-2">
    <div class="mt-4 flex flex-row justify-around items-center lt-sm:flex-col lt-sm:justify-start lt-sm:items-center gt-sm:space-x-5 lt-sm:space-y-4">
      <asyncWalletBalance :show-buttons="true" class="w-full" />
      <Card :height="'164px'" class="w-full">
        <div class="flex">
          <div class="flex flex-col w-full h-full text-app-text-600 dark:text-app-text-dark-500">
            <div class="font-bold lt-sm:pr-2">Meet us at Singapore hacker house</div>
            <div class="text-xs">15th Feb - 20th Feb</div>
          </div>
          <img class="h-2/4 lt-sm:h-12 m-auto gt-sm:absolute top-1/4 right-6" alt="Solana Mascot" :src="SolanaMascot" />
        </div>

        <template #footer>
          <Button :block="false" variant="tertiary" class="w-7/12 lt-sm:w-full">{{ t("walletHome.moreInformation") }}</Button>
        </template>
        <template #right-content>
          <img class="h-2/4 lt-sm:h-12 m-auto" alt="Solana Mascot" :src="SolanaMascot" />
        </template>
      </Card>
    </div>
    <div>
      <asyncTokensAssetsBalance class="mt-10" />
    </div>
  </div>
</template>

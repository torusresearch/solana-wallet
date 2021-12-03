<script setup lang="ts">
import { defineAsyncComponent } from "vue";

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
</script>

<template>
  <div lass="py-2">
    <div class="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
      <asyncWalletBalance :show-buttons="true" />
      <Card :height="'164px'">
        <div class="grid grid-cols-3">
          <div class="col-span-2">
            <div class="font-body font-bold text-app-text-600 dark:text-app-text-dark-500">Join us for Solana breakpoint</div>
            <div class="font-body text-xs text-app-text-600 dark:text-app-text-dark-500">7 Nov 2021 @ Lisbon</div>
          </div>
          <div class="col-span-1 sol_logo">
            <img class="float-right h-2/4 lt-sm:h-16 sol_logo_image" alt="Solana Mascot" :src="SolanaMascot" />
          </div>
        </div>
        <template #footer>
          <div class="flex sm:grid grid-cols-2 gap-3 mt-3">
            <div class="w-full sm:w-auto">
              <Button :block="true" variant="tertiary">More information</Button>
            </div>
          </div>
        </template>
      </Card>
    </div>
    <div>
      <asyncTokensAssetsBalance class="mt-10" />
    </div>
  </div>
</template>

<style scoped>
.sol_logo {
  display: flex;
}

.sol_logo_image {
  margin: auto 23px auto auto;
}
</style>

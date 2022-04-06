<script setup lang="ts">
import { useRouter } from "vue-router";

import SplCard from "@/components/home/SplCard.vue";
import { tokens } from "@/components/transfer/token-helper";
import { HomePageInteractions, trackUserClick } from "@/directives/google-analytics";

const router = useRouter();

function transferToken(mint?: string) {
  trackUserClick(HomePageInteractions.SPL_TOKENS + (mint || ""));
  if (!mint) router.push("/wallet/transfer");
  else router.push(`/wallet/transfer?mint=${mint}`);
}
</script>

<template>
  <div class="flex flex-col">
    <div class="tab-info w-full overflow-x-hidden">
      <div class="flex flex-col space-y-4">
        <div v-for="token in tokens" :key="token?.tokenAddress?.toString()" class="w-full">
          <SplCard :spl-token="token" @spl-clicked="transferToken(token.mintAddress)"></SplCard>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tab-info {
  height: fit-content;
}
</style>

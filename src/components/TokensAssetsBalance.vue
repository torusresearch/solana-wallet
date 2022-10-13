<script setup lang="ts">
import { LoadingState } from "@toruslabs/solana-controllers";
import { computed } from "vue";
import { useRouter } from "vue-router";

import SplCard from "@/components/home/SplCard.vue";
import { tokens } from "@/components/transfer/token-helper";
import { HomePageInteractions, trackUserClick } from "@/directives/google-analytics";
import ControllerModule from "@/modules/controllers";

const isSplTokenLoading = computed(() => ControllerModule.isSplTokenLoading);
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
        <template v-if="isSplTokenLoading === LoadingState.FULL_RELOAD">
          <div class="flex flex-col space-y-4 w-full">
            <SplCard :spl-token-loading="true"></SplCard>
          </div>
        </template>
        <template v-else>
          <div v-for="token in tokens" :key="token?.tokenAddress?.toString()" class="w-full">
            <SplCard :spl-token="token" @spl-clicked="transferToken(token.mintAddress)"></SplCard>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tab-info {
  height: fit-content;
}
</style>

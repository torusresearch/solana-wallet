<script setup lang="ts">
import { SolanaToken } from "@toruslabs/solana-controllers";

import FallbackNft from "@/assets/fallback-nft.svg";
import { setFallbackImg } from "@/utils/helpers";

defineProps<{
  nftToken?: SolanaToken;
}>();

const emits = defineEmits(["cardClicked"]);

function cardClicked() {
  emits("cardClicked");
}
</script>

<template>
  <div
    class="large-card cursor-pointer bg-white dark:bg-app-gray-700 rounded-lg shadow-md dark:shadow-dark overflow-hidden m-4"
    @click="cardClicked"
    @keydown="cardClicked"
  >
    <div class="flex flex-col">
      <div class="nft-face-large" style="background-color: rgb(156, 156, 156)">
        <img
          :src="nftToken?.metaplexData?.offChainMetaData?.image"
          class="nft-face-large"
          alt="NFT LOGO"
          @error="setFallbackImg($event.target, FallbackNft)"
        />
      </div>
      <div class="flex items-center justify-between h-20 px-6">
        <div class="flex flex-col space-y-1 w-3/4">
          <p class="token-name">{{ nftToken?.metaplexData?.offChainMetaData?.name }}</p>
          <p class="font-normal text-xs leading-3 truncate text-app-text-600 dark:text-app-text-400">
            {{ nftToken?.metaplexData?.offChainMetaData?.collection?.name }}
          </p>
        </div>
        <div class="rounded-full overflow-hidden h-10 w-10 object-cover">
          <img alt="collection" :src="nftToken?.metaplexData?.offChainMetaData?.image" />
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.token-name {
  @apply font-bold text-sm leading-5 text-gray-800 break-all dark:text-app-text-dark-white truncate;
}

.large-card {
  width: 270px;
}
.nft-face-large {
  @apply object-cover;
  width: 270px;
  height: 270px;
}
</style>

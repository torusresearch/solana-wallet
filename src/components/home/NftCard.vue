<script setup lang="ts">
import { SolanaToken } from "@toruslabs/solana-controllers";

import FallbackNft from "@/assets/fallback-nft.svg";
import { getImgProxyUrl, setFallbackImg } from "@/utils/helpers";

defineProps<{
  nftToken?: SolanaToken;
}>();

const emits = defineEmits(["cardClicked"]);

function cardClicked() {
  emits("cardClicked");
}
</script>

<template>
  <div class="p-2 w-full overflow-hidden nft-item">
    <div
      class="w-full cursor-pointer bg-white dark:bg-app-gray-700 rounded-lg shadow-md dark:shadow-dark overflow-hidden"
      @click="cardClicked"
      @keydown="cardClicked"
    >
      <div class="flex flex-col">
        <div class="w-full relative">
          <!-- hack for 1:1 ratio-->
          <div class="h-0 pt-[100%] w-full"></div>
          <img
            :src="getImgProxyUrl(nftToken?.metaplexData?.offChainMetaData?.image) || FallbackNft"
            class="absolute top-0 left-0 overflow-hidden w-full h-full object-cover"
            alt="NFT LOGO"
            @error="setFallbackImg($event.target, FallbackNft)"
          />
        </div>
        <div class="flex items-center justify-between h-20 px-2">
          <div class="flex flex-col space-y-1 w-[70%]">
            <p class="token-name">{{ nftToken?.metaplexData?.offChainMetaData?.name }}</p>
            <p class="font-normal text-xs leading-3 truncate text-app-text-600 dark:text-app-text-400">
              {{ nftToken?.metaplexData?.offChainMetaData?.collection?.name }}
            </p>
          </div>
          <div class="rounded-full overflow-hidden h-10 w-10">
            <img
              alt="collection"
              :src="nftToken?.metaplexData?.offChainMetaData?.image || FallbackNft"
              class="rounded-full overflow-hidden h-10 w-10 object-cover"
              @error="setFallbackImg($event.target, FallbackNft)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.token-name {
  @apply font-bold text-sm leading-5 text-gray-800 break-all dark:text-app-text-dark-white truncate;
}
</style>

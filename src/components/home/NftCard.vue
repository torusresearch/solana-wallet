<script setup lang="ts">
import { SolanaToken } from "@toruslabs/solana-controllers";
import { ref } from "vue";

import CautionIcon from "@/assets/caution.svg";
import FallbackNft from "@/assets/fallback-nft.svg";
import { getImgProxyUrl, setFallbackImg } from "@/utils/helpers";

const props = defineProps<{
  nftToken?: SolanaToken;
}>();

const emits = defineEmits(["cardClicked"]);
const showSuspiciousNFT = ref(false);

function cardClicked() {
  if (!props.nftToken?.metaplexData?.isBlockListed || showSuspiciousNFT.value) emits("cardClicked");
}
</script>

<template>
  <div class="p-2 w-full overflow-hidden nft-item">
    <div
      class="w-full cursor-pointer bg-white dark:bg-app-gray-700 rounded-lg shadow-md dark:shadow-dark overflow-hidden"
      @click="cardClicked"
      @keydown="cardClicked"
      @click.prevent
    >
      <div class="flex flex-col">
        <div class="w-full relative">
          <!-- hack for 1:1 ratio-->
          <div class="h-0 pt-[100%] w-full"></div>
          <img
            v-if="!nftToken?.metaplexData?.isBlockListed || showSuspiciousNFT"
            :src="getImgProxyUrl(nftToken?.metaplexData?.offChainMetaData?.image) || FallbackNft"
            class="absolute top-0 left-0 overflow-hidden w-full h-full object-cover"
            alt="NFT LOGO"
            @error="setFallbackImg($event.target, FallbackNft)"
          />
          <div v-else class="absolute top-0 left-0 overflow-hidden flex flex-col items-center">
            <img class="h-12 mt-8 mb-3" :src="CautionIcon" alt="Warning" style="height: 48px" />
            <p class="text-white text-xl font-semibold my-2">Suspicious NFT</p>
            <p class="text-gray-500 leading-7 text-lg text-center my-2">NFTs claiming to give you any kind of free gifts are most likely scams</p>
            <div
              class="w-full rounded-full py-2 flex justify-center items-center text-red-500 font-medium text-lg mt-4 cursor-pointer send-nft"
              @click="showSuspiciousNFT = !showSuspiciousNFT"
              @keydown="showSuspiciousNFT = !showSuspiciousNFT"
              @click.stop
            >
              SHOW NFT ANYWAY
            </div>
          </div>
        </div>
        <div class="flex items-center justify-between h-20 px-2">
          <div class="flex flex-col space-y-1 w-[70%]">
            <p class="token-name">{{ nftToken?.metaplexData?.offChainMetaData?.name }}</p>
            <p class="font-normal text-xs leading-3 truncate text-app-text-600 dark:text-app-text-400">
              {{ nftToken?.metaplexData?.offChainMetaData?.collection?.name }}
            </p>
          </div>
          <div v-if="!nftToken?.metaplexData?.isBlockListed || showSuspiciousNFT" class="rounded-full overflow-hidden h-10 w-10">
            <img
              alt="collection"
              :src="getImgProxyUrl(nftToken?.metaplexData?.offChainMetaData?.image) || FallbackNft"
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

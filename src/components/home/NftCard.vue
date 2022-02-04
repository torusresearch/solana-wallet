<script setup lang="ts">
import { SolanaToken } from "@toruslabs/solana-controllers";

import FallbackNft from "@/assets/nft.png";
import { Button } from "@/components/common";
import { NFT_CARD_MODE } from "@/utils/enums";
import { setFallbackImg } from "@/utils/helpers";
import { ClubbedNfts } from "@/utils/interfaces";

const props = defineProps<{
  nftToken?: SolanaToken;
  mode: NFT_CARD_MODE;
  summaryData?: ClubbedNfts; // used when mode is summary
}>();

const emits = defineEmits(["cardClicked", "transferClicked", "closeClicked"]);

function cardClicked() {
  emits("cardClicked");
}

function transferClicked() {
  emits("transferClicked");
}
function closeClicked() {
  emits("closeClicked");
}
</script>

<template>
  <div
    :class="mode !== NFT_CARD_MODE.SUMMARY ? `flex items-center justify-start` : `my-3 px-3 w-full sm:w-1/2 md:w-1/3 xl:w-1/4 lg:w-1/4`"
    @click="cardClicked"
    @keydown="cardClicked"
  >
    <div
      v-if="props.summaryData && mode === NFT_CARD_MODE.SUMMARY"
      class="cursor-pointer p-3 shadow dark:shadow-dark border border-app-gray-200 dark:border-transparent bg-white dark:bg-app-gray-700 rounded-md h-20 flex flex-col justify-center"
    >
      <div class="flex flex-row justify-start items-center">
        <div class="nft-face img-loader-container">
          <img :src="props.summaryData.img" class="nft-face" alt="NFT LOGO" @error="setFallbackImg($event.target, FallbackNft)" />
        </div>
        <div class="flex flex-col justify-center align-center flex-1">
          <p class="token-name truncate w-24">{{ props.summaryData.collectionName }}</p>
          <p class="token-desc whitespace-no-wrap">{{ `${props.summaryData.count || 1} Assets` }}</p>
        </div>
      </div>
    </div>

    <div
      v-if="mode !== NFT_CARD_MODE.SUMMARY && nftToken"
      class="py-3 large-card mb-10 cursor-pointer mt-3 shadow dark:shadow-dark border border-app-gray-200 dark:border-transparent bg-white dark:bg-app-gray-700 rounded-md"
    >
      <div class="flex flex-col justify-start items-start w-min mx-auto">
        <div class="nft-face-large" style="background-color: rgb(156, 156, 156)">
          <img
            :src="nftToken?.metaplexData?.offChainMetaData?.image"
            class="nft-face-large"
            alt="NFT LOGO"
            @error="setFallbackImg($event.target, FallbackNft)"
          />
        </div>
        <div class="flex flex-col">
          <p class="token-name">{{ nftToken.metaplexData?.offChainMetaData?.name }}</p>
          <p class="token-family text-app-text-600 dark:text-app-text-dark-500">
            {{ nftToken.metaplexData?.offChainMetaData?.collection?.name }}
          </p>
        </div>
        <template v-if="mode === NFT_CARD_MODE.EXPANDED">
          <div v-if="nftToken.metaplexData?.offChainMetaData?.description" class="flex flex-col justify-center align-center mt-4">
            <p class="field-title mb-1">Description</p>
            <p class="token-desc ml-2">{{ nftToken.metaplexData?.offChainMetaData?.description }}</p>
          </div>

          <div v-if="nftToken.metaplexData?.offChainMetaData?.attributes?.length" class="flex flex-col justify-center align-center mt-4">
            <p class="field-title">Attributes</p>
            <p v-for="attribute in nftToken.metaplexData?.offChainMetaData.attributes" :key="`${attribute.value}`" class="token-desc ml-2 mt-1">
              {{ attribute.trait_type }}: {{ attribute.value }}
            </p>
          </div>
          <Button variant="outline" :block="true" class="mt-5 mx-auto" size="small" @click="transferClicked()">Transfer</Button>
          <p
            class="cursor-pointer text-center mt-5 text-app-text-500 dark:text-app-text-dark-500 w-full"
            @click="closeClicked()"
            @keydown="closeClicked()"
          >
            Close
          </p>
        </template>
      </div>
    </div>
  </div>
</template>
<style scoped>
.nft-face {
  @apply h-12 w-12 object-cover rounded-md mr-4;
}
.token-name {
  @apply font-bold text-base leading-5 text-gray-800 break-all dark:text-app-text-dark-white;
}

.token-desc,
.token-family {
  @apply font-normal text-xs leading-3 dark:text-app-text-dark-white;
}

.large-card {
  width: 185px;
}
.nft-face-large {
  @apply object-cover rounded-md mb-4;
  width: 160px;
  height: 160px;
}

.field-title {
  color: #979797;
  @apply text-xs font-bold;
}
</style>

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
    class="font-body"
    :class="mode !== NFT_CARD_MODE.SUMMARY ? `flex items-center justify-start` : `container-card`"
    @click="cardClicked"
    @keydown="cardClicked"
  >
    <div
      v-if="props.summaryData && mode === NFT_CARD_MODE.SUMMARY"
      class="
        cursor-pointer
        my-3
        px-3
        shadow
        dark:shadow-dark
        sm:my-3 sm:px-3
        md:my-3 md:px-3
        lg:my-3 lg:px-3
        xl:my-3 xl:px-3
        nft-container
        border border-app-gray-200
        dark:border-transparent
        m-4
        bg-white
        dark:bg-app-gray-700
        rounded-md
        summary-card
      "
    >
      <div class="nft-item flex flex-row justify-start items-center w-100 h-100 overflow-hidden max-w-full">
        <div class="nft-face img-loader-container">
          <img :src="props.summaryData.img" class="nft-face" alt="NFT LOGO" @error="setFallbackImg($event.target, FallbackNft)" />
        </div>
        <div class="flex flex-col justify-center align-center w-100 h-100">
          <p class="token-name">{{ props.summaryData.collectionName }}</p>
          <p class="token-desc summary">{{ `${props.summaryData.count || 1} Assets` }}</p>
        </div>
      </div>
    </div>

    <div
      v-if="mode !== NFT_CARD_MODE.SUMMARY && nftToken"
      class="
        large-card
        cursor-pointer
        my-3
        px-3
        shadow
        dark:shadow-dark
        sm:my-3 sm:px-3
        md:my-3 md:px-3
        lg:my-3 lg:px-3
        xl:my-3 xl:px-3
        border border-app-gray-200
        dark:border-transparent
        bg-white
        dark:bg-app-gray-700
        rounded-md
      "
    >
      <div class="nft-item flex flex-col justify-start align-start w-100">
        <div class="nft-face-large" style="background-color: rgb(156, 156, 156)">
          <img
            :src="nftToken?.metaplexData?.offChainMetaData?.image"
            class="nft-face-large"
            alt="NFT LOGO"
            @error="setFallbackImg($event.target, FallbackNft)"
          />
        </div>
        <div class="flex flex-col justify-center align-center w-100 h-100">
          <p class="token-name">{{ nftToken.metaplexData?.offChainMetaData?.name }}</p>
          <p class="token-family mt-1 text-app-text-600 dark:text-app-text-dark-500">
            {{ nftToken.metaplexData?.offChainMetaData?.collection?.name }}
          </p>
        </div>
        <template v-if="mode === NFT_CARD_MODE.EXPANDED">
          <div v-if="nftToken.metaplexData?.offChainMetaData?.description" class="flex flex-col justify-center align-center w-100 h-100 mt-4">
            <p class="field-title mb-1">Description</p>
            <p class="token-desc ml-2">{{ nftToken.metaplexData?.offChainMetaData?.description }}</p>
          </div>

          <div v-if="nftToken.metaplexData?.offChainMetaData?.attributes?.length" class="flex flex-col justify-center align-center w-100 h-100 mt-4">
            <p class="field-title">Attributes</p>
            <p v-for="attribute in nftToken.metaplexData?.offChainMetaData.attributes" :key="`${attribute.value}`" class="token-desc mt-1 ml-2">
              {{ attribute.trait_type }}: {{ attribute.value }}
            </p>
          </div>
          <!-- <button class="mt-5" @click="transferClicked()">Transfer</button> -->
          <Button variant="outline" :block="true" class="mt-5" size="small" @click="transferClicked()">Transfer</Button>
          <p class="cursor-pointer text-center mt-5 text-app-text-500 dark:text-app-text-dark-500" @click="closeClicked()" @keydown="closeClicked()">
            Close
          </p>
        </template>
      </div>
    </div>
  </div>
</template>
<style scoped>
.nft-face {
  height: 40px;
  width: 40px;
  object-fit: cover;
  border-radius: 6px;
  margin-right: 16px;
}
.nft-face-container {
  height: 40px;
  width: 40px;
  object-fit: cover;
  border-radius: 6px;
  margin-right: 16px;
  background: rgb(156, 156, 156);
}
.nft-container {
  height: 80px;
  padding: 20px;
}

.token-name {
  font-style: normal;
  font-weight: bold;
  font-size: 16px;
  line-height: 19px;
  color: #2f3136;
}

.token-desc,
.token-family {
  font-style: normal;
  font-weight: normal;
  font-size: 12px;
  line-height: 14px;
}
.dark .token-name,
.dark .token-desc {
  color: #ffffff;
}

.large-card {
  width: 185px;
  padding: 16px 16px 26px 16px;
  margin-bottom: 40px;
}
.nft-face-large {
  width: 153px;
  height: 160px;
  object-fit: cover;
  border-radius: 6px;
  margin: 0 auto 16px auto;
}

.nft-face-large-container {
  width: 153px;
  height: 160px;
  border-radius: 6px;
  margin: 0 auto 16px auto;
}
.field-title {
  color: #979797;
  font-size: 12px;
  font-weight: bold;
}
.summary {
  white-space: nowrap;
}
.summary-card {
  width: 260px;
  overflow-x: hidden;
}

.container-card {
  width: 290px;
}
</style>

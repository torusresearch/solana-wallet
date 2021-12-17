<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import NftLogo from "@/assets/nft_token.svg";
import SolTokenLogo from "@/assets/sol_token.svg";
import NftCard from "@/components/home/NftCard.vue";
import ControllerModule from "@/modules/controllers";
import { NFT_CARD_MODE } from "@/utils/enums";
import { getClubbedNfts } from "@/utils/helpers";

const router = useRouter();
const enum TOKEN_TAB_TYPES {
  NFT_TAB = "NFT_TAB",
  TOKEN_TAB = "TOKEN_TAB",
}

const selectedTab = ref<TOKEN_TAB_TYPES>(TOKEN_TAB_TYPES.TOKEN_TAB);
const currency = computed(() => ControllerModule.torus.currentCurrency?.toLocaleLowerCase());
const nonFungibleTokens = computed(() => ControllerModule.torus.nonFungibleTokens);
const fungibleTokens = computed(() => ControllerModule.torus.fungibleTokens);

function selectTab(tab: TOKEN_TAB_TYPES) {
  selectedTab.value = tab;
}

onMounted(() => {
  selectTab(TOKEN_TAB_TYPES.TOKEN_TAB);
});

function transferToken(mint: string) {
  router.push(`/wallet/transfer?mint=${mint}`);
}
function nftClicked(mints: string[]) {
  router.push(`/wallet/nfts?mints=${mints.join(",")}`);
}

function getUiTokenValue(perTokenPrice: number, tokenAmount: number, subStringLength = 5): number {
  return parseFloat((perTokenPrice * tokenAmount).toFixed(subStringLength));
}
</script>

<template>
  <div class="flex flex-col justify-start items-center w-100">
    <!-- Tabs -->
    <div class="tab-group-container flex flex-row justify-center items-start w-full">
      <div
        class="tok-tab flex flex-row justify-center items-center"
        :class="[selectedTab === TOKEN_TAB_TYPES.NFT_TAB ? 'tab-active' : '']"
        @click="selectTab(TOKEN_TAB_TYPES.NFT_TAB)"
        @keydown="selectTab(TOKEN_TAB_TYPES.NFT_TAB)"
      >
        <img class="block h-4 w-auto" :src="NftLogo" alt="NFT Logo" />
        <p class="ml-2 text-sm">NFTs</p>
      </div>
      <div
        class="tok-tab flex flex-row justify-center items-center"
        :class="[selectedTab === TOKEN_TAB_TYPES.TOKEN_TAB ? 'tab-active' : '']"
        @click="selectTab(TOKEN_TAB_TYPES.TOKEN_TAB)"
        @keydown="selectTab(TOKEN_TAB_TYPES.TOKEN_TAB)"
      >
        <img class="block h-4 w-auto" :src="SolTokenLogo" alt="NFT Logo" />
        <p class="ml-2 text-sm">Tokens</p>
      </div>
    </div>
    <!-- Tabs -->

    <!-- List of token/nft Cards -->
    <div class="tab-info w-full">
      <div v-if="selectedTab === TOKEN_TAB_TYPES.TOKEN_TAB" class="flex flex-wrap -mx-3 overflow-hidden sm:-mx-3 md:-mx-3 lg:-mx-3 xl:-mx-3">
        <div
          v-for="token in fungibleTokens"
          :key="token.tokenAddress.toString()"
          class="my-3 px-3 overflow-hidden sm:my-3 sm:px-3 md:my-3 md:px-3 lg:my-3 lg:px-3 xl:my-3 xl:px-3 w-full sm:w-1/2 md:w-1/3 xl:w-1/4 lg:w-1/4 cursor-pointer"
          @click="transferToken(token.mintAddress)"
          @keydown="transferToken(token.mintAddress)"
        >
          <div
            class="token-item shadow dark:shadow-dark flex flex-col justify-start align-start w-100 border-solid border-app-gray-200 dark:border-transparent"
          >
            <div class="flex flex-row justify-between items-center w-100 token-header shadow dark:shadow-dark">
              <span class="flex flex-row justify-start items-center ml-3">
                <img class="block h-5 mr-2 w-auto token-image" :src="token.data?.logoURI" alt="TOKEN Logo" />
                <p class="token-name">{{ token.data?.name }}</p></span
              >
              <span class="flex flex-row justify-start items-center mr-3">
                <p class="coin-value">~{{ token.balance?.uiAmountStrings }}</p>
                <p class="coin-currency">{{ token.data?.symbol }}</p></span
              >
            </div>
            <div class="flex flex-row justify-between items-center w-100 token-footer">
              <p class="ml-3">
                1 {{ token.data?.symbol }} ≈ {{ token.price?.[currency === "sol" ? "usd" : currency] || 0 }}
                {{ (currency === "sol" ? "usd" : currency).toUpperCase() }}
              </p>
              <p class="mr-3">
                ~{{ getUiTokenValue(token.price?.[currency === "sol" ? "usd" : currency] || 0, token.balance?.uiAmount || 0) }}
                {{ (currency === "sol" ? "usd" : currency).toUpperCase() }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="selectedTab === TOKEN_TAB_TYPES.NFT_TAB"
        class="flex flex-wrap -mx-3 overflow-hidden sm:-mx-3 md:-mx-3 lg:-mx-3 xl:-mx-3 pb-4 pt-1"
        :class="!nonFungibleTokens?.length ? `w-full justify-center` : ``"
      >
        <div
          v-if="!nonFungibleTokens?.length"
          class="no-nft my-3 px-3 shadow dark:shadow-dark sm:my-3 sm:px-3 md:my-3 md:px-3 lg:my-3 lg:px-3 xl:my-3 xl:px-3 nft-container border border-app-gray-200 dark:border-transparent m-4 bg-white dark:bg-app-gray-700 rounded-md flex flex-col items-center justify-center"
        >
          <p class="text-app-text-500 dark:text-app-text-dark-500 text-sm font-bold mb-2">Get you first NFT!</p>
          <a href="https://www.holaplex.com/" target="_blank" class="text-app-text-accent text-xs">Check out Holaplex here</a>
        </div>
        <NftCard
          v-for="token in getClubbedNfts(nonFungibleTokens)"
          v-else
          :key="token.collectionName"
          :mode="NFT_CARD_MODE.SUMMARY"
          :summary-data="token"
          class="w-full sm:w-1/2 md:w-1/3 xl:w-1/4 lg:w-1/4"
          @card-clicked="nftClicked(token.mints)"
        >
        </NftCard>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tab-group-container {
  border-radius: 6px;
  overflow: hidden;
}

.tok-tab {
  max-width: 276px;
  height: 42px;
  box-shadow: 2px 2px 12px rgba(3, 100, 255, 0.06);
  background: #f3f3f4;
  color: #a2a5b5;
  cursor: pointer;
  flex: 1 1 auto;
}
.dark .tok-tab {
  background: #2f3136;
  color: #a2a5b5;
}

.dark .token-name,
.dark .coin-value,
.dark .coin-currency {
  color: #d3d5e2 !important;
}

.tab-active {
  background: #9945ff !important;
  color: #ffffff !important;
}
.token-item {
  max-width: 320px;
  height: 80px;
  box-sizing: border-box;
  border-radius: 6px;
  margin: auto;
  overflow: hidden;
}
.token-name {
  font-weight: bold;
  font-size: 12px;
  line-height: 14px;
  margin-top: 4px;
}
.coin-value {
  margin-right: 4px;
}
.coin-value,
.coin-currency {
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 14px;
  text-align: right;
  letter-spacing: 0.0857143px;
  color: #0f1222;
}

.token-image {
  color: white;
  font-weight: bold;
  font-size: 12px;
  line-height: 14px;
  margin-top: 4px;
}
.token-header {
  box-sizing: border-box;
  flex: 1 1 auto;
}
.dark .token-header {
  background: #2f3136;
}
.token-footer {
  font-style: normal;
  font-weight: normal;
  font-size: 10px;
  letter-spacing: 0.0857143px;
  color: #b3c0ce;
  flex: 1 1 auto;
}
.dark .token-footer {
  background: #2d2f34;
}

.nft-face {
  height: 180px;
  object-fit: cover;
}

.no-nft {
  width: 260px;
  height: 80px;
  overflow-x: hidden;
}
</style>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import NftLogo from "@/assets/nft_token.svg";
import SolTokenLogo from "@/assets/sol_token.svg";
import Nftcard from "@/components/home/NftCard.vue";
import SplCard from "@/components/home/SplCard.vue";
import ControllerModule from "@/modules/controllers";
import { NFT_CARD_MODE } from "@/utils/enums";
import { getClubbedNfts } from "@/utils/helpers";

const router = useRouter();
const { t } = useI18n();
const enum TOKEN_TAB_TYPES {
  NFT_TAB = "NFT_TAB",
  TOKEN_TAB = "TOKEN_TAB",
}

const selectedTab = ref<TOKEN_TAB_TYPES>(TOKEN_TAB_TYPES.TOKEN_TAB);
const nonFungibleTokens = computed(() => ControllerModule.nonFungibleTokens);
const fungibleTokens = computed(() => ControllerModule.fungibleTokens);

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
</script>

<template>
  <div class="flex flex-col">
    <!-- Tabs -->
    <div class="flex flex-row justify-center items-start w-full mb-4">
      <div
        class="tok-tab flex flex-row justify-center items-center"
        :class="[selectedTab === TOKEN_TAB_TYPES.NFT_TAB ? 'tab-active' : '']"
        @click="selectTab(TOKEN_TAB_TYPES.NFT_TAB)"
        @keydown="selectTab(TOKEN_TAB_TYPES.NFT_TAB)"
      >
        <img class="h-4" :src="NftLogo" alt="NFT Logo" />
        <p class="ml-2 text-sm">NFTs</p>
      </div>
      <div
        class="tok-tab flex flex-row justify-center items-center"
        :class="[selectedTab === TOKEN_TAB_TYPES.TOKEN_TAB ? 'tab-active' : '']"
        @click="selectTab(TOKEN_TAB_TYPES.TOKEN_TAB)"
        @keydown="selectTab(TOKEN_TAB_TYPES.TOKEN_TAB)"
      >
        <img class="h-4" :src="SolTokenLogo" alt="NFT Logo" />
        <p class="ml-2 text-sm">{{ t("walletHome.tokens") }}</p>
      </div>
    </div>
    <!-- Tabs -->

    <!-- List of token/nft Cards -->
    <div class="tab-info w-full overflow-x-hidden">
      <div v-if="selectedTab === TOKEN_TAB_TYPES.TOKEN_TAB" class="flex flex-wrap">
        <div v-for="token in fungibleTokens" :key="token.tokenAddress.toString()" class="my-3 px-3 w-full sm:w-1/2 md:w-1/3 xl:w-1/4 lg:w-1/4">
          <SplCard :spl-token="token" @spl-clicked="transferToken(token.mintAddress)"></SplCard>
        </div>
      </div>
      <div
        v-if="selectedTab === TOKEN_TAB_TYPES.NFT_TAB"
        class="flex flex-wrap overflow-hidden"
        :class="!nonFungibleTokens?.length ? `w-full justify-center` : ``"
      >
        <div
          v-if="!nonFungibleTokens?.length"
          class="no-nft h-20 overflow-x-hidden my-3 px-3 shadow dark:shadow-dark nft-container border border-app-gray-200 dark:border-transparent m-4 bg-white dark:bg-app-gray-700 rounded-md flex flex-col items-center justify-center"
        >
          <p class="text-app-text-500 dark:text-app-text-dark-500 text-sm font-bold mb-2">{{ t("walletHome.getFirstNFT") }}</p>
          <a href="https://www.holaplex.com/" target="_blank" class="text-app-text-accent text-xs">{{ t("walletHome.holaplex") }}</a>
        </div>
        <Nftcard
          v-for="token in getClubbedNfts(nonFungibleTokens)"
          v-else
          :key="token.collectionName"
          :mode="NFT_CARD_MODE.SUMMARY"
          :summary-data="token"
          @card-clicked="nftClicked(token.mints)"
        >
        </Nftcard>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tok-tab {
  @apply h-10 cursor-pointer flex-auto bg-app-gray-300 dark:bg-app-gray-700 text-app-text-400 dark:text-app-text-dark-500;
  max-width: 276px;
  box-shadow: 2px 2px 12px rgba(3, 100, 255, 0.06);
}

.tab-active {
  @apply bg-app-primary-500 text-app-text-dark-white !important;
}
.no-nft {
  width: 260px;
}
.tab-info {
  height: max(300px, calc(100vh - 450px));
}
@screen lt-sm {
  .tab-info {
    height: max(300px, calc(100vh - 610px));
  }
}

.tab-info::-webkit-scrollbar-track {
  @apply bg-app-primary-100 dark:bg-app-gray-800 rounded-lg;
}

.tab-info::-webkit-scrollbar {
  @apply bg-app-primary-100 dark:bg-app-gray-800 w-1;
}
.tab-info::-webkit-scrollbar-thumb {
  @apply rounded-lg bg-app-primary-500;
}
</style>

<script setup lang="ts">
import { SolanaToken } from "@toruslabs/solana-controllers";
import { computed, onMounted, ref } from "vue";

import NftLogo from "@/assets/nft_token.svg";
import SolTokenLogo from "@/assets/sol_token.svg";
import { addToast } from "@/modules/app";
import ControllerModule from "@/modules/controllers";

const TOKEN_TABS = {
  NFT_TAB: "NFT_TAB",
  TOKEN_TAB: "TOKEN_TAB",
} as const;

type TOKEN_TABS_TYPE = typeof TOKEN_TABS[keyof typeof TOKEN_TABS];

const selectedTab = ref<TOKEN_TABS_TYPE>(TOKEN_TABS.TOKEN_TAB);
const publicKey = computed(() => ControllerModule.torus.selectedAddress);
const currency = computed(() => ControllerModule.torus.currentCurrency?.toLocaleLowerCase());
const tokens = computed<SolanaToken[]>(() => ControllerModule.torus.tokens?.[publicKey.value]);

function selectTab(tab: TOKEN_TABS_TYPE) {
  if (tab !== TOKEN_TABS.TOKEN_TAB) {
    addToast({ message: "Feature under development", type: "error" });
    // for now only supporting the TOKEN tabs, not NFTs
    return;
  }
  selectedTab.value = tab;
}

onMounted(() => {
  selectTab(TOKEN_TABS.TOKEN_TAB);
});

// depending on the totalItems we'd like to have dynamic column count in grid
function getResponsiveClasses(): string {
  // if (totalItems === 1) { // for now showing in 4 grids whatsoever
  //   return "w-full";
  // } else if (totalItems === 2) {
  //   return "w-full sm:w-1/2 gt-sm:w-1/2";
  // } else if (totalItems === 3) {
  //   return "w-full sm:w-1/2 md:w-1/3 xl:w-1/3  lg:w-1/3";
  // }
  return "w-full sm:w-1/2 md:w-1/3 xl:w-1/4  lg:w-1/4";
}

function getUiTokenValue(perTokenPrice: number, tokenAmount: number, subStringLength = 5): number {
  return parseFloat((perTokenPrice * tokenAmount).toFixed(subStringLength));
}
</script>

<template>
  <div class="flex flex-col justify-start items-center w-100">
    <div class="tab-group-container flex flex-row justify-center items-start w-full">
      <div
        class="tok-tab flex flex-row justify-center items-center"
        :class="[selectedTab === TOKEN_TABS.NFT_TAB ? 'tab-active' : '']"
        @click="selectTab(TOKEN_TABS.NFT_TAB)"
        @keydown="selectTab(TOKEN_TABS.NFT_TAB)"
      >
        <img class="block h-4 w-auto" :src="NftLogo" alt="NFT Logo" />
        <p class="ml-2 text-sm">NFTs</p>
      </div>
      <div
        class="tok-tab flex flex-row justify-center items-center"
        :class="[selectedTab === TOKEN_TABS.TOKEN_TAB ? 'tab-active' : '']"
        @click="selectTab(TOKEN_TABS.TOKEN_TAB)"
        @keydown="selectTab(TOKEN_TABS.TOKEN_TAB)"
      >
        <img class="block h-4 w-auto" :src="SolTokenLogo" alt="NFT Logo" />
        <p class="ml-2 text-sm">Tokens</p>
      </div>
    </div>
    <div class="tab-info w-full">
      <div
        v-if="selectedTab === TOKEN_TABS.TOKEN_TAB && tokens?.length"
        class="flex flex-wrap -mx-3 overflow-hidden sm:-mx-3 md:-mx-3 lg:-mx-3 xl:-mx-3"
      >
        <div
          v-for="token in tokens"
          :key="token.tokenAddress.toString()"
          :class="getResponsiveClasses()"
          class="my-3 px-3 overflow-hidden sm:my-3 sm:px-3 md:my-3 md:px-3 lg:my-3 lg:px-3 xl:my-3 xl:px-3"
        >
          <div
            class="
              token-item
              shadow
              dark:shadow-dark
              flex flex-col
              justify-start
              align-start
              w-100
              border-solid border-app-gray-200
              dark:border-transparent
            "
          >
            <div class="flex flex-row justify-between items-center w-100 token-header shadow dark:shadow-dark">
              <span class="flex flex-row justify-start items-center ml-3">
                <img class="block h-5 w-auto" :src="token.data.logoURI" alt="TOKEN Logo" />
                <p class="coin-name">{{ token.data.name }}</p></span
              >
              <span class="flex flex-row justify-start items-center mr-3">
                <p class="coin-value">{{ token.balance?.uiAmountStrings }}</p>
                <p class="coin-currency">{{ token.data.symbol }}</p></span
              >
            </div>
            <div class="flex flex-row justify-between items-center w-100 token-footer">
              <p class="ml-3">{{ token.data.name }}</p>
              <p class="mr-3">
                ~{{ getUiTokenValue(token.price?.[currency === "sol" ? "usd" : currency] || 0, token.balance?.uiAmount || 0) }}
                {{ (currency === "sol" ? "usd" : currency).toUpperCase() }}
              </p>
            </div>
          </div>
        </div>
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

.dark .coin-name,
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
.coin-name {
  font-weight: bold;
  font-size: 12px;
  line-height: 14px;
  margin-left: 4px;
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
</style>

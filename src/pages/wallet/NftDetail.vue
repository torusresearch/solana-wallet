<script setup lang="ts">
import { get } from "@toruslabs/http-helpers";
import { LoadingState, SolanaToken } from "@toruslabs/solana-controllers";
import log from "loglevel";
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

import FallbackNft from "@/assets/fallback-nft.svg";
import RoundLoader from "@/components/common/RoundLoader.vue";
import NftCard from "@/components/home/NftCard.vue";
import config from "@/config";
import { NftsPageInteractions } from "@/directives/google-analytics";
import ControllerModule from "@/modules/controllers";
import { setFallbackImg } from "@/utils/helpers";
import { NFTCollection } from "@/utils/interfaces";

import NftCardLoader from "../../components/home/NftCardLoader.vue";

type FETCH_STATE = "idle" | "loading" | "loaded" | "error";

const router = useRouter();
const nfts = computed<SolanaToken[]>(() => ControllerModule.nonFungibleTokens);
const isNFTloading = computed<LoadingState>(() => ControllerModule.isNFTloading);
const selectedAddress = computed<string>(() => ControllerModule.selectedAddress);
const exploreNFTS = ref<NFTCollection[]>([]);
const exploreNFTSFetchState = ref<FETCH_STATE>("idle");

async function fetchPopularNfts() {
  if (nfts.value.length === 0 && exploreNFTS.value.length === 0) {
    try {
      exploreNFTSFetchState.value = "loading";
      const collections: NFTCollection[] = await get(`${config.api}/tokeninfo/popularNFTs`);

      exploreNFTS.value = collections.slice(0, 10);
      exploreNFTSFetchState.value = "loaded";
    } catch (error) {
      log.error(new Error("Could not fetch example NFTs"));
      exploreNFTSFetchState.value = "error";
      exploreNFTS.value = [];
    }
  }
}

onMounted(async () => {
  await fetchPopularNfts();
});

const openCollection = (collectionName: string) => {
  window.open(`https://magiceden.io/marketplace/${collectionName}`, "_blank");
};
const navigateNFT = (mintAddress: string) => {
  router.push(`/wallet/nfts/${mintAddress}`);
};

watch([nfts, selectedAddress], async () => {
  await fetchPopularNfts();
});

function getNftFetchMessage(state: FETCH_STATE): string {
  switch (state) {
    case "error":
      return "Failed to load popular NFT projects, please try again later.";
    case "loaded":
      return "You might be keen to check out some of the popular NFT projects";
    case "loading":
      return "Loading popular NFT projects";
    default:
      return "";
  }
}
</script>
<template>
  <div class="flex flex-col w-full py-2">
    <span class="text-app-text-500 nft-title">You have {{ nfts.length }} NFTs</span>
    <template v-if="isNFTloading === LoadingState.FETCHING">
      <NftCardLoader />
    </template>
    <template v-else>
      <div v-if="nfts.length === 0" class="w-full shadow dark:shadow-dark bg-white dark:bg-app-gray-700 rounded-md mt-10 p-12 pt-8">
        <span class="text-app-text-500 dark:text-app-text-dark-400 text-center inline-block">{{ getNftFetchMessage(exploreNFTSFetchState) }}</span>
        <RoundLoader v-if="exploreNFTSFetchState == 'loading'" class="w-10 h-10 mx-auto mb-4" color="border-white" />
        <div v-if="exploreNFTS.length" class="flex flex-wrap justify-center mt-12">
          <div v-for="collection in exploreNFTS" :key="collection.image" class="flex flex-col items-center m-4 w-48 popular-nft">
            <img
              v-ga="NftsPageInteractions.OPEN_COLLECTION + collection.image"
              alt="NFT collection"
              :src="collection?.image || FallbackNft"
              class="h-32 w-32 rounded-full overflow-hidden border-2 border-white cursor-pointer object-cover"
              @click="openCollection(collection.collectionSymbol)"
              @keydown="openCollection(collection.collectionSymbol)"
              @error="setFallbackImg($event.target, FallbackNft)"
            />
            <span
              v-ga="NftsPageInteractions.OPEN_COLLECTION + collection.image"
              class="mt-4 text-app-text-500 dark:text-app-text-dark-400 cursor-pointer truncate"
              @click="openCollection(collection.collectionSymbol)"
              @keydown="openCollection(collection.collectionSymbol)"
              >{{ collection.name }}</span
            >
          </div>
        </div>
      </div>
      <div v-else class="w-full mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 items-center justify-items-center">
        <NftCard
          v-for="nft in nfts"
          :key="nft.mintAddress"
          v-ga="NftsPageInteractions.SELECT + nft.mintAddress"
          :nft-token="nft"
          @card-clicked="navigateNFT(nft.mintAddress)"
        />
      </div>
    </template>
  </div>
</template>
<style scoped>
.nft-container {
  padding-left: 10px;
  padding-right: 22px;
}
</style>

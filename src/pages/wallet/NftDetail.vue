<script setup lang="ts">
import { get } from "@toruslabs/http-helpers";
import { SolanaToken } from "@toruslabs/solana-controllers";
import log from "loglevel";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import FallbackNft from "@/assets/fallback-nft.svg";
import NftCard from "@/components/home/NftCard.vue";
import { NftsPageInteractions } from "@/directives/google-analytics";
import ControllerModule from "@/modules/controllers";
import { setFallbackImg } from "@/utils/helpers";

type FETCH_STATE = "idle" | "loading" | "loaded" | "error";

const router = useRouter();
const nfts = computed<SolanaToken[]>(() => ControllerModule.nonFungibleTokens);
const exploreNFTS = ref<any[]>([]);
const exploreNFTSFetchState = ref<FETCH_STATE>("idle");
onMounted(async () => {
  if (nfts.value.length === 0) {
    try {
      exploreNFTSFetchState.value = "loading";
      const [collections, volume]: any[] = await Promise.all([
        get("https://qzlsklfacc.medianetwork.cloud/get_collections"),
        get("https://qzlsklfacc.medianetwork.cloud/query_volume_all"),
      ]);

      const combinedCollectionObject = collections
        .map((val: any) => {
          const stats = volume.find((e: any) => e.collection === val.url);
          return { ...val, stats };
        })
        .sort((a: any, b: any) => {
          if (a.stats === undefined) return 1;
          if (b.stats === undefined) return -1;
          if (a.stats.weeklyVolume > b.stats.weeklyVolume) return -1;
          if (a.stats.weeklyVolume < b.stats.weeklyVolume) return 1;
          return 0;
        });
      exploreNFTS.value = combinedCollectionObject.slice(0, 10) as any;
      exploreNFTSFetchState.value = "loaded";
    } catch (error) {
      log.error(new Error("Could not fetch example NFTs"));
      exploreNFTSFetchState.value = "error";
      exploreNFTS.value = [];
    }
  }
});
const openCollection = (collectionName: string) => {
  window.open(`https://solanart.io/collections/${collectionName}`, "_blank");
};
const navigateNFT = (mintAddress: string) => {
  router.push(`/wallet/nfts/${mintAddress}`);
};
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
    <span class="text-app-text-500">You have {{ nfts.length }} NFTs</span>
    <div v-if="nfts.length === 0" class="w-full shadow dark:shadow-dark bg-white dark:bg-app-gray-700 rounded-md mt-10 p-12 pt-8">
      <span class="text-app-text-500 dark:text-app-text-dark-400 text-center inline-block">{{ getNftFetchMessage(exploreNFTSFetchState) }}</span>
      <div v-if="exploreNFTS.length" class="flex flex-wrap justify-center mt-12">
        <div v-for="collection in exploreNFTS" :key="collection.url" class="flex flex-col items-center m-4 w-48">
          <img
            v-ga="NftsPageInteractions.OPEN_COLLECTION + collection.url"
            alt="NFT collection"
            :src="collection?.imgpreview || FallbackNft"
            class="h-32 w-32 rounded-full overflow-hidden border-2 border-white cursor-pointer object-cover"
            @click="openCollection(collection.url)"
            @keydown="openCollection(collection.url)"
            @error="setFallbackImg($event.target, FallbackNft)"
          />
          <span
            v-ga="NftsPageInteractions.OPEN_COLLECTION + collection.url"
            class="mt-4 text-app-text-500 dark:text-app-text-dark-400 cursor-pointer truncate"
            @click="openCollection(collection.url)"
            @keydown="openCollection(collection.url)"
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
  </div>
</template>
<style scoped>
.nft-container {
  padding-left: 10px;
  padding-right: 22px;
}
</style>

<script setup lang="ts">
// import { SolanaToken } from "@toruslabs/solana-controllers";
import { SolanaToken } from "@toruslabs/solana-controllers";
import { NFTInfo } from "@toruslabs/solana-controllers/dist/types/utils/interfaces";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

import BreadCrumb from "@/components/common/BreadCrumb.vue";
import NftCard from "@/components/home/NftCard.vue";
import ControllerModule from "@/modules/controllers";

const router = useRouter();
const publicKey = computed(() => ControllerModule.torus.selectedAddress);
const allTokens = computed<SolanaToken[]>(() => ControllerModule.torus.tokens?.[publicKey.value]);
const selectedMints = (router.currentRoute.value.query?.mints as string)?.split(",");
const nfts = computed<SolanaToken[]>(() => allTokens.value.filter((tok) => selectedMints?.includes(tok.mintAddress.toString())));

// eslint-disable-next-line no-console
console.log("selectedMints", selectedMints, nfts.value);

const isExpanded = ref({});

function transferToken(ticker = "sol") {
  router.push(`/wallet/transfer?isFungible=true&name=${ticker}`);
}
// function hello() {
//   // eslint-disable-next-line no-console
//   console.log("sdf");
// }
const metaData = (nfts.value[0]?.data as NFTInfo)?.uriMetaData;
const breadcrumbData = [{ text: "Home" }, { text: "NFTs" }, { text: (metaData as any)?.collection?.family || metaData?.symbol || "Unknown Token" }];
</script>
<template>
  <div class="flex flex-col justify-start items-start w-full py-2 pt-5">
    <BreadCrumb :bread-crumb-data="breadcrumbData"></BreadCrumb>
    <!--    TODO ADD SELECT HERE-->
    <div v-if="nfts.length" class="flex flex-wrap -mx-3 overflow-hidden sm:-mx-3 md:-mx-3 lg:-mx-3 xl:-mx-3 w-full pb-4 pt-1">
      <div
        v-for="nft in nfts"
        :key="nft.mintAddress"
        class="my-3 px-3 overflow-hidden sm:my-3 sm:px-3 md:my-3 md:px-3 lg:my-3 lg:px-3 xl:my-3 xl:px-3 w-full sm:w-1/2 md:w-1/3 xl:w-1/4 lg:w-1/4"
      >
        <NftCard v-if="!isExpanded[nft.mintAddress]" mode="large" :nft-token="nft" @card-clicked="isExpanded[nft.mintAddress] = true"></NftCard>
        <NftCard
          v-if="isExpanded[nft.mintAddress]"
          mode="expanded"
          :nft-token="nft"
          @close-clicked="isExpanded[nft.mintAddress] = false"
          @transfer-clicked="transferToken(nft.data.name)"
        ></NftCard>
      </div>
    </div>
    <p v-else class="text-app-text-500 dark:text-app-text-dark-500 mt-6">We could not fetch the NFT details.</p>
  </div>
</template>

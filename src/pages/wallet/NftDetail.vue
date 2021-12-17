<script setup lang="ts">
import { SolanaToken } from "@toruslabs/solana-controllers";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

import BreadCrumb from "@/components/common/BreadCrumb.vue";
import NftCard from "@/components/home/NftCard.vue";
import NftSelect from "@/components/tokens/NftSelect.vue";
import ControllerModule from "@/modules/controllers";
import { NFT_CARD_MODE } from "@/utils/enums";

const router = useRouter();
const selectedMints = ref((router.currentRoute.value.query?.mints as string)?.split(","));
const nfts = computed<SolanaToken[]>(() =>
  ControllerModule.torus.nonFungibleTokens.filter((tok: SolanaToken) => selectedMints.value?.includes(`${tok?.mintAddress}`))
);

const isExpanded = ref<{ [mintAddress: string]: boolean }>({});

function transferToken(add: string) {
  router.push(`/wallet/transfer?mint=${add}`);
}
function nftSelected(mintAddress: string) {
  router.push(`/wallet/nfts?mints=${mintAddress}`);
  selectedMints.value = [mintAddress];
}

const breadcrumbData = computed(() => {
  const metaData = nfts.value[0]?.metaplexData?.offChainMetaData;
  return [{ text: "Home" }, { text: "NFTs" }, { text: metaData?.collection?.family || metaData?.symbol || "Unknown Token" }];
});
</script>
<template>
  <div class="flex flex-col justify-start items-start w-full py-2 pt-5">
    <BreadCrumb :bread-crumb-data="breadcrumbData" class="mb-4"></BreadCrumb>
    <NftSelect :selected-mint="nfts?.[0]?.mintAddress" @update:selected-mint-address="nftSelected($event)"></NftSelect>
    <div v-if="nfts.length" class="flex flex-wrap -mx-3 overflow-hidden sm:-mx-3 md:-mx-3 lg:-mx-3 xl:-mx-3 w-full pb-4 pt-1">
      <div v-for="nft in nfts" :key="nft.mintAddress" class="flex flex-row justify-start items-start flex-wrap nft-container">
        <NftCard
          v-if="!isExpanded[nft.mintAddress]"
          :mode="NFT_CARD_MODE.LARGE"
          :nft-token="nft"
          @card-clicked="isExpanded[nft.mintAddress] = true"
        ></NftCard>
        <NftCard
          v-if="isExpanded[nft.mintAddress]"
          :mode="NFT_CARD_MODE.EXPANDED"
          :nft-token="nft"
          @close-clicked="isExpanded[nft.mintAddress] = false"
          @transfer-clicked="transferToken(nft.mintAddress)"
        ></NftCard>
      </div>
    </div>
    <p v-else class="text-app-text-500 dark:text-app-text-dark-500 mt-6">We could not fetch the NFT details.</p>
  </div>
</template>
<style scoped>
.nft-container {
  padding-left: 10px;
  padding-right: 22px;
}
</style>

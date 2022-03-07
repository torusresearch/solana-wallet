<script setup lang="ts">
import { ChevronLeftIcon, GlobeAltIcon } from "@heroicons/vue/outline";
import { DotsHorizontalIcon } from "@heroicons/vue/solid";
import { NFTInfo, SolanaToken } from "@toruslabs/solana-controllers";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import FallbackNft from "@/assets/fallback-nft.svg";
import PaperAirplane from "@/assets/paper-airplane.svg";
import SolanaLogoURL from "@/assets/solana-dark.svg";
import SolanaLightLogoURL from "@/assets/solana-light.svg";
import { AccountMenu, AccountMenuList, AccountMenuMobile } from "@/components/nav";
import LanguageSelector from "@/components/nav/LanguageSelector.vue";
import ControllerModule from "@/modules/controllers";
import { NAVIGATION_LIST } from "@/utils/enums";
import { logoutWithBC, setFallbackImg } from "@/utils/helpers";

const router = useRouter();
const { t } = useI18n();
const tabs = NAVIGATION_LIST;
const user = computed(() => ControllerModule.torus.userInfo);
const selectedAddress = computed(() => ControllerModule.torus.selectedAddress);
const logout = async () => {
  await logoutWithBC();
};

const nftMetaData = ref<NFTInfo | undefined>(undefined);
const nfts = computed(() => ControllerModule.nonFungibleTokens);
const mint = ref<string>("");
const edition = ref<string | undefined>("");
const isLoading = ref<boolean>(true);
onMounted(async () => {
  mint.value = router.currentRoute.value.params.mint_address as string;
  const tokenInState = nfts.value.find((nft: SolanaToken) => nft.mintAddress === mint.value);
  if (tokenInState) {
    nftMetaData.value = tokenInState.metaplexData;
  } else {
    const metaData = await ControllerModule.getNFTmetadata(mint.value);
    nftMetaData.value = metaData;
    edition.value = (metaData?.offChainMetaData as any).edition;
  }
  isLoading.value = false;
});

const goBack = () => {
  router.back();
};

const viewNFT = () => {
  window.open(`https://solscan.io/token/${mint.value}`, "_blank");
};

const transferNFT = () => {
  router.push(`/wallet/transfer?mint=${mint.value}`);
};
</script>

<template>
  <div class="height-full flex flex-col bg-white dark:bg-app-gray-800">
    <nav class="bg-white dark:bg-app-gray-800 border-b border-gray-200 dark:border-transparent sticky top-0 z-30">
      <div class="flex h-16 px-4">
        <div class="flex-1 flex items-center mr-auto">
          <router-link to="/wallet/home">
            <img class="block h-4 w-auto" :src="ControllerModule.isDarkMode ? SolanaLightLogoURL : SolanaLogoURL" alt="Solana Logo" />
          </router-link>
        </div>
        <div v-if="selectedAddress && user.verifierId" class="flex flex-3">
          <div class="hidden md:-my-px md:mx-auto md:flex md:space-x-0">
            <router-link
              v-for="(value, key) in tabs"
              :key="key"
              :to="`/wallet/${value.route}`"
              :class="[
                key === 'nfts'
                  ? 'border-app-primary-500 text-app-primary-500'
                  : 'border-transparent text-gray-500 hover:border-gray-300 dark:hover:border-white hover:text-gray-700 dark:hover:text-white',
                'inline-flex items-center px-4 pt-1 border-b-2 text-sm font-medium',
              ]"
              aria-current="page"
              >{{ t(value.name) }}</router-link
            >
          </div>
        </div>
        <div v-if="selectedAddress && user.verifierId" class="hidden md:flex items-center flex-1 ml-auto justify-end">
          <LanguageSelector class="mr-2" /><AccountMenu :user="user"
            ><AccountMenuList :user="user" :selected-address="selectedAddress" @on-logout="logout"
          /></AccountMenu>
        </div>
        <div v-if="selectedAddress && user.verifierId" class="ml-6 flex md:hidden items-center">
          <AccountMenuMobile><AccountMenuList :user="user" :selected-address="selectedAddress" @on-logout="logout" /></AccountMenuMobile>
        </div>
      </div>
    </nav>
    <main v-if="nftMetaData" class="flex-1 relative">
      <div class="h-[380px] w-full absolute top-0 left-0 flex justify-center items-center overflow-hidden">
        <img
          alt="NFT"
          :src="nftMetaData.offChainMetaData?.image || FallbackNft"
          class="object-cover w-full h-full"
          @error="setFallbackImg($event.target, FallbackNft)"
        />
        <div class="h-full w-full bg-gray-800 backdrop-blur-lg bg-opacity-30 absolute top-0 left-0"></div>
      </div>
      <!-- content -->
      <div class="px-4 gt-xs:px-12 md:px-12 py-8 pb-6 relative flex flex-col items-center w-full h-full justify-center md:flex-row md:items-start">
        <div class="flex flex-col">
          <div class="flex justify-between px-2 py-4 w-full">
            <div class="cursor-pointer flex items-center" @click="goBack" @keydown="goBack">
              <ChevronLeftIcon class="text-app-text-dark-400 h-4 w-4 mr-2" />
              <span class="text-app-text-dark-400 text-base font-light">Back</span>
            </div>
            <DotsHorizontalIcon class="h-6 w-6 text-app-text-dark-400 cursor-pointer" />
          </div>
          <img
            alt="nft"
            :src="nftMetaData.offChainMetaData?.image || FallbackNft"
            class="h-[480px] w-[480px] object-cover overflow-hidden rounded-lg shadow-lg"
            @error="setFallbackImg($event.target, FallbackNft)"
          />
        </div>
        <div class="flex flex-col pt-4 md:pt-14 w-full md:w-[320px] ml-0 md:ml-10 pb-8">
          <div class="w-full flex flex-col">
            <div v-if="nftMetaData.offChainMetaData?.collection" class="flex items-center">
              <img
                alt="collection"
                :src="nftMetaData.offChainMetaData?.image || FallbackNft"
                class="h-5 w-5 object-cover rounded-full overflow-hidden mr-1"
                @error="setFallbackImg($event.target, FallbackNft)"
              />
              <span class="text-app-gray-500 md:text-app-text-dark-400 dark:text-app-text-dark-400 text-sm">{{
                nftMetaData.offChainMetaData?.collection?.name || ""
              }}</span>
            </div>
            <h1
              class="text-app-gray-700 md:text-app-text-dark-400 dark:text-app-text-dark-400 text-[26px] font-bold mt-2 truncate"
              :class="nftMetaData.offChainMetaData?.collection ? 'md:mt-2' : 'md:mt-6'"
            >
              {{ nftMetaData.offChainMetaData?.name || "" }}
            </h1>
            <p class="text-app-gray-600 md:text-app-text-dark-400 dark:text-app-text-dark-400 mt-4 text-sm h-20 truncate-multiline">
              {{ nftMetaData.offChainMetaData?.description || "" }}
            </p>
            <div
              class="w-full rounded-full py-2 flex justify-center items-center bg-app-primary-500 md:bg-white dark:bg-white mt-8 cursor-pointer"
              @click="transferNFT"
              @keydown="transferNFT"
            >
              <img alt="paper airplane" :src="PaperAirplane" class="mr-1 invert md:invert-0 dark:invert-0" />
              <span class="text-app-text-dark-400 md:text-black dark:text-black text-sm">Send</span>
            </div>
            <div
              class="rounded-full py-2 px-3 w-fit flex justify-center items-center bg-app-gray-800 bg-opacity-80 md:bg-opacity-20 md:bg-white dark:bg-white dark:bg-opacity-20 mt-3 cursor-pointer"
              @click="viewNFT"
              @keydown="viewNFT"
            >
              <GlobeAltIcon class="h-3 w-3 text-app-text-dark-400 mr-1" />
              <span class="text-app-text-dark-400 text-xs">View on Solscan</span>
            </div>
          </div>
          <div class="w-full flex flex-col mt-7">
            <div v-if="edition" class="flex flex-col space-y-1 mb-4">
              <span class="text-app-gray-500 text-base">Edition</span>
              <span class="text-app-text-dark-400 text-xl">#{{ edition }}</span>
            </div>
            <span v-if="(nftMetaData.offChainMetaData?.attributes?.length || 0) > 0" class="text-app-gray-500 text-base mb-2">Properties</span>
            <div v-if="(nftMetaData.offChainMetaData?.attributes?.length || 0) > 0" class="grid grid-cols-3 -ml-1">
              <div
                v-for="value in nftMetaData.offChainMetaData?.attributes"
                :key="value.trait_type"
                class="flex flex-col space-y-1 border-t-2 border-t-[#505154] m-1"
              >
                <span class="text-app-gray-700 dark:text-app-gray-500 text-xs truncate">{{ value?.trait_type || "" }}</span>
                <span class="text-app-gray-500 dark:text-app-text-dark-500 text-xs truncate">{{ value?.value || "" }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    <main v-else class="flex-1 relative p-8">
      <div class="w-full px-4 py-8 bg-app-gray-700 rounded-lg flex flex-col items-center space-y-2">
        <span class="text-app-text-dark-500 text-base text-center w-full inline-block">{{ isLoading ? "Loading..." : "Invalid Mint Address" }}</span>
        <div class="px-4 py-2 bg-app-primary-500 text-app-text-dark-400 rounded-md cursor-pointer" @click="goBack" @keydown="goBack">Back</div>
      </div>
    </main>
    <div
      v-if="selectedAddress && user.verifierId"
      class="md:hidden w-full h-12 flex flex-row align-center justify-around dark:bg-black bg-white border-t border-black fixed bottom-0"
    >
      <router-link
        v-for="(value, key) in tabs"
        :key="key"
        :to="`/wallet/${value.route}`"
        :aria-current="key === 'nfts' ? 'page' : undefined"
        :class="[value.mobHidden ? 'hidden' : 'block']"
      >
        <div class="flex flex-col h-full items-center justify-center select-none w-16 py-1" :class="[key === tab ? 'active-border' : '']">
          <img
            :src="value.icon"
            alt="link icon"
            class="h-5"
            :class="[key === 'nfts' ? (ControllerModule.isDarkMode ? 'item-white' : 'item-black') : 'item-gray opacity-90']"
          />
          <p
            class="text-xs text-center leading-none mt-1"
            :class="[key === 'nfts' ? (ControllerModule.isDarkMode ? 'item-white' : 'item-black') : 'item-gray opacity-90']"
          >
            {{ t(value.name) || "" }}
          </p>
        </div>
      </router-link>
    </div>
  </div>
</template>
<style scoped>
.truncate-multiline {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

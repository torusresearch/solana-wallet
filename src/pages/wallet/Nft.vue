<script setup lang="ts">
import { ChevronLeftIcon, GlobeAltIcon } from "@heroicons/vue/outline";
import { DotsHorizontalIcon } from "@heroicons/vue/solid";
import { NFTInfo, SolanaToken } from "@toruslabs/solana-controllers";
import { BroadcastChannel } from "broadcast-channel";
import log from "loglevel";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import PaperAirplane from "@/assets/paper-airplane.svg";
import SolanaLogoURL from "@/assets/solana-dark.svg";
import SolanaLightLogoURL from "@/assets/solana-light.svg";
import { AccountMenu, AccountMenuList, AccountMenuMobile } from "@/components/nav";
import LanguageSelector from "@/components/nav/LanguageSelector.vue";
import ControllerModule from "@/modules/controllers";
import { NAVIGATION_LIST } from "@/utils/enums";

const router = useRouter();
const { t } = useI18n();
const tabs = NAVIGATION_LIST;
const user = computed(() => ControllerModule.torus.userInfo);
const selectedAddress = computed(() => ControllerModule.torus.selectedAddress);
const logout = async () => {
  const bc = new BroadcastChannel("LOGOUT_WINDOWS_CHANNEL");
  bc.postMessage("logout");
  await ControllerModule.logout();
};

const nftMetaData = ref<NFTInfo | undefined>(undefined);
const nfts = computed(() => ControllerModule.nonFungibleTokens);
const mint = ref<string>("");
onMounted(async () => {
  mint.value = router.currentRoute.value.params.mint_address as string;
  const tokenInState = nfts.value.find((nft: SolanaToken) => nft.mintAddress === mint.value);
  if (tokenInState) {
    nftMetaData.value = tokenInState.metaplexData;
  } else {
    const metaData = await ControllerModule.getNFTmetadata(mint.value);
    nftMetaData.value = metaData;
  }
  log.info(nftMetaData.value);
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
  <div class="height-full flex flex-col bg-app-gray-800">
    <nav v-if="selectedAddress && user.verifierId" class="bg-app-gray-800 border-transparent sticky top-0 z-30">
      <div class="flex h-16 px-4">
        <div class="flex-1 flex items-center mr-auto">
          <router-link to="/wallet/home">
            <img class="block h-4 w-auto" :src="ControllerModule.isDarkMode ? SolanaLightLogoURL : SolanaLogoURL" alt="Solana Logo" />
          </router-link>
        </div>
        <div class="flex flex-3">
          <div class="hidden md:-my-px md:mx-auto md:flex md:space-x-0">
            <router-link
              v-for="(value, key) in tabs"
              :key="key"
              :to="`/wallet/${value.route}`"
              :class="[
                key === 'nfts'
                  ? 'border-app-primary-500 text-app-primary-500'
                  : 'border-transparent text-gray-500 hover:border-white  hover:text-white',
                'inline-flex items-center px-4 pt-1 border-b-2 text-sm font-medium',
              ]"
              aria-current="page"
              >{{ t(value.name) }}</router-link
            >
          </div>
        </div>
        <div class="hidden md:flex items-center flex-1 ml-auto justify-end">
          <LanguageSelector class="mr-2" /><AccountMenu :user="user"
            ><AccountMenuList :user="user" :selected-address="selectedAddress" @on-logout="logout"
          /></AccountMenu>
        </div>
        <div class="ml-6 flex md:hidden items-center">
          <AccountMenuMobile><AccountMenuList :user="user" :selected-address="selectedAddress" @on-logout="logout" /></AccountMenuMobile>
        </div>
      </div>
    </nav>
    <main v-if="nftMetaData" class="flex-1 relative">
      <div class="h-[55vh] w-full absolute top-0 left-0 flex justify-center items-center blur-lg overflow-hidden">
        <img alt="NFT" :src="nftMetaData.offChainMetaData.image" class="object-cover w-full h-full" />
        <div class="h-full w-full bg-gray-800 bg-opacity-30 absolute top-0 left-0"></div>
      </div>
      <div class="h-12 w-full absolute top-[55vh] left-0 bg-app-gray-800"></div>
      <div class="px-12 py-10 relative flex flex-col items-center w-full h-full justify-center gt-sm:flex-row gt-sm:items-start">
        <div class="flex flex-col">
          <div class="flex justify-between px-2 py-4 w-full">
            <div class="cursor-pointer flex items-center" @click="goBack" @keydown="goBack">
              <ChevronLeftIcon class="text-app-text-dark-400 h-4 w-4 mr-2" />
              <span class="text-app-text-dark-400 text-base font-light">Back</span>
            </div>
            <DotsHorizontalIcon class="h-6 w-6 text-app-text-dark-400 cursor-pointer" />
          </div>
          <img alt="nft" :src="nftMetaData.offChainMetaData.image" class="h-[480px] w-[480px] object-cover overflow-hidden rounded-lg shadow-lg" />
        </div>
        <div class="flex flex-col pt-14 w-[320px] ml-0 gt-xs:w-[400px] gt-sm:ml-10">
          <div class="w-full flex flex-col">
            <div class="flex items-center">
              <img alt="collection" :src="nftMetaData.offChainMetaData.image" class="h-5 w-5 object-cover rounded-full overflow-hidden mr-1" />
              <span class="text-app-text-dark-400 text-sm">{{ nftMetaData.offChainMetaData.collection.name }}</span>
            </div>
            <h1 class="text-app-text-dark-400 text-[26px] font-bold mt-6">{{ nftMetaData.offChainMetaData.name }}</h1>
            <p class="mt-4 text-app-text-dark-400 text-sm h-20 truncate-multiline">{{ nftMetaData.offChainMetaData.description }}</p>
            <div
              class="w-full rounded-full py-2 flex justify-center items-center bg-white mt-8 cursor-pointer"
              @click="transferNFT"
              @keydown="transferNFT"
            >
              <img alt="paper airplane" :src="PaperAirplane" class="mr-1" />
              <span class="text-black text-sm">Send</span>
            </div>
            <div
              class="rounded-full py-2 px-3 w-fit flex justify-center items-center bg-white bg-opacity-20 mt-3 cursor-pointer"
              @click="viewNFT"
              @keydown="viewNFT"
            >
              <GlobeAltIcon class="h-3 w-3 text-app-text-dark-400 mr-1" />
              <span class="text-app-text-dark-400 text-xs">View on Solscan</span>
            </div>
          </div>
          <div class="w-full flex flex-col mt-10">
            <div class="flex flex-col space-y-1">
              <span class="text-app-gray-500 text-xs">Edition</span>
              <span class="text-app-text-dark-400 text-xl">#13820/15000</span>
            </div>
            <span v-if="nftMetaData.offChainMetaData.attributes.length > 0" class="mt-7 text-app-gray-500 text-xs">Properties</span>
            <div v-if="nftMetaData.offChainMetaData.attributes.length > 0" class="grid grid-cols-3 mt-2 -ml-1">
              <div
                v-for="value in nftMetaData.offChainMetaData.attributes"
                :key="value.trait_type"
                class="flex flex-col space-y-1 border-t-2 border-t-[#505154] m-1"
              >
                <span class="text-app-gray-600 text-xs">{{ value.trait_type }}</span>
                <span class="text-app-text-dark-500 text-xs">{{ value.value }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    <main v-else class="flex-1 relative p-8">
      <div class="w-full px-4 py-8 bg-app-gray-700 rounded-lg flex flex-col items-center space-y-2">
        <span class="text-app-text-dark-500 text-base text-center w-full inline-block">Invalid Mint Address</span>
        <div class="px-4 py-2 bg-app-primary-500 text-app-text-dark-400 rounded-md cursor-pointer" @click="goBack" @keydown="goBack">Back</div>
      </div>
    </main>
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

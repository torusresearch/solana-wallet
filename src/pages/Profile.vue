<script lang="ts" setup>
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { SolanaToken } from "@toruslabs/solana-controllers";
import axios from "axios";
import base58 from "bs58";
import log from "loglevel";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

import SolanaLogoURL from "@/assets/solana-dark.svg";
import SolanaLightLogoURL from "@/assets/solana-light.svg";
import NftCard from "@/components/home/NftCard.vue";
import SplCard from "@/components/home/SplCard.vue";
import { AccountMenu, AccountMenuList, AccountMenuMobile } from "@/components/nav";
import LanguageSelector from "@/components/nav/LanguageSelector.vue";
import config from "@/config";
import ControllerModule from "@/modules/controllers";
import { NAVIGATION_LIST } from "@/utils/enums";

interface tokenInfo {
  isNative: boolean;
  mint: string;
  owner: string;
  state: string;
  tokenAmount: {
    amount: string;
    decimals: number;
    uiAmount: number;
    uiAmountString: string;
  };
}

const selectedAddress = computed(() => ControllerModule.torus.selectedAddress);
const user = computed(() => ControllerModule.torus.userInfo);
const tabs = NAVIGATION_LIST;
const router = useRouter();
const { t } = useI18n();

const logout = async () => {
  const bc = new BroadcastChannel("LOGOUT_WINDOWS_CHANNEL");
  bc.postMessage("logout");
  await ControllerModule.logout();
};
const address = ref<string>();
const nfts = ref<SolanaToken[]>([]);
const splTokens = ref<SolanaToken[]>([]);
const userBalance = ref<number>(0);
const loadingSPL = ref<boolean>(true);
const loadingNFT = ref<boolean>(true);
onMounted(async () => {
  const param_address = router.currentRoute.value.params.address as string;
  const parsed_address = await ControllerModule.getSNSAddress({
    type: "sns",
    address: param_address,
  });
  if (parsed_address) {
    address.value = parsed_address;
  } else {
    try {
      const pubKey = base58.decode(param_address); // to check if address is valid pubkey
      if (pubKey.length !== 32) throw new Error(); // to check if address is valid pubkey
      address.value = param_address;
    } catch (e) {
      router.push("/");
      return;
    }
  }
  const { connection } = ControllerModule;
  userBalance.value = (await connection.getBalance(new PublicKey(address.value))) ?? 0;
  let accs;
  let splMints: tokenInfo[] = [];
  let nftMints: tokenInfo[] = [];
  try {
    accs = await connection.getParsedTokenAccountsByOwner(new PublicKey(address.value), {
      programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
    });
    accs.value.forEach(({ account }) => {
      if (account.data.parsed.info.tokenAmount.decimals === 0) nftMints.push(account.data.parsed.info);
      else splMints.push(account.data.parsed.info);
    });
  } catch (error) {
    return;
  }
  try {
    // not guaranteed to have info for all mint_addresses
    const splInfo = (
      await axios.post(`${config.api}/tokeninfo`, {
        mint_addresses: splMints.map((e) => e.mint),
      })
    ).data;
    splMints = splMints.filter(({ mint, tokenAmount }) => !!splInfo[mint] && tokenAmount.uiAmount !== 0);
    // not guaranteed to have coingeckoId for every token
    const coinGeckoIds = Object.keys(splInfo).map((key) => splInfo[key]?.extensions?.coingeckoId);
    const priceInfo = (
      await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoIds.toString()}&vs_currencies=${config.supportedCurrencies
          .map((e) => e.toLowerCase())
          .toString()}`
      )
    ).data;
    splTokens.value = splMints.map((spl) => ({
      balance: spl.tokenAmount,
      tokenAddress: spl.mint,
      mintAddress: spl.mint,
      data: splInfo?.[spl.mint] ?? {},
      price: priceInfo?.[splInfo?.[spl.mint]?.extensions?.coingeckoId] ?? {},
      isFungible: true,
    }));
    loadingSPL.value = false;
  } catch (error) {
    log.error(error);
  }
  try {
    const nftPromises = nftMints.map((nft) => ControllerModule.getNFTmetadata(nft.mint));
    let nftMetadata = (await Promise.allSettled(nftPromises)).map((val) => {
      if (val.status === "fulfilled") return val.value;
      return undefined;
    });
    nftMints = nftMints.filter((_, index) => !!nftMetadata[index]);
    nftMetadata = nftMetadata.filter((e) => !!e);
    nfts.value = nftMints.map((nft, index) => ({
      balance: nft.tokenAmount,
      tokenAddress: nft.mint,
      mintAddress: nft.mint,
      metaplexData: nftMetadata[index],
      isFungible: false,
    }));
    loadingNFT.value = false;
  } catch (error) {
    log.error(error);
  }
});

const navigateNFT = (mintAddress: string) => {
  router.push(`/wallet/nfts/${mintAddress}`);
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
              class="border-transparent text-gray-500 hover:border-gray-300 dark:hover:border-white hover:text-gray-700 dark:hover:text-white inline-flex items-center px-4 pt-1 border-b-2 text-sm font-medium"
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
    <main class="flex-1 flex-col relative px-4 sm:px-12 py-4">
      <div class="w-full ml-2 flex items-center justify-start flex-wrap">
        <div class="w-fit p-4 bg-purple-600 flex items-center justify-center rounded-md shadow-md mr-4 mt-2">
          <span class="text-app-text-dark-400 break-all">Balance: {{ (userBalance / LAMPORTS_PER_SOL).toFixed(4) }} SOL</span>
        </div>
        <div class="w-fit p-4 bg-purple-600 flex items-center justify-center rounded-md shadow-md mr-4 mt-2">
          <span class="text-app-text-dark-400 break-all">Address: {{ address }}</span>
        </div>
      </div>
      <h2 class="text-app-gray-600 dark:text-app-text-dark-400 ml-2 mt-10 text-2xl">SPL Tokens</h2>
      <div v-if="loadingSPL" class="w-full bg-app-gray-300 dark:bg-app-gray-700 text-app-text-dark-400 p-4 rounded-lg shadow-md mt-2">
        <span>Loading SPL Tokens...</span>
      </div>
      <div v-else class="w-full mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 items-center justify-items-center">
        <div v-for="token in splTokens" :key="token.mintAddress" class="w-full p-2">
          <SplCard :spl-token="token" class="w-full" />
        </div>
      </div>
      <h2 class="text-app-gray-600 dark:text-app-text-dark-400 ml-2 mt-10 text-2xl">NFTs</h2>
      <div v-if="loadingNFT" class="w-full bg-app-gray-300 dark:bg-app-gray-700 text-app-text-dark-400 p-4 rounded-lg shadow-md mt-2">
        <span>Loading NFTs...</span>
      </div>
      <div v-else class="w-full mt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 items-center justify-items-center">
        <NftCard v-for="nft in nfts" :key="nft.mintAddress" :nft-token="nft" @card-clicked="navigateNFT(nft.mintAddress)" />
      </div>
    </main>
  </div>
</template>

<style scoped></style>

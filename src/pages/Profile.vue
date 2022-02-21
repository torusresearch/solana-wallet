<script lang="ts" setup>
import { PublicKey } from "@solana/web3.js";
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
const nfts = ref<SolanaToken>([]);
const splTokens = ref<SolanaToken>([]);
const userBalance = ref<number>(0);
onMounted(async () => {
  const param_address = router.currentRoute.value.params.address as string;
  const parsed_address = await ControllerModule.getSNSAddress({ type: "sns", address: param_address });
  if (parsed_address) {
    address.value = parsed_address;
  } else {
    try {
      base58.decode(param_address); // to check if address is valid pubkey
      address.value = param_address;
    } catch (e) {
      router.push("/");
      return;
    }
  }
  const { connection } = ControllerModule;
  userBalance.value = await connection.getBalance(new PublicKey(address.value));
  const accs = await connection.getParsedTokenAccountsByOwner(new PublicKey(address.value), {
    programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
  });
  const nftMints: tokenInfo[] = [];
  const splMints: tokenInfo[] = [];
  accs.value.forEach(({ account }) => {
    if (account.data.parsed.info.tokenAmount.decimals === 0) nftMints.push(account.data.parsed.info);
    else splMints.push(account.data.parsed.info);
  });
  const splInfo = (
    await axios.post(`${config.api}/tokeninfo`, {
      mint_addresses: splMints.map((e) => e.mint),
    })
  ).data;
  log.info(splInfo);
  const coinGeckoIds = Object.keys(splInfo).map((key) => splInfo[key].extensions.coingeckoId);
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
    data: splInfo[spl.mint],
    price: priceInfo[splInfo[spl.mint].extensions.coingeckoId],
    isFungible: true,
  }));
  const nftPromises = nftMints.map((nft) => ControllerModule.getNFTmetadata(nft.mint));
  const nftMetadata = await Promise.all(nftPromises);
  nfts.value = nftMints.map((nft, index) => ({
    balance: nft.tokenAmount,
    tokenAddress: nft.mint,
    mintAddress: nft.mint,
    metaplexData: nftMetadata[index],
    isFungible: false,
  }));
  log.info(nfts.value, splTokens.value, userBalance.value);
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
    <main class="flex-1 relative">
      <div class="w-full mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 items-center justify-items-center">
        <NftCard v-for="nft in nfts" :key="nft.mintAddress" :nft-token="nft" @card-clicked="navigateNFT(nft.mintAddress)" />
      </div>
    </main>
  </div>
</template>

<style scoped></style>

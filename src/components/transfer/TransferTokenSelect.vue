<script setup lang="ts">
import { Listbox, ListboxButton, ListboxLabel, ListboxOption, ListboxOptions } from "@headlessui/vue";
import { ChevronBottomIcon } from "@toruslabs/vue-icons/arrows";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import FallbackNft from "@/assets/nft.png";
import NftLogo from "@/assets/nft_token.svg";
import SolTokenLogo from "@/assets/sol_token.svg";
import solicon from "@/assets/solana-mascot.svg";
import { setFallbackImg } from "@/utils/helpers";
import { SolAndSplToken } from "@/utils/interfaces";
import { getClubbedNfts } from "@/utils/solanaHelpers";

import { getTokenFromMint, nftTokens, tokens } from "./token-helper";

const props = withDefaults(
  defineProps<{
    selectedToken: Partial<SolAndSplToken>;
  }>(),
  {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    selectedToken: tokens.value[0],
  }
);
const { t } = useI18n();
const localToken = ref(props.selectedToken);
const emits = defineEmits(["update:selectedToken"]);

watch(localToken, () => {
  emits("update:selectedToken", localToken.value);
});
</script>
<template>
  <Listbox v-model="localToken" as="div">
    <ListboxLabel class="text-sm text-app-text-600 dark:text-app-text-dark-500">{{ t("walletTransfer.selectItem") }}</ListboxLabel>
    <div class="mt-1 relative">
      <ListboxButton class="bg-white dark:bg-app-gray-800 select-container shadow-inner dark:shadow-none rounded-md w-full px-3">
        <span class="flex items-center">
          <img :src="selectedToken.iconURL" alt="selected token" class="h-6 w-6 object-cover" @error="setFallbackImg($event.target, solicon)" />
          <span class="ml-3 truncate text-app-text-600 dark:text-app-text-dark-500">
            {{ selectedToken.name || selectedToken?.metaplexData?.offChainMetaData?.name }}
          </span>
        </span>
        <span class="absolute inset-y-0 right-2 flex items-center pointer-events-none">
          <ChevronBottomIcon class="h-4 w-4 text-gray-400" aria-hidden="true" />
        </span>
      </ListboxButton>

      <ListboxOptions
        class="absolute z-20 mt-1 w-full bg-white dark:bg-app-gray-800 shadow-lg max-h-56 rounded-md py-1 text-base ring-1 ring-app-gray-400 dark:ring-transparent overflow-auto outline-none focus:outline-none sm:text-sm"
      >
        <ListboxOption :key="'tokenstring'" as="template" :value="undefined" :disabled="true">
          <li class="option-separator">
            <img class="h-4 w-auto object-cover" :src="SolTokenLogo" alt="Tokens" />
            <p class="ml-2 text-sm text-app-text-400 dark:text-app-text-dark-400">
              {{ t("walletTransfer.tokens") }}
            </p>
          </li>
        </ListboxOption>
        <ListboxOption v-for="item in tokens" v-slot="{ selected }" :key="item.name" as="template" :value="item">
          <li :class="['cursor-pointer select-none relative py-2 px-9 text-app-text-600 dark:text-app-text-dark-500']">
            <div class="flex items-center">
              <img :src="item?.iconURL" class="h-6 w-6 object-cover" alt="iconURI" @error="setFallbackImg($event.target, solicon)" />
              <span :class="[selected ? 'font-semibold' : 'font-normal', 'ml-3 truncate']" class="token-name">
                <p>{{ item?.name }} ({{ item?.symbol }})</p>
                <p class="text-app-gray-500">
                  {{ item?.symbol === "SOL" ? "" : "SPL" }}
                </p></span
              >
            </div>
          </li>
        </ListboxOption>
        <li class="option-separator">
          <img class="h-4 object-cover" :src="NftLogo" alt="Tokens" />
          <p class="ml-2 text-sm text-app-text-400 dark:text-app-text-dark-400">NFTS</p>
        </li>
        <template v-for="item in getClubbedNfts(nftTokens)" :key="item.title">
          <li class="py-2 px-9">
            <p class="text-sm text-app-text-400 dark:text-app-text-dark-400">{{ item.title }} ({{ item.count }})</p>
          </li>
          <ListboxOption
            v-for="mintAddress in item.mints"
            v-slot="{ selected }"
            :key="mintAddress"
            as="template"
            :value="getTokenFromMint(nftTokens, mintAddress)"
          >
            <li :class="['cursor-pointer select-none relative py-2 pl-9 pr-9 text-app-text-600 dark:text-app-text-dark-500 ml-4']">
              <div class="flex items-center">
                <img
                  :src="getTokenFromMint(nftTokens, mintAddress)?.iconURL"
                  class="h-6 w-6 object-cover"
                  alt="iconURI"
                  @error="setFallbackImg($event.target, FallbackNft)"
                />
                <span :class="[selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate']" class="token-name">
                  <p>{{ getTokenFromMint(nftTokens, mintAddress)?.name }} ({{ getTokenFromMint(nftTokens, mintAddress)?.symbol }})</p>
                </span>
              </div>
            </li>
          </ListboxOption>
        </template>
      </ListboxOptions>
    </div>
  </Listbox>
</template>

<style scoped>
.select-container {
  height: 54px;
}
.option-separator {
  @apply flex flex-row items-center justify-start ml-3 h-12;
}
.token-name {
  @apply flex w-full flex-row justify-between;
}
</style>

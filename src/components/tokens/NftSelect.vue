<script setup lang="ts">
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/vue";
import { ChevronBottomIcon } from "@toruslabs/vue-icons/arrows";
import { computed, ref, watch } from "vue";

import { getTokenFromMint, nftTokens } from "@/components/transfer/token-helper";
import { getClubbedNfts } from "@/utils/helpers";

const props = withDefaults(
  defineProps<{
    selectedMint: string;
  }>(),
  {
    selectedMint: "",
  }
);
const selectedNft = computed(() => getTokenFromMint(nftTokens.value, props.selectedMint));

const localMintAddress = ref(props.selectedMint);
const emits = defineEmits(["update:selectedMintAddress"]);
watch(localMintAddress, () => {
  emits("update:selectedMintAddress", localMintAddress.value);
});
</script>
<template>
  <Listbox v-model="localMintAddress" as="div" class="w-full lg:w-1/2">
    <div class="mt-1 relative">
      <ListboxButton class="bg-white dark:bg-app-gray-700 select-container shadow-inner dark:shadow-none rounded-md w-full px-3">
        <span v-if="selectedNft?.metaplexData?.offChainMetaData" class="flex items-center">
          <div class="shrink-0 h-6 w-6 rounded-full img-loader-container">
            <img :src="selectedNft?.metaplexData?.offChainMetaData?.image" alt="selected token" class="shrink-0 h-6 w-6 rounded-full" />
          </div>
          <span class="ml-3 block truncate text-app-text-600 dark:text-app-text-dark-500">
            {{ selectedNft?.metaplexData?.offChainMetaData?.name }}
          </span>
        </span>
        <span class="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronBottomIcon class="h-4 w-4 text-gray-400" aria-hidden="true" />
        </span>
      </ListboxButton>

      <transition leave-active-class="transition ease-in duration-100" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <ListboxOptions
          class="absolute z-10 mt-1 w-full bg-white dark:bg-app-gray-800 shadow-lg max-h-56 rounded-md py-1 text-base ring-1 ring-app-gray-400 dark:ring-transparent overflow-auto outline-none focus:outline-none sm:text-sm"
        >
          <template v-for="item in getClubbedNfts(nftTokens)" :key="item.title">
            <li class="option-separator ml-2 pl-1">
              <p class="ml-2 text-sm text-app-text-400 dark:text-app-text-dark-400">{{ item.collectionName }} ({{ item.count }})</p>
            </li>
            <ListboxOption v-for="mintAddress in item.mints" v-slot="{ active, selected }" :key="mintAddress" as="template" :value="mintAddress">
              <li
                :class="[
                  active ? 'bg-app-gray-200' : '',
                  'cursor-pointer select-none relative py-2 pl-9 pr-9 text-app-text-600 dark:text-app-text-dark-500  dark:hover:text-app-text-600 ml-4',
                ]"
              >
                <div class="flex items-center">
                  <div class="shrink-0 h-6 w-6 rounded-full img-loader-container">
                    <img :src="getTokenFromMint(nftTokens, mintAddress)?.iconURL" class="shrink-0 h-6 w-6 rounded-full" alt="iconURI" />
                  </div>
                  <span :class="[selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate']" class="coin-name">
                    <p>{{ getTokenFromMint(nftTokens, mintAddress)?.name }}</p>
                  </span>
                </div>
              </li>
            </ListboxOption>
          </template>
        </ListboxOptions>
      </transition>
    </div>
  </Listbox>
</template>

<style scoped>
.select-container {
  height: 54px;
}
.option-separator {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  margin-left: 13px;
  height: 45px;
}
</style>

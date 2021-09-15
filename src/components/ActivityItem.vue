<script setup lang="ts">
import { ref } from "vue";

import { Button, NetworkDisplay } from "@/components/common";

const showDetails = ref(false);
const toggleDetails = () => {
  showDetails.value = !showDetails.value;
};
</script>
<template>
  <div
    class="
      w-full
      bg-white
      dark:bg-app-gray-700
      border border-app-gray-400
      dark:border-transparent
      shadow
      dark:shadow-dark
      rounded-md
      p-4
      grid grid-cols-12
      cursor-pointer
    "
    @click="toggleDetails()"
  >
    <div class="col-span-1 border-r">
      <div class="font-body text-xs font-medium text-app-text-600 dark:text-app-text-dark-500">22 Apr 2021</div>
      <div class="font-body text-xxs text-app-text-400 dark:text-app-text-dark-600">16:40:17</div>
    </div>
    <div class="col-span-6 pl-6">
      <div class="flex">
        <div>
          <img class="h-9" src="https://images.toruswallet.io/eth.svg" alt />
        </div>
        <div class="text-left ml-4">
          <div class="font-body text-xs font-medium text-app-text-600 dark:text-app-text-dark-500">Received ETH</div>
          <div class="font-body text-xxs text-app-text-400 dark:text-app-text-dark-600">from 0xA90...93407</div>
        </div>
      </div>
    </div>
    <div class="col-span-3">
      <div class="font-body text-xs font-medium text-app-text-600 dark:text-app-text-dark-500">0.01 ETH</div>
      <div class="font-body text-xxs text-app-text-400 dark:text-app-text-dark-600">24.18 USD</div>
    </div>
    <div class="col-span-2 text-right">
      <div class="rounded-xl inline-block bg-green-300 text-xs text-center py-1 px-5">Successful</div>
    </div>
    <div v-if="showDetails" class="col-span-12 text-xs text-app-text-600 dark:text-app-text-dark-500 pt-4">
      <div class="grid grid-cols-8 py-1">
        <div class="col-span-1">
          Started at
          <div class="float-right pr-4">:</div>
        </div>
        <div class="col-span-2">16:48:17 - 22 Apr 2021</div>
      </div>
      <div class="grid grid-cols-8 py-1">
        <div class="col-span-1 pr-4">
          Receive from
          <div class="float-right">:</div>
        </div>
        <div class="col-span-2">0xA902444A4194e0e065baEFc52490637fe8593407</div>
      </div>
      <div class="grid grid-cols-8 py-1">
        <div class="col-span-1 pr-4">
          Rate
          <div class="float-right">:</div>
        </div>
        <div class="col-span-2">1 ETH = 2418.04 USD</div>
      </div>
      <div class="grid grid-cols-8 py-1">
        <div class="col-span-1 pr-4">
          Amount
          <div class="float-right">:</div>
        </div>
        <div class="col-span-2">0.01 ETH /24.18 USD</div>
      </div>
      <div class="grid grid-cols-8 py-1">
        <div class="col-span-1 pr-4">
          Network
          <div class="float-right">:</div>
        </div>
        <div class="col-span-2 text-app-text-500 dark:text-app-text-500"><NetworkDisplay /></div>
      </div>
      <div class="pt-4">
        <Button class="ml-auto" variant="tertiary" size="small">View on etherscan</Button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>

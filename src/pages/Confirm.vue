<script setup lang="ts">
import { WiFiIcon } from "@toruslabs/vue-icons/connection";
import { computed, ref } from "vue";

import SolanaLogoURL from "@/assets/solana-dark.svg";
import SolanaLightLogoURL from "@/assets/solana-light.svg";
import { Button, TextField } from "@/components/common";
import { app } from "@/modules/app";

const sendAmount = ref(0);
const transactionFee = ref(0);
const total = computed(() => 0);
</script>

<template>
  <div class="bg-white min-h-screen dark:bg-app-gray-700">
    <div class="items-center">
      <div class="shadow dark:shadow-dark text-center py-6">
        <div><img class="h-7 mx-auto w-auto mb-1" :src="app.isDarkMode ? SolanaLightLogoURL : SolanaLogoURL" alt="Casper Logo" /></div>
        <div class="font-header text-lg font-bold text-app-text-500 dark:text-app-text-dark-500">Confirm Transaction</div>
      </div>
      <div class="p-5">
        <div class="flex items-center">
          <div class="pl-5 flex-none">
            <div class="flex justify-center border border-app-gray-400 dark:border-transparent shadow dark:shadow-dark2 rounded-full w-12 h-12">
              <img class="w-6" src="https://app.tor.us/v1.13.2/img/login-facebook.14920ebc.svg" alt="" />
            </div>
          </div>
          <div class="flex-grow">
            <hr />
          </div>
          <div class="pr-5 flex-none">
            <div class="flex justify-center border border-app-gray-400 dark:border-transparent shadow dark:shadow-dark2 rounded-full w-12 h-12">
              <img class="w-6" src="https://app.tor.us/v1.13.2/img/login-facebook.14920ebc.svg" alt="" />
            </div>
          </div>
        </div>
        <div class="flex mt-1">
          <div class="flex-none w-20 text-center">
            <div class="overflow-ellipsis truncate text-xxs text-app-text-500 dark:text-app-text-dark-500">tom@gmail.com</div>
            <div class="overflow-ellipsis truncate text-xxs text-app-text-500 dark:text-app-text-dark-500">
              0x0F48654993568658514F982C87A5BDd01D80969F
            </div>
          </div>
          <div class="flex-grow text-xs text-app-text-500 dark:text-app-text-dark-500 flex items-center justify-center -mt-14">
            <WiFiIcon class="w-3 h-3 mr-1" /> Casper Network
          </div>
          <div class="flex-none w-20 text-center">
            <div class="overflow-ellipsis truncate text-xxs text-app-text-500 dark:text-app-text-dark-500">tom@gmail.com</div>
            <div class="overflow-ellipsis truncate text-xxs text-app-text-500 dark:text-app-text-dark-500">
              0x0F48654993568658514F982C87A5BDd01D80969F
            </div>
          </div>
        </div>
        <hr class="my-5" />
        <div>
          <div class="grid grid-cols-3 items-center mb-4">
            <div class="col-span-1 font-body text-xs text-app-text-600 dark:text-app-text-dark-500">Amount</div>
            <div class="col-span-2"><TextField v-model="sendAmount" type="number" /></div>
          </div>
          <div class="grid grid-cols-3 items-center mb-4">
            <div class="col-span-1 font-body text-xs text-app-text-600 dark:text-app-text-dark-500">Transaction Fee</div>
            <div class="col-span-2"><TextField v-model="transactionFee" type="number" /></div>
          </div>
          <hr class="mb-6" />
          <div class="grid grid-cols-3 items-center mb-4">
            <div class="col-span-1 font-body text-xs text-app-text-600 dark:text-app-text-dark-500">Total Cost</div>
            <div class="col-span-2"><TextField v-model="total" disabled type="number" /></div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 m-6">
        <div><Button class="ml-auto" block variant="tertiary">Cancel</Button></div>
        <div><Button class="ml-auto" block variant="primary">Confirm</Button></div>
      </div>
    </div>
  </div>
</template>

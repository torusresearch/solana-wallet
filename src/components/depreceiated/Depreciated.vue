<script setup lang="ts">
import { XIcon } from "@heroicons/vue/solid";

import StartLogo from "@/assets/star.svg";

const props = defineProps({
  useNewContent: {
    type: Boolean,
    default: false,
  },
});

const redirect = (redirectUrl: string) => {
  window.open(redirectUrl, "_blank");
};
</script>

<template>
  <div :class="['flex justify-center items-center bg-gray-900', useNewContent ? 'min-h-screen' : 'min-h-[222px] rounded-3xl']">
    <div class="relative text-center rounded-lg px-6 w-full max-w-md text-white shadow-lg">
      <!-- Title with Icon and Close Button -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center">
          <img class="h-6 w-6 mr-2" :src="StartLogo" alt="Star Logo" />
          <h1 class="text-xl font-bold text-gray-50">Torus Solana Wallet Upgrade</h1>
        </div>
        <button v-if="!props.useNewContent" type="button" class="absolute -top-4 right-4" @click="$emit('close')">
          <XIcon class="w-4 h-4 text-app-gray-50 dark:text-gray-50 text-opacity-70 hover:text-opacity-100" />
        </button>
      </div>

      <!-- Main Text -->
      <p class="mb-4 text-sm font-normal text-gray-300">
        We are currently upgrading the Torus Solana Wallet for a better experience. You may still access your funds at
        <a href="https://solana.tor.us" class="text-blue-500" @click="redirect('https://solana.tor.us')"> solana.tor.us </a>
        directly.
      </p>

      <!-- Apology & Community Forum -->
      <p class="text-sm font-normal text-gray-300">
        We apologize for any inconvenience. For assistance, visit our
        <a href="https://web3auth.io/community" class="text-blue-500" @click="redirect('https://web3auth.io/community')"> Community Forum </a>.
      </p>
    </div>
  </div>
</template>

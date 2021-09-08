<script setup lang="ts">
import { DocumentAddIcon } from "@heroicons/vue/outline";
import WalletTabs from "@/components/WalletTabs.vue";
</script>

<template>
  <WalletTabs tab="activity">
    <div class="text-center py-2">
      <DocumentAddIcon class="mx-auto mt-8 h-12 w-12 text-gray-400 stroke-1" />
      <h3 class="mt-2 text-sm font-medium text-gray-900">No activity</h3>
      <p class="mt-1 text-sm text-gray-500">
        Top up or transfer funds to your wallet to see activity here
      </p>
      <!-- <div class="mt-6 flex flex-col items-center">
        <div class="flex flex-col items-stretch space-y-4">
          <router-link
            to="/wallet/topup"
            class="
              inline-flex
              items-center
              px-4
              py-2
              border border-transparent
              shadow-sm
              text-sm
              font-medium
              rounded-md
              text-white
              bg-indigo-600
              hover:bg-indigo-700
              focus:outline-none
              focus:ring-2
              focus:ring-offset-2
              focus:ring-indigo-500
            "
          >
            <PlusIcon class="-ml-1 mr-2 h-5 w-5" aria-hidden />
            Top up
          </router-link>
          <router-link
            to="/wallet/transfer"
            class="
              inline-flex
              items-center
              px-4
              py-2
              border border-transparent
              shadow-sm
              text-sm
              font-medium
              rounded-md
              text-white
              bg-indigo-600
              hover:bg-indigo-700
              focus:outline-none
              focus:ring-2
              focus:ring-offset-2
              focus:ring-indigo-500
            "
          >
            <SwitchHorizontalIcon class="-ml-1 mr-2 h-5 w-5" aria-hidden />
            Transfer
          </router-link>
        </div>
      </div> -->
    </div>
  </WalletTabs>
</template>

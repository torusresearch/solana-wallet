<script setup lang="ts">
import { ACTIVITY_STATUS_CANCELLED, ACTIVITY_STATUS_SUCCESSFUL, ACTIVITY_STATUS_UNSUCCESSFUL } from "@toruslabs/base-controllers";
import { SolanaTransactionActivity } from "@toruslabs/solana-controllers";
import { computed, ref } from "vue";

import SolanaLogoURL from "@/assets/solana-mascot.svg";
import SolanaLightLogoURL from "@/assets/solana-mascot.svg";
import { Button, NetworkDisplay } from "@/components/common";
import ControllersModule from "@/modules/controllers";
defineProps<{
  activity: SolanaTransactionActivity;
}>();

const selectedNetworkDisplayName = computed(() => ControllersModule.selectedNetworkDisplayName);
const showDetails = ref(false);

const toggleDetails = (link: string) => {
  showDetails.value = !showDetails.value;
  window.open(link, "_blank");
};
const getTxStatusColor = (status: string): string => {
  if (status === ACTIVITY_STATUS_SUCCESSFUL) return "#9BE8C7";
  if (status === ACTIVITY_STATUS_UNSUCCESSFUL || status === ACTIVITY_STATUS_CANCELLED) return "#FEA29F";
  return "#E0E0E0";
};

const openExplorerLink = (link: string) => {
  window.open(link, "_blank");
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
      gap-2
      cursor-pointer
    "
    @click="toggleDetails(activity.blockExplorerUrl)"
  >
    <div class="col-span-6 order-3 sm:order-1 sm:col-span-1 sm:border-r pl-9 sm:pl-0">
      <div class="font-body text-xxs text-app-text-400 dark:text-app-text-dark-600">{{ (activity.updated_at || 0) * 1000 }}</div>
    </div>
    <div class="col-span-6 order-1 sm:order-2 pl-0 sm:pl-6">
      <div class="flex">
        <div>
          <!-- <img class="block h-7 w-auto" :src="ControllersModule.isDarkMode ? CasperLightLogoURL : CasperLogoURL" alt="Casper Logo" /> -->
          <img class="block h-7 w-auto" :src="true ? SolanaLightLogoURL : SolanaLogoURL" alt="Casper Logo" />
        </div>
        <div class="text-left ml-4 break-words">
          <div v-if="activity.type" class="font-body text-xs font-medium text-app-text-600 dark:text-app-text-dark-600">
            {{ activity.send ? "Send " : "Received " }} {{ activity.totalAmountString }} Sol
            <span class="font-body text-xxs text-app-text-400 dark:text-app-text-dark-600">{{ activity.send ? "to " : "from " }}</span>
          </div>
          <div v-if="activity.type" class="font-body text-xxs text-app-text-400 dark:text-app-text-dark-600 break-words">
            {{ activity.send ? activity.to : activity.from }}
          </div>
          <div class="font-body text-xxs text-app-text-400 dark:text-app-text-dark-600">Slot {{ activity.slot }}</div>
          <div v-if="!activity.type" class="font-body text-xxs text-app-text-400 dark:text-app-text-dark-600 break-all">{{ activity.signature }}</div>
        </div>
      </div>
    </div>
    <div class="col-span-6 sm:col-span-3 order-2 sm:order-3 text-right sm:text-left">
      <div class="font-body text-xs font-medium text-app-text-600 dark:text-app-text-dark-500">{{ activity.totalAmountString }}</div>
      <div class="font-body text-xxs text-app-text-400 dark:text-app-text-dark-600">Sol</div>
      <!-- <div class="font-body text-xxs text-app-text-400 dark:text-app-text-dark-600">{{ activity.currencyAmountString }}</div> -->
    </div>
    <div class="col-span-6 sm:col-span-2 text-right order-4">
      <div class="rounded-xl inline-block bg-green-300 text-xs text-center py-1 px-5" :style="{ backgroundColor: getTxStatusColor(activity.status) }">
        {{ activity.status }}
      </div>
    </div>
    <!-- <div v-if="showDetails" class="col-span-12 order-5 text-xs text-app-text-600 dark:text-app-text-dark-500 pt-4">
      <div class="grid grid-cols-8 py-1">
        <div class="col-span-3 sm:col-span-1">
          Started at
          <div class="float-right pr-4">:</div>
        </div>
        <div class="col-span-5 sm:col-span-2">{{ activity.timeFormatted }} - {{ activity.dateFormatted }}</div>
      </div>
      <div class="grid grid-cols-8 py-1">
        <div class="col-span-3 sm:col-span-1 pr-4">
          Sent To
          <div class="float-right">:</div>
        </div>
        <div class="col-span-5 sm:col-span-2 break-words">{{ activity.to }}</div>
      </div>
      <div class="grid grid-cols-8 py-1">
        <div class="col-span-3 sm:col-span-1 pr-4">
          Rate
          <div class="float-right">:</div>
        </div>
        <div class="col-span-5 sm:col-span-2">{{ activity.rate }}</div>
      </div>
      <div class="grid grid-cols-8 py-1">
        <div class="col-span-3 sm:col-span-1 pr-4">
          Amount
          <div class="float-right">:</div>
        </div>
        <div class="col-span-5 sm:col-span-2">{{ activity.totalAmountString }} / {{ activity.currencyAmountString }}</div>
      </div>
      <div class="grid grid-cols-8 py-1">
        <div class="col-span-3 sm:col-span-1 pr-4">
          Network
          <div class="float-right">:</div>
        </div>
        <div class="col-span-5 sm:col-span-1 text-app-text-500 dark:text-app-text-500">
          <NetworkDisplay :network="selectedNetworkDisplayName" />
        </div>
      </div>
      <div class="pt-4">
        <Button class="ml-auto" variant="tertiary" size="small" @click.stop="(e) => openExplorerLink(activity.explorerLink)"
          >View on CSPR live</Button
        >
      </div>
    </div> -->
  </div>
</template>

<style scoped></style>

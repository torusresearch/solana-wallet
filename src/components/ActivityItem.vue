<script setup lang="ts">
import { ACTIVITY_STATUS_CANCELLED, ACTIVITY_STATUS_SUCCESSFUL, ACTIVITY_STATUS_UNSUCCESSFUL } from "@toruslabs/base-controllers";
import { SolanaTransactionActivity } from "@toruslabs/solana-controllers";
import dateFormat from "dateformat";

// import { ref } from "vue";
import SolanaLogoURL from "@/assets/solana-mascot.svg";
// import ControllersModule from "@/modules/controllers";
defineProps<{
  activity: SolanaTransactionActivity;
}>();

// const selectedNetworkDisplayName = computed(() => ControllersModule.selectedNetworkDisplayName);
// const showDetails = ref(false);

const openExplorerLink = (link: string) => {
  window.open(link, "_blank");
};
const toggleDetails = (link: string) => {
  // showDetails.value = !showDetails.value;
  openExplorerLink(link);
};
const getTxStatusColor = (status: string): string => {
  if (status === ACTIVITY_STATUS_SUCCESSFUL) return "#9BE8C7";
  if (status === ACTIVITY_STATUS_UNSUCCESSFUL || status === ACTIVITY_STATUS_CANCELLED) return "#FEA29F";
  return "#E0E0E0";
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
    <div class="col-span-6 order-3 sm:order-1 sm:col-span-1 sm:border-r pl-9 sm:pl-0 flex items-center justify-start">
      <div class="font-body text-xxs text-app-text-400 dark:text-app-text-dark-600 lt-sm:ml-3">
        {{ dateFormat(new Date(activity.updatedAt || 0), "dS mmm, yyyy") }}
        <br />
        at {{ dateFormat(new Date(activity.updatedAt || 0), "H:MM:ss") }}
      </div>
    </div>
    <div class="col-span-6 order-1 sm:order-2 pl-0 sm:pl-6">
      <div class="flex">
        <div class="flex items-center justify-center logo-container">
          <img class="block h-7 w-auto" :src="SolanaLogoURL" alt="Solana Logo" />
        </div>
        <div class="text-left ml-4 break-words overflow-hidden">
          <div v-if="activity.type === 'transfer'" class="font-body text-xs font-medium text-app-text-600 dark:text-app-text-dark-600">
            {{ activity.send ? "Send " : "Received " }} {{ Number(activity.totalAmountString) }} {{ activity.cryptoCurrency }}
            <span class="font-body text-xxs text-app-text-400 dark:text-app-text-dark-600">{{ activity.send ? "to " : "from " }}</span>
          </div>
          <div v-if="activity.type === 'transfer'" class="font-body text-xs text-app-text-400 dark:text-app-text-dark-600 break-words">
            {{ activity.send ? activity.to : activity.from }}
          </div>
          <!-- <div class="font-body text-xs text-app-text-400 dark:text-app-text-dark-600">Slot {{ activity.slot }}</div> -->
          <div v-if="!(activity.type === 'transfer')" class="font-body text-xxs text-app-text-400 dark:text-app-text-dark-600 break-all">
            {{ activity.signature }}
          </div>
        </div>
      </div>
    </div>
    <div v-if="activity.type === 'transfer'" class="col-span-6 sm:col-span-3 order-2 sm:order-3 text-right sm:text-left">
      <div class="font-body text-xs font-medium text-app-text-600 dark:text-app-text-dark-500">{{ Number(activity.totalAmountString) }}</div>
      <div class="font-body text-xxs text-app-text-400 dark:text-app-text-dark-600">{{ activity.cryptoCurrency }}</div>
    </div>
    <div class="col-span-6 sm:col-span-2 text-right order-4 flex items-center justify-end">
      <div class="rounded-xl inline-block bg-green-300 text-xs text-center py-1 px-5" :style="{ backgroundColor: getTxStatusColor(activity.status) }">
        {{ activity.status }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.logo-container {
  min-width: 32px;
}
</style>

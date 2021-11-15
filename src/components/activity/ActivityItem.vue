<script setup lang="ts">
import { ACTIVITY_STATUS_CANCELLED, ACTIVITY_STATUS_SUCCESSFUL, ACTIVITY_STATUS_UNSUCCESSFUL } from "@toruslabs/base-controllers";
import { SolanaTransactionActivity } from "@toruslabs/solana-controllers";
import dateFormat from "dateformat";
import { ref } from "vue";

import { FormattedTransaction, getFormattedTransactionData, TransactionDirection } from "./activity-data.service";

const props = defineProps<{
  activity: SolanaTransactionActivity;
}>();
const uiTransactionData: FormattedTransaction = getFormattedTransactionData(props.activity);
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
        {{ dateFormat(new Date((activity.updated_at || 0) * 1000), "dS mmm, yyyy") }}
        <br />
        at {{ dateFormat(new Date((activity.updated_at || 0) * 1000), "H:MM:ss") }}
      </div>
    </div>
    <div class="col-span-6 order-1 sm:order-2 pl-0 sm:pl-6">
      <div class="flex">
        <div class="flex items-center justify-center logo-container">
          <img class="block h-7 w-auto" :src="uiTransactionData.logoURI" alt="Solana Logo" />
        </div>
        <div class="text-left ml-4 break-words overflow-hidden">
          <div v-if="activity.type" class="font-body text-xs font-medium text-app-text-600 dark:text-app-text-dark-600">
            {{ uiTransactionData.direction + " " }} {{ uiTransactionData.amount }} {{ uiTransactionData.tokenName }}
            <span class="font-body text-xxs text-app-text-400 dark:text-app-text-dark-600">{{
              uiTransactionData.direction === TransactionDirection.SENT ? "to " : "from "
            }}</span>
          </div>
          <div v-if="activity.type" class="font-body text-xs text-app-text-400 dark:text-app-text-dark-600 break-words">
            {{ uiTransactionData.participant_address }}
          </div>
          <div class="font-body text-xs text-app-text-400 dark:text-app-text-dark-600">Slot {{ activity.slot }}</div>
          <div v-if="!activity.type" class="font-body text-xxs text-app-text-400 dark:text-app-text-dark-600 break-all">{{ activity.signature }}</div>
        </div>
      </div>
    </div>
    <div class="col-span-6 sm:col-span-3 order-2 sm:order-3 text-right sm:text-left">
      <div class="font-body text-xs font-medium text-app-text-600 dark:text-app-text-dark-500">{{ uiTransactionData.amount }}</div>
      <div class="font-body text-xxs text-app-text-400 dark:text-app-text-dark-600">{{ uiTransactionData.tokenName }}</div>
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
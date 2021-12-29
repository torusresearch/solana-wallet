<script setup lang="ts">
import { ACTIVITY_STATUS_CANCELLED, ACTIVITY_STATUS_SUCCESSFUL, ACTIVITY_STATUS_UNSUCCESSFUL } from "@toruslabs/base-controllers";
import { SolanaTransactionActivity } from "@toruslabs/solana-controllers";
import dateFormat from "dateformat";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import SolanaLogoURL from "@/assets/solana-mascot.svg";

const props = defineProps<{
  activity: SolanaTransactionActivity;
}>();

// const selectedNetworkDisplayName = computed(() => ControllerModule.selectedNetworkDisplayName);
// const showDetails = ref(false);

const { t } = useI18n();

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

const amountIsVisible = computed(() => {
  return props.activity.type === "transfer" || props.activity.type === "transferChecked";
});
</script>
<template>
  <div class="activity-item" @keydown="toggleDetails(activity.blockExplorerUrl)" @click="toggleDetails(activity.blockExplorerUrl)">
    <!-- date -->
    <div class="activity-item-date">
      <div class="font-body text-xxs text-app-text-400 dark:text-app-text-dark-600 lt-sm:ml-3">
        {{ dateFormat(new Date(activity.updatedAt || 0), "dS mmm, yyyy") }}
        <br />
        at {{ dateFormat(new Date(activity.updatedAt || 0), "H:MM:ss") }}
      </div>
    </div>
    <!-- logo + text -->
    <div class="activity-item-logotext" :class="{ 'activity-item-logotext-alt': !amountIsVisible }">
      <div class="flex items-center">
        <div class="logo-container">
          <img class="block h-7 w-auto" :src="activity.logoURI || SolanaLogoURL" alt="Solana Logo" />
        </div>
        <div class="text-left ml-4 break-words overflow-hidden">
          <div v-if="activity.type === 'unknown'" class="font-body text-xs font-medium text-app-text-600 dark:text-app-text-dark-600">
            {{ t("walletActivity.unknown") }}
          </div>
          <div v-if="activity.type === 'transfer' || activity.type === 'transferChecked'">
            <div class="font-body text-xs font-medium text-app-text-600 dark:text-app-text-dark-600">
              {{ activity.send ? t("walletActivity.sent") : t("walletActivity.received") }} {{ " " }} {{ Number(activity.totalAmountString) }}
              {{ activity.cryptoCurrency }}

              <span v-if="activity.cryptoCurrency === 'SOL'" class="font-body text-xxs text-app-text-400 dark:text-app-text-dark-600"
                >{{ activity.send ? t("walletActivity.to") : t("walletActivity.from") }} {{ " " }}</span
              >
            </div>
            <div v-if="activity.cryptoCurrency === 'SOL'" class="font-body text-xs text-app-text-400 dark:text-app-text-dark-600 break-words">
              {{ activity.send ? activity.to : activity.from }}
            </div>
          </div>
          <!-- <div class="font-body text-xs text-app-text-400 dark:text-app-text-dark-600">Slot {{ activity.slot }}</div> -->
          <div
            v-if="!(activity.type === 'transfer' || activity.type === 'transferChecked')"
            class="font-body text-xxs text-app-text-400 dark:text-app-text-dark-600 break-all"
          >
            {{ activity.signature }}
          </div>
        </div>
      </div>
    </div>
    <!-- Amount -->
    <div v-if="amountIsVisible" class="activity-item-amount">
      <div>
        <div class="font-body text-xs font-medium text-app-text-600 dark:text-app-text-dark-500">
          {{ Number(activity.totalAmountString) }}
        </div>
        <div class="font-body text-xxs text-app-text-400 dark:text-app-text-dark-600">
          {{ activity.cryptoCurrency }}
        </div>
      </div>
    </div>
    <!-- status -->
    <div class="activity-item-status" :class="{ 'activity-item-status-alt': !amountIsVisible }">
      <div class="rounded-xl inline-block bg-green-300 text-xs text-center py-1 px-5" :style="{ backgroundColor: getTxStatusColor(activity.status) }">
        {{ t(`walletActivity.${activity.status}`) }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.activity-item-date {
  @apply col-span-8
  order-3
  pl-9
  flex
  items-center
  justify-start
  sm:order-1
  sm:col-span-2
  sm:border-r
  sm:pl-0
  xl:col-span-1;
}
.activity-item-logotext {
  @apply col-span-8
  order-1
  pl-0
  sm:order-2
  sm:pl-6
  sm:col-span-6
  xl:col-span-7;
}

.activity-item-logotext-alt {
  @apply col-span-12 sm:col-span-6 xl:col-span-7;
}

.activity-item-amount {
  @apply col-span-4
  order-2
  text-right
  sm:col-span-2
  sm:order-3
  sm:text-left
  sm:flex
  sm:items-center
  sm:justify-center
  xl:col-span-2;
}

.activity-item-status {
  @apply col-span-4
  text-right
  order-4
  flex
  items-center
  justify-end
  sm:col-span-2;
}
.activity-item-status-alt {
  @apply sm:col-span-4;
}
.activity-item {
  @apply w-full
bg-white
dark:bg-app-gray-700
  border
border-app-gray-400
  dark:border-transparent
  shadow
  dark:shadow-dark
  rounded-md
  p-4
  grid
  grid-cols-12
  gap-2
  cursor-pointer;
}

.logo-container {
  min-width: 32px;
}
</style>

<script setup lang="ts">
import { ref } from "vue";

import ActivityItem from "@/components/ActivityItem.vue";
import { SelectField } from "@/components/common";
import WalletTabs from "@/components/WalletTabs.vue";

const transactionTypes = [
  {
    value: "",
    label: "All Transactions",
  },
  {
    value: "send",
    label: "Send",
  },
  {
    value: "receive",
    label: "Send",
  },
  {
    value: "topup",
    label: "Topup",
  },
];

const dates = [
  {
    value: "",
    label: "All",
  },
  {
    value: "date1",
    label: "Last 1 week",
  },
  {
    value: "date2",
    label: "Last 1 month",
  },
  {
    value: "date3",
    label: "Last 6 months",
  },
];

const transactionType = ref(transactionTypes[0]);
const date = ref(dates[0]);
</script>

<template>
  <WalletTabs tab="activity">
    <div class="pt-7">
      <ActivityItem />
    </div>
    <template #rightPanel>
      <div class="hidden sm:flex ml-auto w-2/4">
        <SelectField v-model="transactionType" class="mr-4" :items="transactionTypes" />
        <SelectField v-model="date" :items="dates" />
      </div>
    </template>
  </WalletTabs>
</template>

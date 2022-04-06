<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import ActivityItem from "@/components/activity/ActivityItem.vue";
import { SelectField } from "@/components/common";
import { ActivityPageInteractions, trackUserClick } from "@/directives/google-analytics";
import ControllerModule from "@/modules/controllers";

const ACTIVITY_ACTION_ALL = "walletActivity.allTransactions";
const ACTIVITY_ACTION_SEND = "walletActivity.send";
const ACTIVITY_ACTION_RECEIVE = "walletActivity.receive";
const ACTIVITY_ACTION_TOPUP = "walletActivity.topup";

const ACTIVITY_PERIOD_ALL = "walletActivity.all";
const ACTIVITY_PERIOD_WEEK_ONE = "walletActivity.lastOneWeek";
const ACTIVITY_PERIOD_MONTH_ONE = "walletActivity.lastOneMonth";
const ACTIVITY_PERIOD_MONTH_SIX = "walletActivity.lastSixMonts";

const { t } = useI18n();

const actionTypes = [
  {
    value: ACTIVITY_ACTION_ALL,
    label: t(ACTIVITY_ACTION_ALL),
  },
  {
    value: ACTIVITY_ACTION_SEND,
    label: t(ACTIVITY_ACTION_SEND),
  },
  {
    value: ACTIVITY_ACTION_RECEIVE,
    label: t(ACTIVITY_ACTION_RECEIVE),
  },
  {
    value: ACTIVITY_ACTION_TOPUP,
    label: t(ACTIVITY_ACTION_TOPUP),
  },
];

const periods = [
  {
    value: ACTIVITY_PERIOD_ALL,
    label: t(ACTIVITY_PERIOD_ALL),
  },
  {
    value: ACTIVITY_PERIOD_WEEK_ONE,
    label: t(ACTIVITY_PERIOD_WEEK_ONE),
  },
  {
    value: ACTIVITY_PERIOD_MONTH_ONE,
    label: t(ACTIVITY_PERIOD_MONTH_ONE),
  },
  {
    value: ACTIVITY_PERIOD_MONTH_SIX,
    label: t(ACTIVITY_PERIOD_MONTH_SIX),
  },
];
const actionType = ref(actionTypes[0]);
const period = ref(periods[0]);

const oneWeekAgoDate = computed(() => {
  const minDate = new Date();
  return minDate.setDate(minDate.getDate() - 7);
});
const oneMonthAgoDate = computed(() => {
  const minDate = new Date();
  return minDate.setMonth(minDate.getMonth() - 1);
});
const sixMonthAgoDate = computed(() => {
  const minDate = new Date();
  return minDate.setMonth(minDate.getMonth() - 6);
});
const allTransactions = computed(() => ControllerModule.selectedNetworkTransactions);
watch(actionType, () => {
  trackUserClick(ActivityPageInteractions.FILTER_TRANSACTION_TYPE + actionType.value.label);
});
watch(period, () => {
  trackUserClick(ActivityPageInteractions.FILTER_TRANSACTION_TIME + period.value.label);
});
const filteredTransaction = computed(() => {
  const selectedAction = actionType.value.value === ACTIVITY_ACTION_ALL ? "" : actionType.value.value;
  const regExAction = new RegExp(selectedAction, "i");

  const transactions = allTransactions.value.filter((item) => {
    // GET Date Scope
    let isScoped = false;
    if (period.value.value === ACTIVITY_PERIOD_ALL) {
      isScoped = true;
    } else {
      let minDate;
      const itemDate = item.updatedAt || 0;
      if (period.value.value === ACTIVITY_PERIOD_WEEK_ONE) {
        minDate = oneWeekAgoDate.value;
      } else if (period.value.value === ACTIVITY_PERIOD_MONTH_ONE) {
        minDate = oneMonthAgoDate.value;
      } else {
        minDate = sixMonthAgoDate.value;
      }
      isScoped = minDate <= itemDate;
    }

    if (item.action) {
      return item.action.match(regExAction) && isScoped;
    }
    return isScoped;
  });

  transactions.sort((x, y) => {
    const xTime = new Date(x.rawDate).getTime();
    const yTime = new Date(y.rawDate).getTime();
    return yTime - xTime;
  });

  return transactions;
});
</script>

<template>
  <div v-for="tx in filteredTransaction" :key="tx.signature" class="pt-7 transaction-activity">
    <ActivityItem :activity="tx" />
  </div>
  <Teleport to="#rightPanel">
    <div class="flex ml-auto w-fit">
      <span class="w-44">
        <SelectField v-model="actionType" :items="actionTypes" />
      </span>
      <span class="w-40">
        <SelectField v-model="period" :items="periods" />
      </span>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { Button, Card, SelectField, TextField } from "@/components/common";
import TransferTokenSelect from "@/components/TransferTokenSelect.vue";
import WalletTabs from "@/components/WalletTabs.vue";
import WalletBalance from "@/components/WalletBalance.vue";

interface TranferType {
  label: string;
  value: string;
}

const transferType = ref<TranferType | undefined>();
const transferTo = ref("");
const sendAmount = ref(0);
const transferId = ref("");
const transactionFee = ref(0);

const transferTypes: TranferType[] = [
  {
    label: "ETH address",
    value: "eth",
  },
  {
    label: "ENS domain",
    value: "ens",
  },
  {
    label: "Google account",
    value: "google",
  },
  {
    label: "Twitter handle",
    value: "twitter",
  },
  {
    label: "Reddit username",
    value: "reddit",
  },
  {
    label: "Discord ID",
    value: "discord",
  },
];
</script>

<template>
  <WalletTabs tab="transfer">
    <div class="py-2">
      <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
        <Card>
          <form action="#" method="POST">
            <div>
              <TransferTokenSelect class="mb-6" />
              <div class="grid grid-cols-3 space-x-3 mb-6">
                <div class="col-span-2">
                  <TextField v-model="transferTo" label="Send to" />
                </div>
                <div class="col-span-1">
                  <SelectField
                    v-model="transferType"
                    :items="transferTypes"
                    class="mt-6"
                  />
                </div>
              </div>

              <div class="mb-6">
                <TextField v-model="sendAmount" label="Amount" />
              </div>

              <div class="mb-6">
                <TextField v-model="transferId" label="Transfer ID (Memo)" />
              </div>

              <div class="mb-6">
                <TextField v-model="transactionFee" label="Transaction Fee" />
              </div>

              <div class="text-right mb-6">
                <div class="font-body font-bold text-sm">Total cost</div>
                <div class="font-body font-bold text-2xl">0 ETH</div>
                <div class="font-body text-xs font-light">0 USD</div>
              </div>

              <div class="flex">
                <Button class="ml-auto" type="submit">Transfer</Button>
              </div>
            </div>
          </form>
        </Card>
        <WalletBalance class="self-start" />
      </dl>
    </div>
  </WalletTabs>
</template>

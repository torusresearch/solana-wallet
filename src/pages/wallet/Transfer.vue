<script setup lang="ts">
import useVuelidate from "@vuelidate/core";
import { helpers, minValue, required } from "@vuelidate/validators";
import { computed, ref } from "vue";

import { Button, Card, SelectField, TextField } from "@/components/common";
import { TransferConfirm, TransferTokenSelect } from "@/components/transfer";
import WalletBalance from "@/components/WalletBalance.vue";
import WalletTabs from "@/components/WalletTabs.vue";
import { ALLOWED_VERIFIERS, ALLOWED_VERIFIERS_ERRORS, ENS, TransferType } from "@/utils/enums";
import { ruleVerifierId } from "@/utils/helpers";

const ensError = ref("");
const isOpen = ref(false);
const transferType = ref<TransferType>(ALLOWED_VERIFIERS[0]);
const transferTo = ref("");
const sendAmount = ref(0);
const transferId = ref("");
const transactionFee = ref(0);

const validVerifier = (value: string) => {
  if (!transferType.value) return true;
  return ruleVerifierId(transferType.value.value, value);
};

const ensRule = () => {
  return transferType.value.value === ENS && !ensError.value;
};

const getErrorMessage = () => {
  const selectedType = transferType.value?.value || "";
  if (!selectedType) return "";
  return ALLOWED_VERIFIERS_ERRORS[selectedType];
};

const rules = computed(() => {
  return {
    transferTo: {
      validTransferTo: helpers.withMessage(getErrorMessage, validVerifier),
      ensRule: helpers.withMessage(ensError.value, ensRule),
      required: helpers.withMessage("Required", required),
    },
    sendAmount: { greaterThanZero: helpers.withMessage("Must be greater than zero", minValue(1)) },
    transferId: { required },
    transactionFee: { greaterThanZero: helpers.withMessage("Must be greater than zero", minValue(1)) },
  };
});

const $v = useVuelidate(rules, { transferTo, transferId, sendAmount, transactionFee });

const closeModal = () => {
  isOpen.value = false;
};

const openModal = () => {
  $v.value.$touch();
  if (!$v.value.$invalid) isOpen.value = true;
};

const transferTypes = ALLOWED_VERIFIERS;
</script>

<template>
  <WalletTabs tab="transfer">
    <div class="py-2">
      <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
        <Card class="order-2 sm:order-1">
          <form action="#" method="POST">
            <div>
              <TransferTokenSelect class="mb-6" />
              <div class="grid grid-cols-3 gap-3 mb-6">
                <div class="col-span-3 sm:col-span-2">
                  <TextField v-model="transferTo" label="Send to" :errors="$v.transferTo.$errors" />
                </div>
                <div class="col-span-3 sm:col-span-1">
                  <SelectField v-model="transferType" :items="transferTypes" class="mt-0 sm:mt-6" />
                </div>
              </div>

              <div class="mb-6">
                <TextField v-model="sendAmount" label="Amount" :errors="$v.sendAmount.$errors" type="number" />
              </div>

              <div class="mb-6">
                <TextField v-model="transferId" label="Transfer ID (Memo)" :errors="$v.transferId.$errors" />
              </div>

              <div class="mb-6">
                <TextField v-model="transactionFee" label="Transaction Fee" :errors="$v.transactionFee.$errors" />
              </div>

              <div class="text-right mb-6">
                <div class="font-body font-bold text-sm text-app-text-600 dark:text-app-text-dark-400">Total cost</div>
                <div class="font-body font-bold text-2xl text-app-text-500 dark:text-app-text-dark-500">0 ETH</div>
                <div class="font-body text-xs font-light text-app-text-600 dark:text-app-text-dark-500">0 USD</div>
              </div>

              <div class="flex">
                <Button class="ml-auto" :disabled="$v.$dirty && $v.$invalid" @click="openModal"><span class="text-base">Transfer</span></Button>
                <TransferConfirm @onCloseModal="closeModal" />
              </div>
            </div>
          </form>
        </Card>
        <WalletBalance class="self-start order-1 sm:order-2" />
      </dl>
    </div>
  </WalletTabs>
</template>

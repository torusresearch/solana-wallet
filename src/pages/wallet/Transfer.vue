<script setup lang="ts">
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useVuelidate } from "@vuelidate/core";
import { helpers, minValue, required } from "@vuelidate/validators";
import log from "loglevel";
import { computed, defineAsyncComponent, reactive, ref } from "vue";

import { Button, Card, SelectField, TextField } from "@/components/common";
import WalletTabs from "@/components/WalletTabs.vue";
import ControllersModule from "@/modules/controllers";
import { ALLOWED_VERIFIERS, ALLOWED_VERIFIERS_ERRORS, STATUS_ERROR, STATUS_INFO, STATUS_TYPE, TransferType } from "@/utils/enums";
import { ruleVerifierId } from "@/utils/helpers";
// const ensError = ref("");
const isOpen = ref(false);
const transferType = ref<TransferType>(ALLOWED_VERIFIERS[0]);
const transferTo = ref("");
const sendAmount = ref(0);
const transferId = ref("");
const transactionFee = ref(0);
const blockhash = ref("");
const selectedVerifier = ref("solana");

const asyncWalletBalance = defineAsyncComponent({
  loader: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "WalletBalance" */ "@/components/WalletBalance.vue"),
});

const asyncTransferConfirm = defineAsyncComponent({
  loader: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "TransferConfirm" */ "@/components/transfer/TransferConfirm.vue"),
});
const asyncTransferTokenSelect = defineAsyncComponent({
  loader: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "TransferTokenSelect" */ "@/components/transfer/TransferTokenSelect.vue"),
});
const asyncMessageModal = defineAsyncComponent({
  loader: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "MessageModal" */ "@/components/common/MessageModal.vue"),
});

const messageModalState = reactive({
  showMessage: false,
  messageTitle: "",
  messageDescription: "",
  messageStatus: STATUS_INFO as STATUS_TYPE,
});

const validVerifier = (value: string) => {
  if (!transferType.value) return true;
  return ruleVerifierId(transferType.value.value, value);
};

// const ensRule = () => {
//   return transferType.value.value === ENS && !ensError.value;
// };

const getErrorMessage = () => {
  const selectedType = transferType.value?.value || "";
  if (!selectedType) return "";
  return ALLOWED_VERIFIERS_ERRORS[selectedType];
};

const rules = computed(() => {
  return {
    transferTo: {
      validTransferTo: helpers.withMessage(getErrorMessage, validVerifier),
      // ensRule: helpers.withMessage(ensError.value, ensRule),
      required: helpers.withMessage("Required", required),
    },
    sendAmount: { greaterThanZero: helpers.withMessage("Must be greater than zero", minValue(0)) },
    // transferId: { required },
    // transactionFee: { greaterThanZero: helpers.withMessage("Must be greater than zero", minValue(1)) },
  };
});

const $v = useVuelidate(rules, { transferTo, transferId, sendAmount, transactionFee });

const showMessageModal = (params: { messageTitle: string; messageDescription?: string; messageStatus: STATUS_TYPE }) => {
  const { messageDescription, messageTitle, messageStatus } = params;
  messageModalState.messageDescription = messageDescription || "";
  messageModalState.messageTitle = messageTitle;
  messageModalState.messageStatus = messageStatus;
  messageModalState.showMessage = true;
};

const onMessageModalClosed = () => {
  messageModalState.messageDescription = "";
  messageModalState.messageTitle = "";
  messageModalState.messageStatus = STATUS_INFO;
  messageModalState.showMessage = false;
};

const closeModal = () => {
  isOpen.value = false;
};

const LAMPORTS = 1000000000;

const openModal = async () => {
  $v.value.$touch();
  if (!$v.value.$invalid) isOpen.value = true;

  const { b_hash, fee } = await ControllersModule.torus.calculateTxFee();
  blockhash.value = b_hash;
  transactionFee.value = fee / LAMPORTS;
};
const confirmTransfer = async () => {
  try {
    const ti = SystemProgram.transfer({
      fromPubkey: new PublicKey(ControllersModule.selectedAddress),
      toPubkey: new PublicKey(transferTo.value),
      lamports: sendAmount.value * LAMPORTS,
    });
    const tf = new Transaction({ recentBlockhash: blockhash.value }).add(ti);
    const res = await ControllersModule.torus.transfer(tf);
    // const res = await ControllersModule.torus.providertransfer(tf);
    log.info(res);

    showMessageModal({ messageTitle: "Your transfer is being processed.", messageStatus: STATUS_INFO });
    // resetForm();
  } catch (error) {
    // log.error("send error", error);
    showMessageModal({
      messageTitle: `Fail to submit transaction: ${(error as Error)?.message || "Something went wrong"}`,
      messageStatus: STATUS_ERROR,
    });
  }
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
              <asyncTransferTokenSelect class="mb-6" />
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
              <!--
              <div class="mb-6">
                <TextField v-model="transferId" label="Transfer ID (Memo)" :errors="$v.transferId.$errors" />
              </div>

              <div class="mb-6">
                <TextField v-model="transactionFee" label="Transaction Fee" :errors="$v.transactionFee.$errors" />
              </div> -->

              <!-- <div class="text-right mb-6">
                <div class="font-body font-bold text-sm text-app-text-600 dark:text-app-text-dark-400">Total cost</div>
                <div class="font-body font-bold text-2xl text-app-text-500 dark:text-app-text-dark-500">0 SOL</div>
                <div class="font-body text-xs font-light text-app-text-600 dark:text-app-text-dark-500">0 USD</div>
              </div> -->

              <div class="flex">
                <Button class="ml-auto" :disabled="$v.$dirty && $v.$invalid" @click="openModal"><span class="text-base">Transfer</span></Button>
                <!-- :crypto-tx-fee="state.transactionFee" -->
                <!-- :transfer-disabled="$v.$invalid || $v.$dirty || $v.$error || !allRequiredValuesAvailable()" -->
                <asyncTransferConfirm
                  :sender-pub-key="ControllersModule.selectedAddress"
                  :receiver-pub-key="transferTo"
                  :crypto-amount="sendAmount"
                  :receiver-verifier="selectedVerifier"
                  :receiver-verifier-id="transferTo"
                  :is-open="isOpen"
                  :crypto-tx-fee="transactionFee"
                  @transfer-confirm="confirmTransfer"
                  @on-close-modal="closeModal"
                />
              </div>
            </div>
          </form>
        </Card>
        <asyncWalletBalance class="self-start order-1 sm:order-2" />
      </dl>
      <asyncMessageModal
        :is-open="messageModalState.showMessage"
        :title="messageModalState.messageTitle"
        :description="messageModalState.messageDescription"
        :status="messageModalState.messageStatus"
        @on-close="onMessageModalClosed"
      />
    </div>
  </WalletTabs>
</template>

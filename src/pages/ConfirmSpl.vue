<script setup lang="ts">
import { LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";
import log from "loglevel";
import { computed, onMounted, ref, watch } from "vue";

import { tokens } from "@/components/transfer/token-helper";
import TransferSPL from "@/components/transfer/TransferSPL.vue";
import { AccountEstimation } from "@/utils/interfaces";

import ControllerModule from "../modules/controllers";
import { delay } from "../utils/helpers";
import { redirectToResult, useRedirectFlow } from "../utils/redirectflow_helpers";
import { calculateTxFee, generateSPLTransaction, getEstimateBalanceChange } from "../utils/solanaHelpers";

const { params, method, resolveRoute, jsonrpc, req_id } = useRedirectFlow();

const transactionFee = ref(0);
const transaction = ref<Transaction>();
const selectedSplToken = computed(() => tokens.value.find((token) => token.mintAddress === params.mint_add));

const hasEstimationError = ref("");
const estimatedBalanceChange = ref<AccountEstimation[]>([]);
const estimationInProgress = ref(true);

const estimateChanges = async (tx: Transaction) => {
  estimationInProgress.value = true;
  try {
    estimatedBalanceChange.value = await getEstimateBalanceChange(ControllerModule.torus.connection, tx, ControllerModule.selectedAddress);
    hasEstimationError.value = "";
  } catch (e) {
    hasEstimationError.value = "Unable estimate balance changes";
    log.info("Error in transaction simulation", e);
  }
  estimationInProgress.value = false;
};

onMounted(async () => {
  // This can't be guaranteed
  setTimeout(() => {
    if (selectedSplToken.value === undefined)
      redirectToResult(jsonrpc, { message: "Selected SPL token not found", success: false, method }, req_id, resolveRoute);
  }, 20_000);

  if (!params?.mint_add || !params.receiver_add || !params.amount)
    redirectToResult(jsonrpc, { message: "Invalid or Missing Params", success: false, method }, req_id, resolveRoute);
});

watch(selectedSplToken, async () => {
  if (selectedSplToken.value) {
    transaction.value = await generateSPLTransaction(
      params.receiver_add,

      params.amount * 10 ** (selectedSplToken.value?.balance?.decimals || 0),
      selectedSplToken.value,
      ControllerModule.selectedAddress,
      ControllerModule.connection
    );

    const { fee } = await calculateTxFee(transaction.value.compileMessage(), ControllerModule.connection);
    estimateChanges(transaction.value);
    transactionFee.value = fee / LAMPORTS_PER_SOL;
  }
});

async function confirmTransfer() {
  await delay(500);
  try {
    if (selectedSplToken.value && transaction.value) {
      const res = await ControllerModule.torus.transfer(transaction.value);

      redirectToResult(jsonrpc, { signature: res, success: true, method }, req_id, resolveRoute);
    } else redirectToResult(jsonrpc, { message: "Selected SPL token not found", success: false }, req_id, resolveRoute);
  } catch (error) {
    redirectToResult(jsonrpc, { message: "Could not process transaction", success: false }, req_id, resolveRoute);
  }
}

async function cancelTransfer() {
  redirectToResult(jsonrpc, { message: "Transaction cancelled", success: false, method }, req_id, resolveRoute);
}
</script>

<template>
  <div
    class="w-full h-full overflow-hidden text-left align-middle transition-all bg-white dark:bg-app-gray-800 shadow-xl flex flex-col justify-center items-center"
  >
    <TransferSPL
      v-if="selectedSplToken?.mintAddress"
      :is-open="true"
      :crypto-tx-fee="transactionFee"
      :crypto-amount="params.amount"
      :receiver-pub-key="params.receiver_add"
      :sender-pub-key="params.sender_add"
      :token="selectedSplToken"
      :estimation-in-progress="estimationInProgress"
      :estimated-balance-change="estimatedBalanceChange"
      :has-estimation-error="hasEstimationError"
      @transfer-confirm="confirmTransfer"
      @transfer-cancel="cancelTransfer"
    ></TransferSPL>
    <p v-else>Fetching SPL Tokens..</p>
  </div>
</template>

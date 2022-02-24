<script setup lang="ts">
import { Transaction } from "@solana/web3.js";
import log from "loglevel";
import { computed, onMounted, ref } from "vue";

import { tokens } from "@/components/transfer/token-helper";
import TransferSPL from "@/components/transfer/TransferSPL.vue";
import { AccountEstimation, SolAndSplToken } from "@/utils/interfaces";

import ControllerModule from "../modules/controllers";
import { delay } from "../utils/helpers";
import { redirectToResult, useRedirectFlow } from "../utils/redirectflow_helpers";

const { params, method, resolveRoute, jsonrpc, req_id } = useRedirectFlow();

const estimationInProgress = ref(true);
const estimatedBalanceChange = ref<AccountEstimation[]>([]);
const hasEstimationError = ref("");
const transactionFee = ref(0);
const transaction = ref<Transaction>(new Transaction());

const estimateChanges = async () => {
  estimationInProgress.value = true;
  try {
    estimatedBalanceChange.value = await ControllerModule.torus.getEstimateBalanceChange(
      ControllerModule.torus.connection,
      transaction.value,
      ControllerModule.selectedAddress
    );
    hasEstimationError.value = "";
  } catch (e) {
    hasEstimationError.value = "Unable estimate balance changes";
    log.info("Error in transaction simulation", e);
  }
  estimationInProgress.value = false;
};

const calculateTxFee = async (token: SolAndSplToken) => {
  const tx = await ControllerModule.torus.getTransferSplTransaction(params.receiver_add, params.amount * 10 ** (token.balance?.decimals || 0), token);
  transaction.value = tx;
  estimateChanges();
  const fee = await ControllerModule.torus.calculateTxFee(tx.compileMessage());
  transactionFee.value = fee;
};

const selectedSplToken = computed(() => {
  const selectedToken = tokens.value.find((token) => token.mintAddress === params.mint_add);
  if (selectedToken) {
    calculateTxFee(selectedToken as SolAndSplToken);
  }
  return selectedToken;
});

onMounted(async () => {
  if (!params?.mint_add || !params.receiver_add || !params.amount)
    redirectToResult(jsonrpc, { message: "Invalid or Missing Params", success: false, method }, req_id, resolveRoute);

  setTimeout(() => {
    if (selectedSplToken.value === undefined)
      redirectToResult(jsonrpc, { message: "Selected SPL token not found", success: false, method }, req_id, resolveRoute);
  }, 20_000);
});

async function confirmTransfer() {
  await delay(500);
  try {
    if (selectedSplToken.value) {
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
      @transfer-confirm="confirmTransfer"
      @transfer-cancel="cancelTransfer"
    ></TransferSPL>
    <p v-else>Fetching SPL Tokens..</p>
  </div>
</template>

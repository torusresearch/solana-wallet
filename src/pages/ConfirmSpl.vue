<script setup lang="ts">
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { computed, onMounted, ref } from "vue";

import { tokens } from "@/components/transfer/token-helper";
import TransferSPL from "@/components/transfer/TransferSPL.vue";
import { SolAndSplToken } from "@/utils/interfaces";

import ControllerModule from "../modules/controllers";
import { delay } from "../utils/helpers";
import { redirectToResult, useRedirectFlow } from "../utils/redirectflow_helpers";

const { params, method, resolveRoute, jsonrpc, req_id } = useRedirectFlow();

const transactionFee = ref(0);
const selectedSplToken = computed(() => tokens.value.find((token) => token.mintAddress === params.mint_add));

onMounted(async () => {
  // This can't be guaranteed
  const { fee } = await ControllerModule.torus.calculateTxFee();
  transactionFee.value = fee / LAMPORTS_PER_SOL;
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
      const res = await ControllerModule.torus.getTransferSplTransaction(
        params.receiver_add,
        params.amount * 10 ** (selectedSplToken.value?.balance?.decimals || 0),
        selectedSplToken.value as SolAndSplToken
      );
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

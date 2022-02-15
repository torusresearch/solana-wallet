<script setup lang="ts">
import { LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";
import log from "loglevel";
import { computed, onMounted, ref } from "vue";

import { getTokenFromMint, nftTokens } from "@/components/transfer/token-helper";
import TransferNFT from "@/components/transfer/TransferNFT.vue";
import { AccountEstimation, SolAndSplToken } from "@/utils/interfaces";

import ControllerModule from "../modules/controllers";
import { delay } from "../utils/helpers";
import { redirectToResult, useRedirectFlow } from "../utils/redirectflow_helpers";

const { params, method, resolveRoute, req_id, jsonrpc } = useRedirectFlow();

const estimationInProgress = ref(true);
const estimatedBalanceChange = ref<AccountEstimation[]>([]);
const hasEstimationError = ref("");
const transactionFee = ref(0);
const selectedNft = computed(() => getTokenFromMint(nftTokens.value, params.mint_add));

let transaction = new Transaction();

onMounted(async () => {
  // TODO: This can't be guaranteed
  const { fee } = await ControllerModule.torus.calculateTxFee();
  transactionFee.value = fee / LAMPORTS_PER_SOL;
  if (!params?.mint_add || !params.receiver_add)
    redirectToResult(jsonrpc, { message: "Invalid or Missing Params", success: false, method }, req_id, resolveRoute);
  setTimeout(() => {
    if (selectedNft.value === undefined)
      redirectToResult(jsonrpc, { message: "Selected NFT not found", success: false, method }, req_id, resolveRoute);
  }, 20_000);

  transaction = await ControllerModule.torus.getTransferSplTransaction(params.receiver_add, 1, selectedNft.value as SolAndSplToken);
  estimationInProgress.value = true;
  try {
    estimatedBalanceChange.value = await ControllerModule.torus.getEstimateBalanceChange(
      ControllerModule.torus.connection,
      transaction,
      ControllerModule.selectedAddress
    );
    hasEstimationError.value = "";
  } catch (e) {
    hasEstimationError.value = "Unable estimate balance changes";
    log.info("Error in transaction simulation", e);
  }
  estimationInProgress.value = false;
});

async function confirmTransfer() {
  await delay(500);
  try {
    if (selectedNft.value) {
      const res = await ControllerModule.torus.transfer(transaction);
      redirectToResult(jsonrpc, { signature: res, success: true, method }, req_id, resolveRoute);
    } else redirectToResult(jsonrpc, { message: "Selected NFT not found", success: false, method }, req_id, resolveRoute);
  } catch (error) {
    redirectToResult(jsonrpc, { message: "Could not process transaction", success: false, method }, req_id, resolveRoute);
  }
}

async function cancelTransfer() {
  redirectToResult(jsonrpc, { message: "Transaction cancelled", success: false, method }, req_id, resolveRoute);
}
</script>

<template>
  <TransferNFT
    v-if="selectedNft?.mintAddress"
    :is-open="true"
    :crypto-tx-fee="transactionFee"
    :receiver-pub-key="params.receiver_add"
    :sender-pub-key="params.sender_add"
    :token="selectedNft"
    :estimation-in-progress="estimationInProgress"
    :estimated-balance-change="estimatedBalanceChange"
    :has-estimation-error="hasEstimationError"
    @transfer-confirm="confirmTransfer"
    @transfer-cancel="cancelTransfer"
  ></TransferNFT>
  <p v-else>Fetching NFTS..</p>
</template>

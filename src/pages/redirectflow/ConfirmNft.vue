<script setup lang="ts">
import { LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";
import log from "loglevel";
import { computed, onMounted, ref, watch } from "vue";

import { getTokenFromMint, nftTokens } from "@/components/transfer/token-helper";
import TransferNFT from "@/components/transfer/TransferNFT.vue";
import { AccountEstimation } from "@/utils/interfaces";

import ControllerModule from "../../modules/controllers";
import { delay } from "../../utils/helpers";
import { redirectToResult, useRedirectFlow } from "../../utils/redirectflow_helpers";
import { calculateTxFee, generateSPLTransaction, getEstimateBalanceChange } from "../../utils/solanaHelpers";

const { params, method, resolveRoute, req_id, jsonrpc } = useRedirectFlow();

const transactionFee = ref(0);
const transaction = ref<Transaction>();
const selectedNft = computed(() => getTokenFromMint(nftTokens.value, params.mint_add));

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
  // TODO: This can't be guaranteed
  if (!params?.mint_add || !params.receiver_add)
    redirectToResult(jsonrpc, { message: "Invalid or Missing Params", success: false, method }, req_id, resolveRoute);
  setTimeout(() => {
    if (selectedNft.value === undefined)
      redirectToResult(jsonrpc, { message: "Selected NFT not found", success: false, method }, req_id, resolveRoute);
  }, 2_000);
});

watch(selectedNft, async () => {
  if (selectedNft.value?.mintAddress) {
    transaction.value = await generateSPLTransaction(
      params.receiver_add,
      1,
      selectedNft.value,
      ControllerModule.selectedAddress,
      ControllerModule.connection
    );

    const { fee } = await calculateTxFee(transaction.value.compileMessage(), ControllerModule.connection);
    estimateChanges(transaction.value);
    transactionFee.value = fee / LAMPORTS_PER_SOL;
  } else {
    redirectToResult(jsonrpc, { message: "Selected NFT not found", success: false, method }, req_id, resolveRoute);
  }
});

async function confirmTransfer() {
  await delay(500);
  try {
    if (selectedNft.value && transaction.value) {
      const res = await ControllerModule.torus.transfer(transaction.value);
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
  <div
    class="w-full h-full overflow-hidden text-left align-middle transition-all bg-white dark:bg-app-gray-800 shadow-xl flex flex-col justify-center items-center"
  >
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
      @transfer-reject="cancelTransfer"
    ></TransferNFT>
    <p v-else>Fetching NFTS..</p>
  </div>
</template>

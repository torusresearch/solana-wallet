<script setup lang="ts">
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { computed, onMounted, ref } from "vue";

import { tokens } from "@/components/transfer/token-helper";
import TransferSPL from "@/components/transfer/TransferSPL.vue";

import ControllerModule from "../modules/controllers";
import { delay } from "../utils/helpers";
import { redirectToResult, useRedirectFlow } from "../utils/redirectflow_helpers";

const { params, method, resolveRoute } = useRedirectFlow();

const transactionFee = ref(0);
const selectedSplToken = computed(() => tokens.value.find((token) => token.mintAddress === params.mint_add));

onMounted(async () => {
  // This can't be guaranteed
  const { fee } = await ControllerModule.torus.calculateTxFee();
  transactionFee.value = fee / LAMPORTS_PER_SOL;
  if (!params?.mint_add || !params.receiver_add || !params.amount)
    redirectToResult(method, { message: "Invalid or Missing Params!" }, resolveRoute, false);
  setTimeout(() => {
    if (selectedSplToken.value === undefined) redirectToResult(method, { message: "SELECTED SPL TOKEN NOT FOUND" }, resolveRoute, false);
  }, 20_000);
});

async function confirmTransfer() {
  await delay(500);
  try {
    if (selectedSplToken.value) {
      const res = await ControllerModule.torus.transferSpl(
        params.receiver_add,
        params.amount * 10 ** (selectedSplToken.value?.balance?.decimals || 0),
        selectedSplToken.value
      );
      redirectToResult(method, { signature: res }, resolveRoute);
    } else throw new Error("SELECTED SPL TOKEN NOT FOUND");
  } catch (error) {
    redirectToResult(method, { error, message: "COULD NOT PROCESS TRANSACTION" }, resolveRoute, false);
  }
}

async function cancelTransfer() {
  redirectToResult(method, { message: "TRANSACTION CANCELLED" }, resolveRoute, false);
}
</script>

<template>
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
</template>

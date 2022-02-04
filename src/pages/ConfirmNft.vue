<script setup lang="ts">
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { computed, onMounted, ref } from "vue";

import { getTokenFromMint, nftTokens } from "@/components/transfer/token-helper";
import TransferNFT from "@/components/transfer/TransferNFT.vue";

import ControllerModule from "../modules/controllers";
import { delay } from "../utils/helpers";
import { redirectToResult, useRedirectFlow } from "../utils/redirectflow_helpers";

const { params, method, resolveRoute } = useRedirectFlow();

const transactionFee = ref(0);
const selectedNft = computed(() => getTokenFromMint(nftTokens.value, params.mint_add));

onMounted(async () => {
  // TODO: This can't be guaranteed
  const { fee } = await ControllerModule.torus.calculateTxFee();
  transactionFee.value = fee / LAMPORTS_PER_SOL;
  if (!params?.mint_add || !params.receiver_add) redirectToResult(method, { message: "Invalid or Missing Params!" }, resolveRoute);
  setTimeout(() => {
    if (selectedNft.value === undefined) redirectToResult(method, { message: "SELECTED NFT NOT FOUND" }, resolveRoute);
  }, 20_000);
});

async function confirmTransfer() {
  await delay(500);
  try {
    if (selectedNft.value) {
      const res = await ControllerModule.torus.transferSpl(params.receiver_add, 1, selectedNft.value);
      redirectToResult(method, { signature: res }, resolveRoute);
    } else throw new Error("SELECTED NFT NOT FOUND");
  } catch (error) {
    redirectToResult(method, { error, message: "COULD NOT PROCESS TRANSACTION" }, resolveRoute);
  }
}

async function cancelTransfer() {
  redirectToResult(method, { message: "TRANSACTION CANCELLED" }, resolveRoute);
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
    @transfer-confirm="confirmTransfer"
    @transfer-cancel="cancelTransfer"
  ></TransferNFT>
  <p v-else>Fetching NFTS..</p>
</template>

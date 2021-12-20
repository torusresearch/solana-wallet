<script setup lang="ts">
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { computed, onMounted, ref } from "vue";

import { getTokenFromMint, nftTokens } from "@/components/transfer/token-helper";
import TransferNFT from "@/components/transfer/TransferNFT.vue";
import { SolAndSplToken } from "@/utils/interfaces";

import ControllerModule from "../modules/controllers";
import { delay, getB64DecodedParams, redirectToResult } from "../utils/helpers";

const params = getB64DecodedParams();
const transactionFee = ref(0);
const selectedNft = computed(() => getTokenFromMint(nftTokens.value, params.mint_add));

const queryParams = new URLSearchParams(window.location.search);
const method = queryParams.get("method");
const resolveRoute = queryParams.get("resolveRoute");
onMounted(async () => {
  const { fee } = await ControllerModule.torus.calculateTxFee();
  transactionFee.value = fee / LAMPORTS_PER_SOL;
});
async function confirmTransfer() {
  await delay(500);
  try {
    const res = await ControllerModule.torus.transferSpl(params.receiver_add, 1, `${selectedNft.value?.mintAddress?.toString()}`, 0);
    redirectToResult(method, { signature: res }, resolveRoute);
  } catch (error) {
    redirectToResult(method, { error, msg: "COULD NOT PROCESS TRANSACTION" }, resolveRoute);
  }
}
</script>

<template>
  <TransferNFT
    v-if="selectedNft?.mintAddress"
    :is-open="true"
    :crypto-tx-fee="transactionFee"
    :receiver-pub-key="params.receiver_add"
    :sender-pub-key="params.sender_add"
    :token="selectedNft as SolAndSplToken"
    @transfer-confirm="confirmTransfer"
  ></TransferNFT>
  <p v-else>Fetching NFTS..</p>
</template>

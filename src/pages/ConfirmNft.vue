<script setup lang="ts">
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { computed, onMounted, ref } from "vue";

import { getTokenFromMint, nftTokens } from "@/components/transfer/token-helper";
import TransferNFT from "@/components/transfer/TransferNFT.vue";

import ControllerModule from "../modules/controllers";
import { delay, useRedirectFlow } from "../utils/helpers";

const { params, method, resolveRoute, redirectToResult } = useRedirectFlow();

const transactionFee = ref(0);
const selectedNft = computed(() => getTokenFromMint(nftTokens.value, params.mint_add));
onMounted(async () => {
  const { fee } = await ControllerModule.torus.calculateTxFee();
  transactionFee.value = fee / LAMPORTS_PER_SOL;
  setTimeout(() => {
    if (selectedNft.value === undefined) redirectToResult(method, { msg: "SELECTED NFT NOT FOUND" }, resolveRoute);
  }, 10_000);
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
async function cancelTransfer() {
  redirectToResult(method, { msg: "TRANSACTION CANCELLED" }, resolveRoute);
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

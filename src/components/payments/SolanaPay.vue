<script setup lang="ts">
import { createTransaction, ParsedURL, parseURL } from "@solana/pay";
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from "@solana/web3.js";
import log from "loglevel";
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

import MessageModal from "@/components/common/MessageModal.vue";
import ControllerModule from "@/modules/controllers";
import { STATUS } from "@/utils/enums";
import { DecodedDataType, decodeInstruction } from "@/utils/instructionDecoder";
import { parseSolanaPayRequestLink } from "@/utils/solanaHelpers";

import FullDivLoader from "../FullDivLoader.vue";
import PermissionsTx from "../permissionsTx/PermissionsTx.vue";
import { useEstimateChanges } from "./EstimateChangesComposable";
import PaymentConfirm from "./PaymentConfirm.vue";

const { hasEstimationError, estimatedBalanceChange, estimationInProgress, estimateChanges } = useEstimateChanges();
const props = withDefaults(
  defineProps<{
    requestLink: string;
  }>(),
  {}
);
const invalidLink = ref("");
const transaction = ref<Transaction>();
const requestParams = ref<ParsedURL>();
const linkParams = ref<{ icon: string; label: string; decodedInst: DecodedDataType[] }>();
const symbol = ref<string>("");
const emits = defineEmits(["onApproved", "onCloseModal"]);
const closeModal = () => {
  requestParams.value = undefined;
  linkParams.value = undefined;
  emits("onCloseModal");
};
const onCancel = () => {
  closeModal();
};
const onConfirm = () => {
  emits("onApproved", transaction.value);
  closeModal();
};
const isUrl = (UrlString: string) => {
  try {
    const splitString = UrlString.split(":");
    if (["https", "http"].includes(splitString[1])) {
      return Boolean(new URL(UrlString));
    }
    return false;
  } catch (e) {
    return false;
  }
};
const estimateTxFee = ref(0);
const router = useRouter();
watch(transaction, async () => {
  if (transaction.value) {
    const response = await ControllerModule.connection.getFeeForMessage(transaction.value.compileMessage());
    log.info(response);
    estimateTxFee.value = response.value / LAMPORTS_PER_SOL;
  }
});

onMounted(async () => {
  // set loading
  invalidLink.value = "";
  const { requestLink } = props;
  // requestLink = "solana:http://localhost:4022/solanapay";
  try {
    const pubkey = new PublicKey(requestLink);
    router.push({
      name: "walletTransfer",
      query: {
        receiverPubKey: pubkey.toBase58(),
      },
    });
  } catch (e) {
    log.info(e);
  }
  try {
    if (!requestLink.length) {
      // set loaded
      invalidLink.value = "Invalid Link";
    } else if (isUrl(requestLink)) {
      const targetLink = requestLink.slice("solana:".length);
      const result = await parseSolanaPayRequestLink(targetLink, ControllerModule.selectedAddress);
      if (result.transaction.signatures.length === 0) {
        result.transaction.feePayer = new PublicKey(ControllerModule.selectedAddress);
        const block = await ControllerModule.connection.getLatestBlockhash();
        result.transaction.lastValidBlockHeight = block.lastValidBlockHeight;
        result.transaction.recentBlockhash = block.blockhash;
      }
      log.info(result);
      transaction.value = result.transaction;
      linkParams.value = result;
    } else {
      try {
        const address = new PublicKey(requestLink);
        router.push({
          name: "walletTransfer",
          query: {
            receiverPubKey: address.toBase58(),
          },
        });
        return;
      } catch (e) {}

      const result = parseURL(requestLink);
      const { recipient, splToken, reference, memo, amount, message } = result;
      if (!amount) {
        // redirect to transfer page
        router.push({
          name: "walletTransfer",
          query: {
            receiverPubKey: recipient.toBase58(),
            mint: splToken?.toBase58(),
            reference: reference?.map((item) => item.toBase58()),
            memo,
            message,
          },
        });
        return;
      }
      if (splToken) {
        // const tokenInfo = await getTokenInfo(splToken.toBase58());
        const tokenInfo = ControllerModule.torusState.TokenInfoState.tokenInfoMap[splToken.toBase58()];
        if (tokenInfo.symbol) symbol.value = tokenInfo.symbol;
        else {
          symbol.value = `${splToken.toBase58().substring(0, 5)}...`;
        }
      }
      const tx = await createTransaction(ControllerModule.connection, new PublicKey(ControllerModule.selectedAddress), recipient, amount, {
        splToken,
        reference,
        memo,
      });
      const block = await ControllerModule.connection.getLatestBlockhash();
      tx.recentBlockhash = block.blockhash;
      tx.feePayer = new PublicKey(ControllerModule.selectedAddress);
      transaction.value = tx;

      requestParams.value = result;
      log.info(result);
    }
    // estimate changes if transaction available
    if (transaction.value) estimateChanges(transaction.value, ControllerModule.connection, ControllerModule.selectedAddress);
  } catch (e) {
    // invalidLink.value = true;
    if (e instanceof Error) {
      invalidLink.value = e.message || e.name;
    } else {
      invalidLink.value = "Invalid Link";
    }
    log.error(e);
  }
});
</script>

<template>
  <div v-if="invalidLink" class="">
    <MessageModal :is-open="!!invalidLink || false" :title="invalidLink" :status="STATUS.ERROR" @on-close="onCancel" />
  </div>

  <PaymentConfirm
    v-else-if="requestParams"
    class="payContainer"
    :is-gasless="false"
    :label="requestParams.label"
    :message="requestParams.message"
    :memo="requestParams.memo"
    :receiver-pub-key="requestParams.recipient.toBase58()"
    :crypto-amount="requestParams.amount?.toNumber()"
    :token="symbol || 'SOL'"
    :crypto-tx-fee="estimateTxFee"
    :network="ControllerModule.selectedNetworkDisplayName"
    :decoded-inst="transaction?.instructions.map((inst) => decodeInstruction(inst)) || []"
    :estimation-in-progress="estimationInProgress"
    :estimated-balance-change="estimatedBalanceChange"
    :has-estimation-error="hasEstimationError"
    :price-per-sol="ControllerModule.conversionRate"
    :currency="ControllerModule.currentCurrency"
    :price-per-token="0"
    @transfer-confirm="onConfirm"
    @transfer-cancel="onCancel"
    @on-close-modal="onCancel"
  />
  <PermissionsTx
    v-else-if="linkParams"
    :decoded-inst="linkParams.decodedInst"
    :network="ControllerModule.selectedNetworkDisplayName"
    :logo-url="linkParams.icon"
    :origin="linkParams.label"
    :estimation-in-progress="estimationInProgress"
    :estimated-balance-change="estimatedBalanceChange"
    :has-estimation-error="hasEstimationError"
    @on-approved="onConfirm"
    @on-cancel="onCancel"
    @on-close-modal="onCancel"
  />
  <div v-else class="payContainer">
    <!-- <div class="wrapper w-full md:w-96">Loading</div> -->
    <FullDivLoader />
  </div>
</template>
<style>
.payContainer {
  height: 100%;
  width: 100%;
  @apply flex flex-col justify-center items-center;
}
.wrapper {
  @apply overflow-hidden align-middle transform shadow-xl flex-col justify-center items-center  text-center py-6;
}
</style>

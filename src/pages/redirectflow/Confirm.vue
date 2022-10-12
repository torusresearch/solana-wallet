<script setup lang="ts">
import { VersionedMessage, VersionedTransaction } from "@solana/web3.js";
import { decompile } from "@toruslabs/solana-controllers";
import log from "loglevel";
import { onErrorCaptured, onMounted, ref } from "vue";

import FullDivLoader from "@/components/FullDivLoader.vue";
import { PaymentConfirm } from "@/components/payments";
import { useEstimateChanges } from "@/components/payments/EstimateChangesComposable";
import PermissionsTx from "@/components/permissionsTx/PermissionsTx.vue";
import { TransactionChannelDataType } from "@/utils/enums";
import { hideCrispButton, openCrispChat } from "@/utils/helpers";
import { DecodedDataType, decodeInstruction } from "@/utils/instructionDecoder";
import { FinalTxData } from "@/utils/interfaces";
import { redirectToResult, useRedirectFlow } from "@/utils/redirectflowHelpers";
import { calculateTxFee, decodeAllInstruction, parsingTransferAmount } from "@/utils/solanaHelpers";

import ControllerModule from "../../modules/controllers";

const { params, method, jsonrpc, req_id, resolveRoute } = useRedirectFlow();
const { hasEstimationError, estimatedBalanceChange, estimationInProgress, estimateChanges } = useEstimateChanges();

const finalTxData = ref<FinalTxData>();

const tx = ref<VersionedTransaction>();
const decodedInst = ref<DecodedDataType[]>();
const origin = ref("");
const network = ref("");
const loading = ref(true);

onErrorCaptured(() => {
  openCrispChat();
});
onMounted(async () => {
  hideCrispButton();
  try {
    let txData: Partial<TransactionChannelDataType>;
    if (params?.message) {
      txData = {
        type: method,
        message: params?.message,
        messageOnly: params?.messageOnly,
        signer: ControllerModule.selectedAddress,
        origin: window.origin,
      };
    } else {
      redirectToResult(jsonrpc, { message: "Invalid or Missing Params", method }, req_id, resolveRoute);
      return;
    }
    origin.value = txData.origin as string;
    network.value = txData.network || "";

    // TODO: currently, controllers does not support multi transaction flow
    if (txData.type === "sign_all_transactions") {
      const decoded = decodeAllInstruction(txData.message as string[], txData.messageOnly || false);
      decodedInst.value = decoded;
      estimationInProgress.value = false;
      hasEstimationError.value = "Failed to simulate transaction for balance changes";
      loading.value = false;
      return;
    }

    if (txData.messageOnly) {
      const msgObj = VersionedMessage.deserialize(txData.message as unknown as Uint8Array);
      tx.value = new VersionedTransaction(msgObj);
    } else {
      const msgObj = VersionedMessage.deserialize(txData.message as unknown as Uint8Array);
      tx.value = new VersionedTransaction(msgObj);
    }

    estimateChanges(tx.value, ControllerModule.connection, ControllerModule.selectedAddress);
    // const isGasless = tx.value.feePayer?.toBase58() !== txData.signer;
    const txFee = (await calculateTxFee(tx.value.message, ControllerModule.connection, ControllerModule.selectedAddress)).fee;

    const instructions = decompile(tx.value.message);

    try {
      decodedInst.value = instructions.map((inst) => {
        return decodeInstruction(inst);
      });

      finalTxData.value = parsingTransferAmount(tx.value, txFee, false, instructions);
    } catch (e) {
      log.error(e);
    }
  } catch (error) {
    log.error(error, "error in tx");
    openCrispChat();
  }
  loading.value = false;
});

const approveTxn = async (): Promise<void> => {
  loading.value = true;
  let res: string | string[] | VersionedTransaction | undefined;
  try {
    if (method === "send_transaction" && tx.value) {
      res = await ControllerModule.torus.transfer(tx.value, params);
      redirectToResult(jsonrpc, { data: { signature: res }, method, success: true }, req_id, resolveRoute);
    } else if (method === "sign_transaction" && tx.value) {
      res = ControllerModule.torus.UNSAFE_signTransaction(tx.value);
      redirectToResult(jsonrpc, { data: { signature: res.serialize() }, method, success: true }, req_id, resolveRoute);
    } else if (method === "sign_all_transactions") {
      res = await ControllerModule.torus.UNSAFE_signAllTransactions({ params } as { params: { message: Uint8Array[] }; method: string });
      redirectToResult(jsonrpc, { data: { signatures: res }, method, success: true }, req_id, resolveRoute);
    } else throw new Error();
  } catch (e) {
    redirectToResult(jsonrpc, { success: false, method, error: (e as Error).message }, req_id, resolveRoute);
  }
};

const rejectTxn = async () => {
  loading.value = true;
  redirectToResult(jsonrpc, { success: false, method }, req_id, resolveRoute);
};
</script>

<!-- Could not use close modal event as it will overwrite approve transaction -->
<template>
  <FullDivLoader v-if="loading" />
  <PaymentConfirm
    v-else-if="finalTxData"
    :is-open="true"
    :sender-pub-key="finalTxData.slicedSenderAddress"
    :receiver-pub-key="finalTxData.slicedReceiverAddress"
    :crypto-amount="finalTxData.totalSolAmount"
    :crypto-tx-fee="finalTxData.totalSolFee"
    :is-gasless="finalTxData.isGasless"
    :decoded-inst="decodedInst || []"
    :network="network"
    :estimation-in-progress="estimationInProgress"
    :estimated-balance-change="estimatedBalanceChange"
    :has-estimation-error="hasEstimationError"
    :price-per-sol="ControllerModule.conversionRate"
    :currency="ControllerModule.currentCurrency"
    @transfer-confirm="approveTxn()"
    @transfer-cancel="rejectTxn()"
  />
  <PermissionsTx
    v-else-if="decodedInst"
    :decoded-inst="decodedInst || []"
    :origin="origin"
    :network="network"
    :estimation-in-progress="estimationInProgress"
    :estimated-balance-change="estimatedBalanceChange"
    :has-estimation-error="hasEstimationError"
    @on-approved="approveTxn()"
    @on-cancel="rejectTxn()"
  />
</template>

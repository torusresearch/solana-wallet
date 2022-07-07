<script setup lang="ts">
import { clusterApiUrl, Connection, Message, Transaction } from "@solana/web3.js";
import { BROADCAST_CHANNELS, BroadcastChannelHandler, broadcastChannelOptions, POPUP_RESULT } from "@toruslabs/base-controllers";
import { BroadcastChannel } from "@toruslabs/broadcast-channel";
import log from "loglevel";
import { onErrorCaptured, onMounted, ref } from "vue";

import { PaymentConfirm } from "@/components/payments";
import PermissionsTx from "@/components/permissionsTx/PermissionsTx.vue";
import ControllerModule from "@/modules/controllers";
import { TransactionChannelDataType } from "@/utils/enums";
import { hideCrispButton, openCrispChat } from "@/utils/helpers";
import { DecodedDataType, decodeInstruction } from "@/utils/instruction_decoder";
import { AccountEstimation, FinalTxData } from "@/utils/interfaces";
import { calculateTxFee, decodeAllInstruction, getEstimateBalanceChange, parsingTransferAmount } from "@/utils/solanaHelpers";

const channel = `${BROADCAST_CHANNELS.TRANSACTION_CHANNEL}_${new URLSearchParams(window.location.search).get("instanceId")}`;

const hasEstimationError = ref("");
const estimatedBalanceChange = ref<AccountEstimation[]>([]);
const estimationInProgress = ref(true);
const finalTxData = ref<FinalTxData>();

const tx = ref<Transaction>();
const decodedInst = ref<DecodedDataType[]>();
const origin = ref("");
const network = ref("");
onErrorCaptured(() => {
  openCrispChat();
});

const estimateChanges = async (transaction: Transaction, connection: Connection) => {
  try {
    estimationInProgress.value = true;
    estimatedBalanceChange.value = await getEstimateBalanceChange(connection, transaction, ControllerModule.selectedAddress);
  } catch (e) {
    hasEstimationError.value = (e as Error).message;
    log.error("estimation error", e);
  }
  estimationInProgress.value = false;
};
onMounted(async () => {
  hideCrispButton();
  try {
    const bcHandler = new BroadcastChannelHandler(BROADCAST_CHANNELS.TRANSACTION_CHANNEL);
    const txData = await bcHandler.getMessageFromChannel<TransactionChannelDataType>();
    origin.value = txData.origin as string;
    network.value = txData.network || "";

    const connection = new Connection(txData.networkDetails?.rpcTarget || clusterApiUrl("mainnet-beta"));
    // TODO: currently, controllers does not support multi transaction flow
    if (txData.type === "sign_all_transactions") {
      const decoded = decodeAllInstruction(txData.message as string[], txData.messageOnly || false);
      decodedInst.value = decoded;
      estimationInProgress.value = false;
      hasEstimationError.value = "Failed to simulate transaction for balance changes";
      return;
    }

    if (txData.messageOnly) {
      tx.value = Transaction.populate(Message.from(Buffer.from(txData.message as string, "hex")));
    } else {
      tx.value = Transaction.from(Buffer.from(txData.message as string, "hex"));
    }

    estimateChanges(tx.value, connection);
    const isGasless = tx.value.feePayer?.toBase58() !== txData.signer;
    const txFee = isGasless
      ? 0
      : (await calculateTxFee(tx.value.compileMessage(), new Connection(txData.networkDetails?.rpcTarget || clusterApiUrl("mainnet-beta")))).fee;

    try {
      decodedInst.value = tx.value.instructions.map((inst) => {
        return decodeInstruction(inst);
      });

      finalTxData.value = parsingTransferAmount(tx.value, txFee, isGasless);
    } catch (e) {
      log.error(e);
    }
  } catch (error) {
    log.error(error, "error in tx");
    openCrispChat();
  }
});

const approveTxn = async (): Promise<void> => {
  const bc = new BroadcastChannel(channel, broadcastChannelOptions);
  await bc.postMessage({
    data: { type: POPUP_RESULT, approve: true },
  });
  bc.close();
};

const closeModal = async () => {
  const bc = new BroadcastChannel(channel, broadcastChannelOptions);
  await bc.postMessage({ data: { type: POPUP_RESULT, approve: false } });
  bc.close();
};

const rejectTxn = async () => {
  closeModal();
};
</script>

<template>
  <PaymentConfirm
    v-if="finalTxData"
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

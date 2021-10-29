<script setup lang="ts">
import { Connection, LAMPORTS_PER_SOL, Message, SystemInstruction, Transaction } from "@solana/web3.js";
import { addressSlicer, BROADCAST_CHANNELS, BroadcastChannelHandler, broadcastChannelOptions, POPUP_RESULT } from "@toruslabs/base-controllers";
import { BigNumber } from "bignumber.js";
import { BroadcastChannel } from "broadcast-channel";
import log from "loglevel";
import { onMounted, reactive, ref } from "vue";

import { PaymentConfirm } from "@/components/payments";
// import PermissionsTx from "@/components/permissionsTx/PermissionsTx.vue";
import { TransactionChannelDataType } from "@/utils/enums";
import { DecodedDataType, decodeInstruction } from "@/utils/inst_decoder";

const channel = `${BROADCAST_CHANNELS.TRANSACTION_CHANNEL}_${new URLSearchParams(window.location.search).get("instanceId")}`;

interface FinalTxData {
  slicedSenderAddress: string;
  slicedReceiverAddress: string;
  totalSolAmount: number;
  totalSolFee: number;
  totalFiatAmount: string;
  totalFiatFee: string;
  transactionType: string;
  totalSolCost: string;
  totalFiatCost: string;
  networkDisplayName: string;
  isGasless: boolean;
}
let finalTxData = reactive<FinalTxData>({
  slicedSenderAddress: "",
  slicedReceiverAddress: "",
  totalSolAmount: 0,
  totalSolFee: 0,
  totalFiatAmount: "",
  totalFiatFee: "",
  transactionType: "",
  totalSolCost: "",
  totalFiatCost: "",
  networkDisplayName: "",
  isGasless: false,
});

let transaction = ref<Transaction>();
let decodedInst = ref<DecodedDataType[]>();

onMounted(async () => {
  try {
    const bcHandler = new BroadcastChannelHandler(BROADCAST_CHANNELS.TRANSACTION_CHANNEL);
    const txData = await bcHandler.getMessageFromChannel<TransactionChannelDataType>();
    const networkConfig = txData.networkDetails;

    const msg = Message.from(Buffer.from(txData.message || "", "hex"));
    const tx = Transaction.populate(msg);
    transaction.value = tx;
    const conn = new Connection(networkConfig.rpcTarget);
    const block = await conn.getRecentBlockhash("finalized");

    const isGasless = tx.feePayer?.toBase58() !== txData.signer;
    const txFee = isGasless ? 0 : block.feeCalculator.lamportsPerSignature;

    decodedInst.value = tx.instructions.map((inst) => {
      return decodeInstruction(inst);
    });
    try {
      const decoded = tx.instructions.map((inst) => {
        const decoded_inst = SystemInstruction.decodeTransfer(inst);
        return decoded_inst;
      });

      const from = decoded[0].fromPubkey;
      const to = decoded[0].toPubkey;

      const txAmount = decoded[0].lamports;

      const totalSolCost = new BigNumber(txFee).plus(txAmount).div(LAMPORTS_PER_SOL);
      finalTxData.slicedSenderAddress = addressSlicer(from.toBase58());
      finalTxData.slicedReceiverAddress = addressSlicer(to.toBase58());
      finalTxData.totalSolAmount = new BigNumber(txAmount).div(LAMPORTS_PER_SOL).toNumber();
      finalTxData.totalSolFee = new BigNumber(txFee).div(LAMPORTS_PER_SOL).toNumber();
      finalTxData.totalSolCost = totalSolCost.toString();
      finalTxData.transactionType = "";
      finalTxData.networkDisplayName = txData.networkDetails?.displayName;
      finalTxData.isGasless = isGasless;
    } catch (e) {
      console.log(e);
    }
  } catch (error) {
    log.error("error in tx", error);
  }
});

const approveTxn = async (): Promise<void> => {
  const bc = new BroadcastChannel(channel, broadcastChannelOptions);
  await bc.postMessage({
    data: { type: POPUP_RESULT, approve: true },
  });
  bc.close();
};
const rejectTxn = async () => {
  const bc = new BroadcastChannel(channel, broadcastChannelOptions);
  await bc.postMessage({ data: { type: POPUP_RESULT, approve: false } });
  bc.close();
};
</script>

<template>
  <PaymentConfirm
    :is-open="true"
    :sender-pub-key="finalTxData.slicedSenderAddress"
    :receiver-pub-key="finalTxData.slicedReceiverAddress"
    :crypto-amount="finalTxData.totalSolAmount"
    :crypto-tx-fee="finalTxData.totalSolFee"
    :is-gasless="finalTxData.isGasless"
    :decoded-inst="decodedInst || []"
    @on-close-modal="rejectTxn()"
    @transfer-confirm="approveTxn()"
  />
  <!-- <PermissionsTx v-else-if="transaction" :transaction="transaction" @on-close-modal="rejectTxn()" @on-approved="approveTxn()" /> -->
</template>

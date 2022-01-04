<script setup lang="ts">
import { Connection, LAMPORTS_PER_SOL, Message, SystemInstruction, SystemProgram, Transaction } from "@solana/web3.js";
import { addressSlicer, BROADCAST_CHANNELS, BroadcastChannelHandler, broadcastChannelOptions, POPUP_RESULT } from "@toruslabs/base-controllers";
import { BigNumber } from "bignumber.js";
import { BroadcastChannel } from "broadcast-channel";
import log from "loglevel";
import { onMounted, reactive, ref } from "vue";

import { PaymentConfirm } from "@/components/payments";
import PermissionsTx from "@/components/permissionsTx/PermissionsTx.vue";
import { TransactionChannelDataType } from "@/utils/enums";
import { checkRedirectFlow, getB64DecodedParams, redirectToResult } from "@/utils/helpers";
import { DecodedDataType, decodeInstruction } from "@/utils/instruction_decoder";

import ControllerModule from "../modules/controllers";

const channel = `${BROADCAST_CHANNELS.TRANSACTION_CHANNEL}_${new URLSearchParams(window.location.search).get("instanceId")}`;

const isRedirectFlow = checkRedirectFlow();
const params = getB64DecodedParams();
const queryParams = new URLSearchParams(window.location.search);
const method = queryParams.get("method");
const resolveRoute = queryParams.get("resolveRoute");

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
const finalTxData = reactive<FinalTxData>({
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

const tx = ref<Transaction>();
const decodedInst = ref<DecodedDataType[]>();
const origin = ref("");
onMounted(async () => {
  try {
    let txData: TransactionChannelDataType;
    if (!isRedirectFlow) {
      const bcHandler = new BroadcastChannelHandler(BROADCAST_CHANNELS.TRANSACTION_CHANNEL);
      txData = await bcHandler.getMessageFromChannel<TransactionChannelDataType>();
    } else if (method) txData = ControllerModule.torus.getTransactionData(method as string, params);
    else throw new Error("method not supplied");

    const networkConfig = txData.networkDetails;

    const msg = Message.from(Buffer.from(txData.message, "hex"));
    tx.value = Transaction.populate(msg);
    const conn = new Connection(networkConfig.rpcTarget);
    const block = await conn.getRecentBlockhash("finalized");

    const isGasless = tx.value.feePayer?.toBase58() !== txData.signer;
    const txFee = isGasless ? 0 : block.feeCalculator.lamportsPerSignature;

    decodedInst.value = tx.value.instructions.map((inst) => {
      return decodeInstruction(inst);
    });
    origin.value = txData.origin;
    try {
      if (tx.value.instructions.length > 1) return;
      if (!tx.value.instructions[0].programId.equals(SystemProgram.programId)) return;
      if (SystemInstruction.decodeInstructionType(tx.value.instructions[0]) !== "Transfer") return;
      const decoded = tx.value.instructions.map((inst) => {
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
      log.error(e);
    }
  } catch (error) {
    log.error("error in tx", error);
  }
});

const approveTxn = async (): Promise<void> => {
  if (!isRedirectFlow) {
    const bc = new BroadcastChannel(channel, broadcastChannelOptions);
    await bc.postMessage({
      data: { type: POPUP_RESULT, approve: true },
    });
    bc.close();
  } else if (tx.value) {
    let res: string | Transaction;
    if (method === "send_transaction") {
      res = await ControllerModule.torus.transfer(tx.value, params);
      redirectToResult(method, res, resolveRoute);
    } else if (method === "sign_transaction") {
      res = ControllerModule.torus.signTransaction(tx.value);
      redirectToResult(method, res, resolveRoute);
    }
  }
};

const closeModal = async () => {
  const bc = new BroadcastChannel(channel, broadcastChannelOptions);
  await bc.postMessage({ data: { type: POPUP_RESULT, approve: false } });
  bc.close();
};

const rejectTxn = async () => {
  if (!isRedirectFlow) {
    closeModal();
  } else {
    // send res to deeplink and  close window
    redirectToResult(method, { success: false }, resolveRoute);
  }
};
</script>

<template>
  <PaymentConfirm
    v-if="finalTxData.totalSolAmount"
    :is-open="true"
    :sender-pub-key="finalTxData.slicedSenderAddress"
    :receiver-pub-key="finalTxData.slicedReceiverAddress"
    :crypto-amount="finalTxData.totalSolAmount"
    :crypto-tx-fee="finalTxData.totalSolFee"
    :is-gasless="finalTxData.isGasless"
    :decoded-inst="decodedInst || []"
    @on-close-modal="closeModal()"
    @transfer-confirm="approveTxn()"
    @transfer-cancel="rejectTxn()"
  />
  <PermissionsTx
    v-else-if="decodedInst"
    :decoded-inst="decodedInst || []"
    :origin="origin"
    @on-close-modal="closeModal()"
    @on-approved="approveTxn()"
    @on-cancel="rejectTxn()"
  />
</template>

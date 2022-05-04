<script setup lang="ts">
import { LAMPORTS_PER_SOL, Message, SystemInstruction, SystemProgram, Transaction } from "@solana/web3.js";
import { addressSlicer, BROADCAST_CHANNELS, BroadcastChannelHandler, broadcastChannelOptions, POPUP_RESULT } from "@toruslabs/base-controllers";
import { BroadcastChannel } from "@toruslabs/broadcast-channel";
import { BigNumber } from "bignumber.js";
import log from "loglevel";
import { onMounted, reactive, ref } from "vue";

import { PaymentConfirm } from "@/components/payments";
import PermissionsTx from "@/components/permissionsTx/PermissionsTx.vue";
import { TransactionChannelDataType } from "@/utils/enums";
import { DecodedDataType, decodeInstruction } from "@/utils/instruction_decoder";
import { redirectToResult, useRedirectFlow } from "@/utils/redirectflow_helpers";

import ControllerModule from "../modules/controllers";

const channel = `${BROADCAST_CHANNELS.TRANSACTION_CHANNEL}_${new URLSearchParams(window.location.search).get("instanceId")}`;

const { isRedirectFlow, params, method, jsonrpc, req_id, resolveRoute } = useRedirectFlow();

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
const network = ref("");

onMounted(async () => {
  try {
    let txData: Partial<TransactionChannelDataType>;
    if (!isRedirectFlow) {
      const bcHandler = new BroadcastChannelHandler(BROADCAST_CHANNELS.TRANSACTION_CHANNEL);
      txData = await bcHandler.getMessageFromChannel<TransactionChannelDataType>();
    } else if (params?.message) {
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
      const decoded: DecodedDataType[] = [];
      (txData.message as string[]).forEach((msg) => {
        let tx2: Transaction;
        if (txData.messageOnly) {
          tx2 = Transaction.populate(Message.from(Buffer.from(msg, "hex")));
        } else {
          tx2 = Transaction.from(Buffer.from(msg, "hex"));
        }
        tx2.instructions.forEach((inst) => {
          decoded.push(decodeInstruction(inst));
        });
      });
      decodedInst.value = decoded;
      return;
    }

    if (txData.messageOnly) {
      tx.value = Transaction.populate(Message.from(Buffer.from(txData.message as string, "hex")));
    } else {
      tx.value = Transaction.from(Buffer.from(txData.message as string, "hex"));
    }

    const block = await ControllerModule.torus.connection.getRecentBlockhash("finalized");

    const isGasless = tx.value.feePayer?.toBase58() !== txData.signer;
    const txFee = isGasless ? 0 : block.feeCalculator.lamportsPerSignature;

    try {
      decodedInst.value = tx.value.instructions.map((inst) => {
        return decodeInstruction(inst);
      });

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
      finalTxData.networkDisplayName = txData.networkDetails?.displayName as string;
      finalTxData.isGasless = isGasless;
    } catch (e) {
      log.error(e);
    }
  } catch (error) {
    log.error(error, "error in tx");
  }
});

const approveTxn = async (): Promise<void> => {
  if (!isRedirectFlow) {
    const bc = new BroadcastChannel(channel, broadcastChannelOptions);
    await bc.postMessage({
      data: { type: POPUP_RESULT, approve: true },
    });
    bc.close();
  } else {
    let res: string | string[] | Transaction | undefined;
    try {
      if (method === "send_transaction" && tx.value) {
        res = await ControllerModule.torus.transfer(tx.value, params);
        redirectToResult(jsonrpc, { data: { signature: res }, method, success: true }, req_id, resolveRoute);
      } else if (method === "sign_transaction" && tx.value) {
        res = ControllerModule.torus.UNSAFE_signTransaction(tx.value);
        redirectToResult(
          jsonrpc,
          { data: { signature: res.serialize({ requireAllSignatures: false }).toString("hex") }, method, success: true },
          req_id,
          resolveRoute
        );
      } else if (method === "sign_all_transactions") {
        res = await ControllerModule.torus.UNSAFE_signAllTransactions({ params } as any);
        redirectToResult(jsonrpc, { data: { signatures: res }, method, success: true }, req_id, resolveRoute);
      } else throw new Error();
    } catch (e) {
      redirectToResult(jsonrpc, { success: false, method, error: (e as Error).message }, req_id, resolveRoute);
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
    redirectToResult(jsonrpc, { success: false, method }, req_id, resolveRoute);
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
    :network="network"
    @on-close-modal="closeModal()"
    @transfer-confirm="approveTxn()"
    @transfer-cancel="rejectTxn()"
  />
  <PermissionsTx
    v-else-if="decodedInst"
    :decoded-inst="decodedInst || []"
    :origin="origin"
    :network="network"
    @on-close-modal="closeModal()"
    @on-approved="approveTxn()"
    @on-cancel="rejectTxn()"
  />
</template>

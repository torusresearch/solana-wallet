<script setup lang="ts">
import { Connection, LAMPORTS_PER_SOL, SystemInstruction, SystemProgram, Transaction } from "@solana/web3.js";
import { addressSlicer, BROADCAST_CHANNELS, BroadcastChannelHandler, broadcastChannelOptions, POPUP_RESULT } from "@toruslabs/base-controllers";
import { BigNumber } from "bignumber.js";
import { BroadcastChannel } from "broadcast-channel";
import log from "loglevel";
import { onMounted, reactive, ref } from "vue";

import { PaymentConfirm } from "@/components/payments";
import PermissionsTx from "@/components/permissionsTx/PermissionsTx.vue";
import { TransactionChannelDataType } from "@/utils/enums";
import { redirectToResult, useRedirectFlow } from "@/utils/helpers";
import { DecodedDataType, decodeInstruction } from "@/utils/instruction_decoder";

import ControllerModule from "../modules/controllers";

const channel = `${BROADCAST_CHANNELS.TRANSACTION_CHANNEL}_${new URLSearchParams(window.location.search).get("instanceId")}`;

const { isRedirectFlow, params, method, resolveRoute } = useRedirectFlow();

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
    let txData: Partial<TransactionChannelDataType>;
    if (!isRedirectFlow) {
      const bcHandler = new BroadcastChannelHandler(BROADCAST_CHANNELS.TRANSACTION_CHANNEL);
      txData = await bcHandler.getMessageFromChannel<TransactionChannelDataType>();
    } else if (method) {
      txData = {
        type: method,
        message: params?.message,
        signer: ControllerModule.selectedAddress,
        origin: window.origin,
        networkDetails: JSON.parse(JSON.stringify(ControllerModule.torus.state.NetworkControllerState.providerConfig)),
      };
    } else {
      redirectToResult(method, { message: "method not supplied" }, resolveRoute);
      return;
    }
    origin.value = txData.origin as string;

    // TODO: currently, controllers does not support multi transaction flow
    if (txData.type === "sign_all_transactions") {
      const decoded: DecodedDataType[] = [];
      (txData.message as string[]).forEach((msg) => {
        const tx2 = Transaction.from(Buffer.from(msg, "hex"));
        tx2.instructions.forEach((inst) => {
          decoded.push(decodeInstruction(inst));
        });
      });
      decodedInst.value = decoded;
      return;
    }

    const networkConfig = txData.networkDetails;

    tx.value = Transaction.from(Buffer.from(txData.message as string, "hex"));
    const conn = new Connection(networkConfig?.rpcTarget as string);
    const block = await conn.getRecentBlockhash("finalized");

    const isGasless = tx.value.feePayer?.toBase58() !== txData.signer;
    const txFee = isGasless ? 0 : block.feeCalculator.lamportsPerSignature;

    decodedInst.value = tx.value.instructions.map((inst) => {
      return decodeInstruction(inst);
    });

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
      finalTxData.networkDisplayName = txData.networkDetails?.displayName as string;
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
  } else {
    let res: string | string[] | Transaction | undefined;
    try {
      if (method === "send_transaction" && tx.value) {
        res = await ControllerModule.torus.transfer(tx.value, params);
        redirectToResult(method, res, resolveRoute);
      } else if (method === "sign_transaction" && tx.value) {
        res = ControllerModule.torus.signTransaction(tx.value);
        redirectToResult(method, res, resolveRoute);
      } else if (method === "sign_all_transactions") {
        log.info(params.message);
        res = await ControllerModule.torus.signAllTransaction({ params } as any, true);
        redirectToResult(method, res, resolveRoute);
      } else throw new Error();
    } catch (e) {
      redirectToResult(method, `failed to execute ${method} : ${e}`, resolveRoute);
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

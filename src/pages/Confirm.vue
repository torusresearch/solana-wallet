<script setup lang="ts">
import { Connection, LAMPORTS_PER_SOL, SystemInstruction, SystemProgram } from "@solana/web3.js";
import { addressSlicer, BROADCAST_CHANNELS, BroadcastChannelHandler, broadcastChannelOptions, POPUP_RESULT } from "@toruslabs/base-controllers";
import { BigNumber } from "bignumber.js";
import { BroadcastChannel } from "broadcast-channel";
import log from "loglevel";
import { onMounted, reactive, ref } from "vue";

import { PaymentConfirm } from "@/components/payments";
import PermissionsTx from "@/components/permissionsTx/PermissionsTx.vue";
import ControllerModule from "@/modules/controllers";
import { TransactionChannelDataType } from "@/utils/enums";
import { delay } from "@/utils/helpers";
import { DecodedDataType, decodeInstruction } from "@/utils/instruction_decoder";
import { SolAndSplToken } from "@/utils/interfaces";

const channel = `${BROADCAST_CHANNELS.TRANSACTION_CHANNEL}_${new URLSearchParams(window.location.search).get("instanceId")}`;
const hasEstimationError = ref(false);
const estimatedBalanceChange = ref(0);
interface FinalTxData {
  slicedSenderAddress: string;
  slicedReceiverAddress: string;
  totalSolAmount: number;
  totalNetworkFee: number;
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
  totalNetworkFee: 0,
  totalFiatAmount: "",
  totalFiatFee: "",
  transactionType: "",
  totalSolCost: "",
  totalFiatCost: "",
  networkDisplayName: "",
  isGasless: false,
});

const decodedInst = ref<DecodedDataType[]>();
const origin = ref("");
onMounted(async () => {
  try {
    const bcHandler = new BroadcastChannelHandler(BROADCAST_CHANNELS.TRANSACTION_CHANNEL);
    const txData = await bcHandler.getMessageFromChannel<TransactionChannelDataType>();
    const networkConfig = txData.networkDetails;

    // const tx = Transaction.from(Buffer.from(txData.message, "hex"));
    await delay(5000);
    const token = ControllerModule.fungibleTokens[0];
    const tx = await ControllerModule.torus.getTransferSplTransaction(
      "Dg2iGY6UBnb6FeWurZZy16Psi2qgdYFtonNbjhTVfPG1",
      10 ** 9,
      token as SolAndSplToken
    );
    log.info("XYZ", token);
    try {
      hasEstimationError.value = false;
      estimatedBalanceChange.value = await ControllerModule.torus.getEstimateBalanceChange(tx);
      log.info("PR", estimatedBalanceChange.value);
    } catch (e) {
      log.error("PRFAILES");
      hasEstimationError.value = true;
    }
    const conn = new Connection(networkConfig.rpcTarget);
    const block = await conn.getRecentBlockhash("finalized");

    const isGasless = tx.feePayer?.toBase58() !== txData.signer;
    const txFee = isGasless ? 0 : block.feeCalculator.lamportsPerSignature;

    decodedInst.value = tx.instructions.map((inst) => {
      return decodeInstruction(inst);
    });
    origin.value = txData.origin;

    try {
      if (tx.instructions.length > 1) return;
      if (!tx.instructions[0].programId.equals(SystemProgram.programId)) return;
      if (SystemInstruction.decodeInstructionType(tx.instructions[0]) !== "Transfer") return;
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
      finalTxData.totalNetworkFee = new BigNumber(txFee).div(LAMPORTS_PER_SOL).toNumber();
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
    v-if="finalTxData.totalSolAmount"
    :is-open="true"
    :sender-pub-key="finalTxData.slicedSenderAddress"
    :receiver-pub-key="finalTxData.slicedReceiverAddress"
    :crypto-amount="finalTxData.totalSolAmount"
    :crypto-tx-fee="finalTxData.totalNetworkFee"
    :is-gasless="finalTxData.isGasless"
    :decoded-inst="decodedInst || []"
    :estimated-balance-change="estimatedBalanceChange"
    :has-estimation-error="hasEstimationError"
    @on-close-modal="rejectTxn()"
    @transfer-confirm="approveTxn()"
  />
  <PermissionsTx
    v-else-if="decodedInst"
    :decoded-inst="decodedInst || []"
    :origin="origin"
    :estimated-balance-change="estimatedBalanceChange"
    :has-estimation-error="hasEstimationError"
    @on-close-modal="rejectTxn()"
    @on-approved="approveTxn()"
  />
</template>

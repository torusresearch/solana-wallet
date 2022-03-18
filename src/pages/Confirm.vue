<script setup lang="ts">
import { Connection, LAMPORTS_PER_SOL, Message, SignaturePubkeyPair, SystemInstruction, SystemProgram, Transaction } from "@solana/web3.js";
import {
  addressSlicer,
  BROADCAST_CHANNELS,
  BroadcastChannelHandler,
  broadcastChannelOptions,
  POPUP_RESULT,
  ProviderConfig,
} from "@toruslabs/base-controllers";
import { BigNumber } from "bignumber.js";
import { BroadcastChannel } from "broadcast-channel";
import log from "loglevel";
import { onMounted, reactive, ref } from "vue";

// import { PaymentConfirm } from "@/components/payments";
import TransactionConfirm from "@/components/payments/TransactionConfirm.vue";
import PermissionsInvalid from "@/components/permissionsInvalid/PermissionsInvalid.vue";
// import PermissionsTx from "@/components/permissionsTx/PermissionsTx.vue";
import ControllerModule from "@/modules/controllers";
import { TransactionChannelDataType } from "@/utils/enums";
import { DecodedDataType, decodeInstruction } from "@/utils/instruction_decoder";
import { AccountEstimation } from "@/utils/interfaces";
import { redirectToResult, useRedirectFlow } from "@/utils/redirectflow_helpers";

const { isRedirectFlow, params, method, jsonrpc, req_id, resolveRoute } = useRedirectFlow();

const channel = `${BROADCAST_CHANNELS.TRANSACTION_CHANNEL}_${new URLSearchParams(window.location.search).get("instanceId")}`;
const estimationInProgress = ref(false);
const hasEstimationError = ref("");
const estimatedBalanceChange = ref<AccountEstimation[]>([]);
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

const tx = ref<Transaction>();
const decodedInst = ref<DecodedDataType[]>();
const origin = ref("");
const network = ref("");

const signTxOnly = ref(false);
const signatureNotRequired = ref(false);

const estimate = async (conn: Connection, estimateTx: Transaction, signer: string) => {
  estimationInProgress.value = true;
  try {
    hasEstimationError.value = "";
    estimatedBalanceChange.value = await ControllerModule.torus.getEstimateBalanceChange(conn, estimateTx, signer);
    log.info("TransEstim", estimatedBalanceChange.value);
  } catch (e) {
    log.error("TransEstim", e);
    hasEstimationError.value = "Unable estimate balance changes";
  }
  estimationInProgress.value = false;
};

const getFees = async (conn: Connection, messages: Message[]) => {
  const feePromises = messages.map((item) => conn.getFeeForMessage(item, "max"));
  const fees = await Promise.all(feePromises);
  finalTxData.totalNetworkFee = fees.reduce((acc, item) => acc + item.value, 0) / LAMPORTS_PER_SOL;
};

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
        signer: ControllerModule.selectedAddress,
        origin: window.origin,
      };
    } else {
      redirectToResult(jsonrpc, { message: "Invalid or Missing Params", method }, req_id, resolveRoute);
      return;
    }

    origin.value = txData.origin as string;
    network.value = txData.network || "";
    const networkConfig = txData.networkDetails as ProviderConfig;
    const conn = new Connection(networkConfig.rpcTarget as string);

    log.info(txData);
    signTxOnly.value = ["sign_transaction", "sign_all_transactions"].includes(txData.type as string);

    // TODO: currently, controllers does not support multi transaction flow
    if (txData.type === "sign_all_transactions") {
      const decoded: DecodedDataType[] = [];
      const signer: SignaturePubkeyPair[] = [];

      const transactionList: Transaction[] = [];

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

        const isGasless = tx2.feePayer ? tx2.feePayer.toBase58() !== txData.signer : false;
        // if (!isGasless) messages.push(transactionItem.compileMessage());
        if (!isGasless) transactionList.push(tx2);

        // check for signer is wallet address
        signer.push(
          ...tx2.signatures.filter((signPair) => {
            return signPair.publicKey?.toBase58() === txData.signer;
          })
        );
      });

      getFees(
        conn,
        transactionList.map((item) => item.compileMessage())
      );

      hasEstimationError.value = "Unable estimate changes";
      decodedInst.value = decoded;
      return;
    }

    if (txData.messageOnly) {
      tx.value = Transaction.populate(Message.from(Buffer.from(txData.message as string, "hex")));
    } else {
      tx.value = Transaction.from(Buffer.from(txData.message as string, "hex"));
    }

    // estimate balance changes
    estimate(conn, tx.value, txData.signer || "");
    // compute fees
    getFees(conn, [tx.value.compileMessage()]);

    const isGasless = tx.value.feePayer ? tx.value.feePayer.toBase58() !== txData.signer : false;
    finalTxData.isGasless = isGasless;

    decodedInst.value = tx.value.instructions.map((inst) => {
      return decodeInstruction(inst);
    });

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
      if (from.toBase58() !== txData.signer) return;

      const to = decoded[0].toPubkey;

      const txAmount = decoded[0].lamports;

      // const totalSolCost = new BigNumber(txFee).plus(txAmount).div(LAMPORTS_PER_SOL);
      finalTxData.slicedSenderAddress = addressSlicer(from.toBase58());
      finalTxData.slicedReceiverAddress = addressSlicer(to.toBase58());
      finalTxData.totalSolAmount = new BigNumber(txAmount).div(LAMPORTS_PER_SOL).toNumber();
      // finalTxData.totalSolCost = totalSolCost.toString();
      finalTxData.transactionType = "";
      finalTxData.networkDisplayName = txData.networkDetails?.displayName as string;
    } catch (e) {
      log.error(e);
    }
  } catch (error) {
    log.error("error in tx", error);
  }
});

// Buttons / Events handler
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
      redirectToResult(jsonrpc, { success: false, method }, req_id, resolveRoute);
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
  <div
    :class="{ dark: ControllerModule.isDarkMode }"
    class="w-full h-full overflow-hidden bg-white dark:bg-app-gray-600 flex items-center justify-center"
  >
    <PermissionsInvalid v-if="signatureNotRequired" :origin="origin" @on-close-modal="rejectTxn()" />
    <!-- <PaymentConfirm
      v-else-if="finalTxData.totalSolAmount && !signTxOnly"
      :is-open="true"
      :sender-pub-key="finalTxData.slicedSenderAddress"
      :receiver-pub-key="finalTxData.slicedReceiverAddress"
      :crypto-amount="finalTxData.totalSolAmount"
      :crypto-tx-fee="finalTxData.totalNetworkFee"
      :is-gasless="finalTxData.isGasless"
      :decoded-inst="decodedInst || []"
      :estimation-in-progress="estimationInProgress"
      :estimated-balance-change="estimatedBalanceChange"
      :has-estimation-error="hasEstimationError"
      :network="network"
      @on-close-modal="rejectTxn()"
      @transfer-confirm="approveTxn()"
      @transfer-cancel="rejectTxn()"
    /> -->
    <TransactionConfirm
      v-else-if="decodedInst || signTxOnly"
      :decoded-inst="decodedInst || []"
      :origin="origin"
      :estimation-in-progress="estimationInProgress"
      :estimated-balance-change="estimatedBalanceChange"
      :has-estimation-error="hasEstimationError"
      :sign-tx-only="signTxOnly"
      :tx-fee="finalTxData.totalNetworkFee"
      :is-gasless="finalTxData.isGasless"
      :network="network"
      @on-close-modal="rejectTxn()"
      @transfer-confirm="approveTxn()"
      @transfer-cancel="rejectTxn()"
    />
    <!-- <PermissionsTx
      v-else-if="decodedInst || signTxOnly"
      :decoded-inst="decodedInst || []"
      :origin="origin"
      :estimation-in-progress="estimationInProgress"
      :estimated-balance-change="estimatedBalanceChange"
      :has-estimation-error="hasEstimationError"
      :sign-tx-only="signTxOnly"
      :tx-fee="finalTxData.totalNetworkFee"
      :is-gasless="finalTxData.isGasless"
      :network="network"
      @on-close-modal="rejectTxn()"
      @on-approved="approveTxn()"
      @on-cancel="rejectTxn()"
    /> -->
  </div>
</template>

<script setup lang="ts">
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, Message, SystemInstruction, Transaction } from "@solana/web3.js";
import { addressSlicer, BROADCAST_CHANNELS, BroadcastChannelHandler, broadcastChannelOptions, POPUP_RESULT } from "@toruslabs/base-controllers";
import Button from "@toruslabs/vue-components/common/Button.vue";
import { WiFiIcon } from "@toruslabs/vue-icons/connection";
// import { decimal } from "@vuelidate/validators";
import { BigNumber } from "bignumber.js";
import { BroadcastChannel } from "broadcast-channel";
// import { DeployUtil, encodeBase16 } from "casper-js-sdk";
import log from "loglevel";
import { onMounted, reactive } from "vue";

import SolanaLightLogoURL from "@/assets/solana-dark.svg";
import SolanaLogoURL from "@/assets/solana-light.svg";
import SolanaLogo from "@/assets/solana-mascot.svg";
import { TextField } from "@/components/common";
import { app } from "@/modules/app";
import { TransactionChannelDataType } from "@/utils/enums";
const channel = `${BROADCAST_CHANNELS.TRANSACTION_CHANNEL}_${new URLSearchParams(window.location.search).get("instanceId")}`;

interface FinalTxData {
  slicedSenderAddress: string;
  slicedReceiverAddress: string;
  totalCsprAmount: string;
  totalCsprFee: string;
  totalFiatAmount: string;
  totalFiatFee: string;
  transactionType: string;
  totalCsprCost: string;
  totalFiatCost: string;
  networkDisplayName: string;
}
let finalTxData = reactive<FinalTxData>({
  slicedSenderAddress: "",
  slicedReceiverAddress: "",
  totalCsprAmount: "",
  totalCsprFee: "",
  totalFiatAmount: "",
  totalFiatFee: "",
  transactionType: "",
  totalCsprCost: "",
  totalFiatCost: "",
  networkDisplayName: "",
});

// type: req.method,
// message: req.params?.message || "",
// // txParams: JSON.parse(JSON.stringify(this.txController.getTransaction(txId))),
// origin: this.preferencesController.iframeOrigin,
// balance: this.userSOLBalance,
// selectedCurrency: this.currencyController.state.currentCurrency,
// currencyRate: this.currencyController.state.conversionRate?.toString(),
// jwtToken: this.getAccountPreferences(this.selectedAddress)?.jwtToken || "",
// network: this.networkController.state.providerConfig.displayName,
// networkDetails: { providerConfig: JSON.parse(JSON.stringify(this.networkController.state.providerConfig)) },
onMounted(async () => {
  try {
    const bcHandler = new BroadcastChannelHandler(BROADCAST_CHANNELS.TRANSACTION_CHANNEL);
    const txData = await bcHandler.getMessageFromChannel<TransactionChannelDataType>();
    const msg = Message.from(Buffer.from(txData.message, "hex"));
    const tx = Transaction.populate(msg);

    const conn = new Connection(clusterApiUrl("testnet"));
    const block = await conn.getRecentBlockhash("finalized");

    const decoded = tx.instructions.map((inst) => {
      const decoded_inst = SystemInstruction.decodeTransfer(inst);
      return decoded_inst;
    });

    const from = decoded[0].fromPubkey; // encodeBase16(deserializedDeploy.header.account.toAccountHash()); // this is account hash of sender
    const to = decoded[0].toPubkey; // Buffer.from(deserializedDeploy.session.getArgByName("target")?.value())?.toString("hex"); // this is account hash of receiver
    const txFee = block.feeCalculator.lamportsPerSignature; // deserializedDeploy.payment.getArgByName("amount")?.value().toNumber() || 0;
    const txAmount = decoded[0].lamports; //deserializedDeploy.session.getArgByName("amount")?.value().toNumber() || 0;
    const totalCsprCost = new BigNumber(txFee).plus(txAmount).div(LAMPORTS_PER_SOL);
    // const totalCurrencyAmount = totalAmount.multipliedBy(currencyData.conversionRate);
    // const totalAmountString = formatSmallNumbers(totalAmount.toNumber(), currencyData.networkNativeCurrency.toUpperCase(), true);
    // const currencyAmountString = formatSmallNumbers(totalCurrencyAmount.toNumber(), currencyData.selectedCurrency, true);
    finalTxData.slicedSenderAddress = addressSlicer(from.toBase58());
    finalTxData.slicedReceiverAddress = addressSlicer(to.toBase58());
    finalTxData.totalCsprAmount = new BigNumber(txAmount).div(10 ** 9).toString();
    finalTxData.totalCsprFee = new BigNumber(txFee).div(10 ** 9).toString();
    // finalTxData.totalFiatAmount = "";
    // finalTxData.totalFiatFee = "";
    finalTxData.totalCsprCost = totalCsprCost.toString();
    finalTxData.transactionType = "";
    finalTxData.networkDisplayName = txData.networkDetails?.displayName;
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
  <div class="min-h-screen bg-white dark:bg-app-gray-700 flex justify-center items-center">
    <div class="items-center">
      <div class="shadow dark:shadow-dark text-center py-6">
        <div><img class="h-7 mx-auto w-auto mb-1" :src="app.isDarkMode ? SolanaLightLogoURL : SolanaLogoURL" alt="Casper Logo" /></div>
        <div class="font-header text-lg font-bold text-app-text-500 dark:text-app-text-dark-500">Confirm Transaction</div>
      </div>
      <div class="p-5">
        <div class="flex items-center">
          <div class="pl-5 flex-none">
            <div class="flex justify-center border border-app-gray-400 dark:border-transparent shadow dark:shadow-dark2 rounded-full w-12 h-12">
              <img class="w-10" :src="app.isDarkMode ? SolanaLogo : SolanaLogo" alt="Casper Logo" />
            </div>
          </div>
          <div class="flex-grow">
            <hr />
          </div>
          <div class="pr-5 flex-none">
            <div class="flex justify-center border border-app-gray-400 dark:border-transparent shadow dark:shadow-dark2 rounded-full w-12 h-12">
              <img class="w-10" :src="app.isDarkMode ? SolanaLogo : SolanaLogo" alt="Casper Logo" />
            </div>
          </div>
        </div>
        <div class="flex mt-1">
          <div class="flex-none w-20 text-center">
            <div class="overflow-ellipsis truncate text-xxs text-app-text-500 dark:text-app-text-dark-500">
              {{ finalTxData.slicedSenderAddress }}
            </div>
          </div>
          <div class="flex-grow text-xs text-app-text-500 dark:text-app-text-dark-500 flex items-center justify-center -mt-14">
            <WiFiIcon class="w-3 h-3 mr-1" /> {{ finalTxData.networkDisplayName }}
          </div>
          <div class="flex-none w-20 text-center">
            <div class="overflow-ellipsis truncate text-xxs text-app-text-500 dark:text-app-text-dark-500">
              {{ finalTxData.slicedReceiverAddress }}
            </div>
          </div>
        </div>
        <hr class="my-5" />
        <div>
          <div class="grid grid-cols-3 items-center mb-4">
            <div class="col-span-1 font-body text-xs text-app-text-600 dark:text-app-text-dark-500">Amount</div>
            <div class="col-span-2"><TextField v-model="finalTxData.totalCsprAmount" type="number" /></div>
          </div>
          <div class="grid grid-cols-3 items-center mb-4">
            <div class="col-span-1 font-body text-xs text-app-text-600 dark:text-app-text-dark-500">Transaction Fee</div>
            <div class="col-span-2"><TextField v-model="finalTxData.totalCsprFee" type="number" /></div>
          </div>
          <hr class="mb-6" />
          <div class="grid grid-cols-3 items-center mb-4">
            <div class="col-span-1 font-body text-xs text-app-text-600 dark:text-app-text-dark-500">Total Cost</div>
            <div class="col-span-2"><TextField v-model="finalTxData.totalCsprCost" disabled type="number" /></div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 m-6">
        <div><Button class="ml-auto" block variant="tertiary" @click="rejectTxn()">Cancel</Button></div>
        <div><Button class="ml-auto" block variant="primary" @click="approveTxn()">Confirm</Button></div>
      </div>
    </div>
  </div>
</template>

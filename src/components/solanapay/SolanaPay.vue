<script setup lang="ts">
import { createTransaction, ParsedURL, parseURL } from "@solana/pay";
import { PublicKey, Transaction } from "@solana/web3.js";
import { addressSlicer } from "@toruslabs/base-controllers";
import log from "loglevel";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import ControllerModule from "@/modules/controllers";
import { parseSolanaPayRequestLink } from "@/utils/helpers";
import { DecodedDataType } from "@/utils/instruction_decoder";

import PermissionsTx from "../permissionsTx/PermissionsTx.vue";

const { t } = useI18n();
const props = withDefaults(
  defineProps<{
    requestLink: string;
  }>(),
  {}
);

const invalidLink = ref(false);
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

onMounted(async () => {
  // set loading
  invalidLink.value = false;
  const { requestLink } = props;
  // requestLink = "solana:http://localhost:4022/solanapay";
  try {
    if (!requestLink.length) {
      // set loaded
      invalidLink.value = true;
    } else if (isUrl(requestLink)) {
      const targetLink = requestLink.slice("solana:".length);
      const result = await parseSolanaPayRequestLink(targetLink, ControllerModule.selectedAddress);
      log.info(result);
      transaction.value = result.transaction;
      linkParams.value = result;
    } else {
      const result = parseURL(requestLink);
      const { recipient, splToken, reference, memo, amount } = result;
      if (!amount) {
        throw new Error("Invalid Amount", amount);
      }
      if (splToken) {
        const tokenInfo = await ControllerModule.torus.getTokenInfo(splToken.toBase58());
        if (tokenInfo.symbol) symbol.value = tokenInfo.symbol;
      }

      const tx = await createTransaction(ControllerModule.connection, new PublicKey(ControllerModule.selectedAddress), recipient, amount, {
        splToken,
        reference,
        memo,
      });
      transaction.value = tx;
      requestParams.value = result;
      log.info(result);
    }
  } catch (e) {
    invalidLink.value = true;
    log.error(e);
  }
});
</script>

<template>
  <div v-if="invalidLink" class="container">
    <div class="wrapper">
      <p>Invalid Link</p>
      <button @click="onCancel">Go Back</button>
    </div>
  </div>

  <div v-else-if="requestParams" class="container">
    <div class="wrapper w-full gt-xs:w-96">
      <div>Label {{ requestParams?.label }}</div>
      <div class="amount">{{ requestParams?.amount }} {{ symbol || addressSlicer(requestParams?.splToken?.toBase58() || "SOL") }}</div>
      <div>Pay to {{ addressSlicer(requestParams?.recipient.toBase58()) }}</div>
      <div>Memo {{ requestParams?.memo }}</div>
      <div>Message {{ requestParams?.message }}</div>
      <hr class="mx-6 mt-auto" />
      <div class="flex flex-row items-center my-4 mx-4">
        <Button class="flex-auto mx-1" :block="true" variant="tertiary" @click="onCancel">{{ t("dappTransfer.cancel") }}</Button>
        <Button class="flex-auto mx-1" :block="true" variant="primary" @click="onConfirm">{{ t("dappTransfer.approve") }}</Button>
      </div>
    </div>
  </div>
  <PermissionsTx
    v-else-if="linkParams"
    :decoded-inst="linkParams.decodedInst"
    :network="ControllerModule.selectedNetworkDisplayName"
    :logo-url="linkParams.icon"
    :origin="linkParams.label"
    @on-approved="onConfirm"
    @on-cancel="onCancel"
    @on-close-modal="onCancel"
  />
  <div v-else class="container">
    <div class="wrapper w-full md:w-96">Loading</div>
  </div>
</template>

<style>
.container {
  height: 100%;
  width: 100%;
  @apply flex flex-col justify-center items-center;
}
.wrapper {
  @apply gt-xs:w-96;
  @apply overflow-hidden align-middle transform shadow-xl flex-col justify-center items-center dark:shadow-dark bg-white dark:bg-app-gray-700 text-center py-6;
}
</style>

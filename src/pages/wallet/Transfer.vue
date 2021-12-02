<script setup lang="ts">
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { LAMPORTS_PER_SOL, ParsedAccountData, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useVuelidate } from "@vuelidate/core";
import { helpers, maxValue, minValue, required } from "@vuelidate/validators";
import log from "loglevel";
import { computed, defineAsyncComponent, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { Button, Card, SelectField, TextField } from "@/components/common";
// import MessageModal from "@/components/common/MessageModal.vue";
import { SolAndSplToken, tokens } from "@/components/transfer/token-helper";
import ControllersModule from "@/modules/controllers";
import { ALLOWED_VERIFIERS, ALLOWED_VERIFIERS_ERRORS, STATUS_ERROR, STATUS_INFO, STATUS_TYPE, TransferType } from "@/utils/enums";
import { delay, ruleVerifierId } from "@/utils/helpers";

// const ensError = ref("");
const isOpen = ref(false);
const transferType = ref<TransferType>(ALLOWED_VERIFIERS[0]);
const transferTo = ref("");
const sendAmount = ref(0);
const transferId = ref("");
const transactionFee = ref(0);
const blockhash = ref("");
const selectedVerifier = ref("solana");
const transferDisabled = ref(true);

const transferTypes = ALLOWED_VERIFIERS;
const selectedToken = ref<Partial<SolAndSplToken>>(tokens.value[0]);
const transferConfirmed = ref(false);
const router = useRouter();
const route = useRoute();

const AsyncWalletBalance = defineAsyncComponent({
  loader: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "WalletBalance" */ "@/components/WalletBalance.vue"),
});
const AsyncTransferConfirm = defineAsyncComponent({
  loader: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "TransferConfirm" */ "@/components/transfer/TransferConfirm.vue"),
});
const AsyncTransferTokenSelect = defineAsyncComponent({
  loader: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "TransferTokenSelect" */ "@/components/transfer/TransferTokenSelect.vue"),
});
const AsyncMessageModal = defineAsyncComponent({
  loader: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "MessageModal" */ "@/components/common/MessageModal.vue"),
});

onMounted(() => {
  const { query } = route;
  if (query.ticker) {
    const el = tokens.value.find((x) => x.symbol === query.ticker);
    selectedToken.value = el || tokens.value[0];
  }
});

const messageModalState = reactive({
  showMessage: false,
  messageTitle: "",
  messageDescription: "",
  messageStatus: STATUS_INFO as STATUS_TYPE,
});

const validVerifier = (value: string) => {
  if (!transferType.value) return true;
  return ruleVerifierId(transferType.value.value, value);
};

const tokenAddressVerifier = async (value: string) => {
  // if not selected token, It is possible transfering sol, skip token address check
  if (!selectedToken?.value?.mintAddress) {
    return true;
  }

  const mintAddress = new PublicKey(selectedToken.value.mintAddress || "");
  let associatedAccount = new PublicKey(value);
  // try generate associatedAccount. if it failed, it might be token associatedAccount
  try {
    associatedAccount = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mintAddress, associatedAccount);
  } catch (e) {
    log.info("failed to generate associatedAccount, account key in might be associatedAccount");
  }

  const accountInfo = await ControllersModule.torus.connection.getParsedAccountInfo(associatedAccount);
  log.info(accountInfo);
  // check if the assoc account is (owned by) token selected
  if (accountInfo.value?.owner.equals(TOKEN_PROGRAM_ID)) {
    const data = accountInfo.value.data as ParsedAccountData;
    if (new PublicKey(data.parsed.info.mint).toBase58() === mintAddress.toBase58()) {
      return true;
    }
  } else if (associatedAccount.toBase58() !== value) {
    // this is new assoc account ( new assoc account generated, key in value is main sol account)
    return true;
  }
  return false;
};

const getErrorMessage = () => {
  const selectedType = transferType.value?.value || "";
  if (!selectedType) return "";
  return ALLOWED_VERIFIERS_ERRORS[selectedType];
};

const getTokenBalance = () => {
  if (selectedToken.value.symbol?.toUpperCase() === "SOL") return Number(ControllersModule.solBalance);
  return selectedToken.value.balance?.uiAmount || 0;
};

const rules = computed(() => {
  return {
    transferTo: {
      validTransferTo: helpers.withMessage(getErrorMessage, validVerifier),
      // ensRule: helpers.withMessage(ensError.value, ensRule),
      required: helpers.withMessage("Required", required),
      tokenAddress: helpers.withMessage("Invalid token account address", helpers.withAsync(tokenAddressVerifier)),
    },
    sendAmount: {
      greaterThanZero: helpers.withMessage("Must be greater than 0.0001", minValue(0.0001)),
      lessThanBalance: helpers.withMessage("Must less than your balances", maxValue(getTokenBalance())),
    },
    // transferId: { required },
    // transactionFee: { greaterThanZero: helpers.withMessage("Must be greater than zero", minValue(1)) },
  };
});

const $v = useVuelidate(rules, { transferTo, transferId, sendAmount, transactionFee });

const showMessageModal = (params: { messageTitle: string; messageDescription?: string; messageStatus: STATUS_TYPE }) => {
  const { messageDescription, messageTitle, messageStatus } = params;
  messageModalState.messageDescription = messageDescription || "";
  messageModalState.messageTitle = messageTitle;
  messageModalState.messageStatus = messageStatus;
  messageModalState.showMessage = true;
};

const onMessageModalClosed = () => {
  messageModalState.showMessage = false;
  messageModalState.messageDescription = "";
  messageModalState.messageTitle = "";
  messageModalState.messageStatus = STATUS_INFO;
  if (transferConfirmed.value) {
    router.push("/wallet/activity");
  }
};

const closeModal = () => {
  isOpen.value = false;
};

const openModal = async () => {
  $v.value.$touch();
  if (!$v.value.$invalid) isOpen.value = true;

  const { b_hash, fee } = await ControllersModule.torus.calculateTxFee();
  blockhash.value = b_hash;
  transactionFee.value = fee / LAMPORTS_PER_SOL;
  transferDisabled.value = false;
};

const confirmTransfer = async () => {
  // Delay needed for the message modal
  await delay(500);
  try {
    if (selectedToken?.value?.mintAddress) {
      // SPL TRANSFER
      await ControllersModule.torus.transferSpl(
        transferTo.value,
        sendAmount.value * 10 ** (selectedToken?.value?.data?.decimals || 0),
        selectedToken?.value?.mintAddress.toString()
      );
    } else {
      // SOL TRANSFER
      const instuctions = SystemProgram.transfer({
        fromPubkey: new PublicKey(ControllersModule.selectedAddress),
        toPubkey: new PublicKey(transferTo.value),
        lamports: sendAmount.value * LAMPORTS_PER_SOL,
      });
      const tx = new Transaction({ recentBlockhash: blockhash.value }).add(instuctions);
      const res = await ControllersModule.torus.transfer(tx);
      log.info(res);
    }
    // resetForm();
    transferConfirmed.value = true;
    showMessageModal({ messageTitle: "Your transfer is being processed.", messageStatus: STATUS_INFO });
  } catch (error) {
    showMessageModal({
      messageTitle: `Fail to submit transaction: ${(error as Error)?.message || "Something went wrong"}`,
      messageStatus: STATUS_ERROR,
    });
  }
};

function updateSelectedToken($event: Partial<SolAndSplToken>) {
  transferTo.value = "";
  sendAmount.value = 0;
  selectedToken.value = $event;
}
</script>

<template>
  <div class="py-2">
    <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
      <Card class="order-2 sm:order-1">
        <form action="#" method="POST">
          <div>
            <AsyncTransferTokenSelect class="mb-6" :selected-token="selectedToken" @update:selected-token="updateSelectedToken($event)" />
            <div class="grid grid-cols-3 gap-3 mb-6">
              <div class="col-span-3 sm:col-span-2">
                <TextField v-model="transferTo" label="Send to" :errors="$v.transferTo.$errors" />
              </div>
              <div class="col-span-3 sm:col-span-1">
                <SelectField v-model="transferType" :items="transferTypes" class="mt-0 sm:mt-6" />
              </div>
            </div>

            <div class="mb-6">
              <TextField v-model="sendAmount" label="Amount" :errors="$v.sendAmount.$errors" type="number" />
            </div>
            <div class="flex">
              <Button class="ml-auto" :disabled="$v.$dirty && $v.$invalid" @click="openModal"><span class="text-base">Transfer</span></Button>
              <!-- :crypto-tx-fee="state.transactionFee" -->
              <!-- :transfer-disabled="$v.$invalid || $v.$dirty || $v.$error || !allRequiredValuesAvailable()" -->
              <AsyncTransferConfirm
                :sender-pub-key="ControllersModule.selectedAddress"
                :receiver-pub-key="transferTo"
                :crypto-amount="sendAmount"
                :receiver-verifier="selectedVerifier"
                :receiver-verifier-id="transferTo"
                :is-open="isOpen"
                :token-symbol="selectedToken?.data?.symbol || 'SOL'"
                :token="selectedToken"
                :crypto-tx-fee="transactionFee"
                :transfer-disabled="transferDisabled"
                @transfer-confirm="confirmTransfer"
                @on-close-modal="closeModal"
              />
            </div>
          </div>
        </form>
      </Card>
      <AsyncWalletBalance class="self-start order-1 sm:order-2" />
    </dl>
    <AsyncMessageModal
      :is-open="messageModalState.showMessage"
      :title="messageModalState.messageTitle"
      :description="messageModalState.messageDescription"
      :status="messageModalState.messageStatus"
      @on-close="onMessageModalClosed"
    />
  </div>
</template>

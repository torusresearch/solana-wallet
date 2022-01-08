<script setup lang="ts">
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { LAMPORTS_PER_SOL, ParsedAccountData, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useVuelidate } from "@vuelidate/core";
import { helpers, maxValue, minValue, required } from "@vuelidate/validators";
import log from "loglevel";
import { computed, defineAsyncComponent, onMounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import { Button, Card, ComboBox, SelectField, TextField } from "@/components/common";
import { nftTokens, tokens } from "@/components/transfer/token-helper";
import TransferNFT from "@/components/transfer/TransferNFT.vue";
import ControllerModule from "@/modules/controllers";
import { ALLOWED_VERIFIERS, ALLOWED_VERIFIERS_ERRORS, STATUS_ERROR, STATUS_INFO, STATUS_TYPE, TransferType } from "@/utils/enums";
import { delay, ruleVerifierId } from "@/utils/helpers";
import { SolAndSplToken } from "@/utils/interfaces";

const { t } = useI18n();

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
const showAmountField = ref(true);
const router = useRouter();
const route = useRoute();

const AsyncTokenBalance = defineAsyncComponent({
  loader: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "WalletBalance" */ "@/components/TokenBalance.vue"),
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
  if (query.mint) {
    const el = [...tokens.value, ...nftTokens.value].find((x) => x.mintAddress === query.mint);
    selectedToken.value = el || tokens.value[0];

    showAmountField.value = !!selectedToken.value.isFungible;
    sendAmount.value = 1;
  }
});

const contacts = computed(() =>
  ControllerModule.contacts.map((contact) => {
    return {
      text: `${contact.display_name} (${contact.contact_verifier_id})`,
      value: contact.contact_verifier_id,
    };
  })
);

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
  // if succeed generate associatedAccount, it is valid main Sol Account.
  try {
    associatedAccount = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mintAddress, associatedAccount);
    return true;
  } catch (e) {
    log.info("failed to generate associatedAccount, account key in might be associatedAccount");
  }

  const accountInfo = await ControllerModule.torus.connection.getParsedAccountInfo(associatedAccount);
  // check if the assoc account is (owned by) token selected
  if (accountInfo.value?.owner.equals(TOKEN_PROGRAM_ID)) {
    const data = accountInfo.value.data as ParsedAccountData;
    if (new PublicKey(data.parsed.info.mint).toBase58() === mintAddress.toBase58()) {
      return true;
    }
  }
  return false;
};

const nftVerifier = (value: number) => {
  if (!selectedToken.value.isFungible) {
    return Number.isInteger(value);
  }
  return true;
};

const getErrorMessage = () => {
  const selectedType = transferType.value?.value || "";
  if (!selectedType) return "";
  return t(ALLOWED_VERIFIERS_ERRORS[selectedType]);
};

const getTokenBalance = () => {
  if (selectedToken.value.symbol?.toUpperCase() === "SOL") return Number(ControllerModule.solBalance);
  return selectedToken.value.balance?.uiAmount || 0;
};
const rules = computed(() => {
  return {
    transferTo: {
      validTransferTo: helpers.withMessage(getErrorMessage, validVerifier),
      // ensRule: helpers.withMessage(ensError.value, ensRule),
      required: helpers.withMessage(t("walletTransfer.required"), required),
      tokenAddress: helpers.withMessage(t("walletTransfer.invalidAddress"), helpers.withAsync(tokenAddressVerifier)),
    },
    sendAmount: {
      greaterThanZero: helpers.withMessage(t("walletTransfer.minTransfer"), minValue(0.0001)),
      lessThanBalance: helpers.withMessage(t("walletTransfer.insufficientBalance"), maxValue(getTokenBalance())),
      nft: helpers.withMessage(t("walletTransfer.NFT"), nftVerifier),
    },
  };
});

const $v = useVuelidate(rules, {
  transferTo,
  transferId,
  sendAmount,
  transactionFee,
});

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

  const { b_hash, fee } = await ControllerModule.torus.calculateTxFee();
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
      await ControllerModule.torus.transferSpl(
        transferTo.value,
        sendAmount.value * 10 ** (selectedToken?.value?.data?.decimals || 0),
        selectedToken.value as SolAndSplToken
      );
    } else {
      // SOL TRANSFER
      const instuctions = SystemProgram.transfer({
        fromPubkey: new PublicKey(ControllerModule.selectedAddress),
        toPubkey: new PublicKey(transferTo.value),
        lamports: sendAmount.value * LAMPORTS_PER_SOL,
      });
      const tx = new Transaction({
        recentBlockhash: blockhash.value,
        feePayer: new PublicKey(ControllerModule.selectedAddress),
      }).add(instuctions);
      await ControllerModule.torus.transfer(tx);
    }
    // resetForm();
    transferConfirmed.value = true;
    showMessageModal({
      messageTitle: t("walletTransfer.transferSuccessTitle"),
      messageStatus: STATUS_INFO,
    });
  } catch (error) {
    showMessageModal({
      messageTitle: `${t("walletTransfer.submitFailed")}: ${(error as Error)?.message || t("walletSettings.somethingWrong")}`,
      messageStatus: STATUS_ERROR,
    });
  }
};

function updateSelectedToken($event: Partial<SolAndSplToken>) {
  if ($event.isFungible === false) {
    // new token selected is NFT
    showAmountField.value = false;
    sendAmount.value = 1;
  } else {
    // new token selected is SPL
    showAmountField.value = true;
    if (!selectedToken.value.isFungible) {
      // last selected token was NFT
      sendAmount.value = 0;
    }
  }
  selectedToken.value = $event;
}

// reset transfer token to solana if tokens no longer has current token
watch([tokens, nftTokens], () => {
  if (![...tokens.value, ...nftTokens.value].some((token) => token?.mintAddress === selectedToken.value?.mintAddress)) {
    updateSelectedToken(tokens.value[0]);
  }
});
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
                <ComboBox v-model="transferTo" :label="t('walletActivity.sendTo')" :errors="$v.transferTo.$errors" :items="contacts" />
              </div>
              <div class="col-span-3 sm:col-span-1">
                <SelectField v-model="transferType" :items="transferTypes" class="mt-0 sm:mt-6" />
              </div>
            </div>

            <div v-if="showAmountField" class="mb-6">
              <TextField v-model="sendAmount" :label="t('dappTransfer.amount')" :errors="$v.sendAmount.$errors" type="number" />
            </div>
            <div class="flex">
              <Button class="ml-auto" :disabled="$v.$dirty && $v.$invalid" @click="openModal"
                >{{ t("dappTransfer.transfer") }}<span class="text-base"></span
              ></Button>
              <!-- :crypto-tx-fee="state.transactionFee" -->
              <!-- :transfer-disabled="$v.$invalid || $v.$dirty || $v.$error || !allRequiredValuesAvailable()" -->
              <AsyncTransferConfirm
                :sender-pub-key="ControllerModule.selectedAddress"
                :receiver-pub-key="transferTo"
                :crypto-amount="sendAmount"
                :receiver-verifier="selectedVerifier"
                :receiver-verifier-id="transferTo"
                :token-symbol="selectedToken?.data?.symbol || 'SOL'"
                :token="selectedToken"
                :is-open="isOpen && selectedToken.isFungible"
                :crypto-tx-fee="transactionFee"
                :transfer-disabled="transferDisabled"
                @transfer-confirm="confirmTransfer"
                @on-close-modal="closeModal"
              />
              <TransferNFT
                :sender-pub-key="ControllerModule.selectedAddress"
                :receiver-pub-key="transferTo"
                :crypto-amount="sendAmount"
                :receiver-verifier="selectedVerifier"
                :receiver-verifier-id="transferTo"
                :is-open="isOpen && !selectedToken.isFungible"
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
      <AsyncTokenBalance v-if="selectedToken.isFungible" class="self-start order-1 sm:order-2" :selected-token="selectedToken" />
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

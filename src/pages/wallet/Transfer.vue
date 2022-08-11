<script setup lang="ts">
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { LAMPORTS_PER_SOL, ParsedAccountData, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useVuelidate } from "@vuelidate/core";
import { helpers, maxValue, minValue, required } from "@vuelidate/validators";
import { debounce } from "lodash-es";
import log from "loglevel";
import { computed, defineAsyncComponent, onMounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import { Button, Card, ComboBox, SelectField, TextField } from "@/components/common";
import { useEstimateChanges } from "@/components/payments/EstimateChangesComposable";
import { nftTokens, tokens } from "@/components/transfer/token-helper";
import { addressPromise, isOwnerEscrow } from "@/components/transfer/transfer-helper";
import TransferNFT from "@/components/transfer/TransferNFT.vue";
import { trackUserClick, TransferPageInteractions } from "@/directives/google-analytics";
import ControllerModule from "@/modules/controllers";
import { ALLOWED_VERIFIERS, ALLOWED_VERIFIERS_ERRORS, STATUS, STATUS_TYPE, TransferType } from "@/utils/enums";
import { delay } from "@/utils/helpers";
import { SolAndSplToken } from "@/utils/interfaces";
import { calculateTxFee, generateSPLTransaction, ruleVerifierId } from "@/utils/solanaHelpers";

const { t } = useI18n();

const snsError = ref("Account Does Not Exist");
const isOpen = ref(false);
const transferType = ref<TransferType>(ALLOWED_VERIFIERS[0]);
let snsAddressPromise: Promise<string | null>;
const transferToInternal = ref("");
const transferTo = ref("");
const resolvedAddress = ref<string>("");
const sendAmount = ref(0);
const transaction = ref<Transaction>();
const transactionFee = ref(0);
const blockhash = ref("");
const lastValidBlockHeight = ref(0);
const selectedVerifier = ref("solana");
const transferDisabled = ref(true);
const isSendAllActive = ref(false);
const isCurrencyFiat = ref(false);

const currency = computed(() => ControllerModule.torus.currentCurrency);
const solConversionRate = computed(() => {
  return ControllerModule.torus.conversionRate;
});

const transferTypes = ALLOWED_VERIFIERS;
const selectedToken = ref<Partial<SolAndSplToken>>(tokens.value[0]);
const transferConfirmed = ref(false);
const showAmountField = ref(true);
const router = useRouter();
const route = useRoute();

const AsyncTokenBalance = defineAsyncComponent({
  loader: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "TokenBalance" */ "@/components/TokenBalance.vue"),
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
const hasGeckoPrice = computed(() => selectedToken.value.symbol === "SOL" || !!selectedToken.value.price?.usd);

const { hasEstimationError, estimatedBalanceChange, estimationInProgress, estimateChanges } = useEstimateChanges();

onMounted(() => {
  const { query } = route;
  // Show mint if passed
  if (query.mint) {
    const el = [...tokens.value, ...nftTokens.value].find((x) => x.mintAddress === query.mint);
    selectedToken.value = el || tokens.value[0];

    showAmountField.value = !!selectedToken.value.isFungible;
    sendAmount.value = 1;
  }

  if (query.receiverPubKey) {
    resolvedAddress.value = query.receiverPubKey as string;
    transferTo.value = query.receiverPubKey as string;
    // eslint-disable-next-line prefer-destructuring
    transferType.value = ALLOWED_VERIFIERS[0];
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
  messageStatus: STATUS.INFO as STATUS_TYPE,
});

const validVerifier = (value: string) => {
  if (!transferType.value) return true;
  return ruleVerifierId(transferType.value.value, value);
};

async function escrowAccountVerifier(): Promise<boolean> {
  if (transferType.value.value === "sns") {
    return !(await isOwnerEscrow((await snsAddressPromise) as string));
  }
  return true;
}
const tokenAddressVerifier = async (value: string) => {
  if (!selectedToken?.value?.mintAddress) {
    return true;
  }

  const mintAddress = new PublicKey(selectedToken.value.mintAddress || "");
  let associatedAccount;

  if (transferType.value.value === "sns") {
    try {
      associatedAccount = new PublicKey((await snsAddressPromise) as string);
    } catch (e) {
      // since our sns validator will return false anyway
      return true;
    }
  }

  // if succeeds, we assume that the account is account key is correct.
  // Transfer in TorusController with derive the associated token address using the same function.
  associatedAccount = !associatedAccount ? new PublicKey(value) : associatedAccount;
  try {
    await getAssociatedTokenAddress(mintAddress, associatedAccount, false);
    return true;
  } catch (e) {
    log.info("failed to generate associatedAccount, account key in might be associatedAccount");
  }

  const accountInfo = await ControllerModule.torus.connection.getParsedAccountInfo(associatedAccount);
  // check if the assoc account is (owned by) token selected
  if (accountInfo.value?.owner.equals(TOKEN_PROGRAM_ID)) {
    const data = accountInfo.value.data as ParsedAccountData;
    if (new PublicKey(data.parsed.info.mint).equals(mintAddress)) {
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

async function snsRule(value: string): Promise<boolean> {
  if (!value) return true;
  if (transferType.value.value !== "sns") return true;
  try {
    const address = await snsAddressPromise;
    return address !== null;
  } catch (e) {
    return false;
  }
}

const getErrorMessage = () => {
  const selectedType = transferType.value?.value || "";
  if (!selectedType) return "";
  return t(ALLOWED_VERIFIERS_ERRORS[selectedType]);
};

/**
 * converts the cryptoValue from selected crypto currency to selected fiat currency
 * @param cryptoValue - amount of crypto
 */
function convertCryptoToFiat(cryptoValue = 1) {
  const selectedCrypto = selectedToken.value.symbol?.toLowerCase();
  const selectedFiat = (currency.value === "sol" ? "usd" : currency.value).toLowerCase();
  if (selectedCrypto === "sol") {
    return cryptoValue * solConversionRate.value;
  }
  return cryptoValue * (selectedToken.value?.price?.[selectedFiat] || 0);
}

const getTokenBalance = () => {
  if (selectedToken.value.symbol?.toUpperCase() === "SOL") return Number(ControllerModule.solBalance);
  return selectedToken.value.balance?.uiAmount || 0;
};
const rules = computed(() => {
  return {
    transferTo: {
      validTransferTo: helpers.withMessage(getErrorMessage, validVerifier),
      required: helpers.withMessage(t("walletTransfer.required"), required),
      addressExists: helpers.withMessage(snsError.value, helpers.withAsync(snsRule)),
      tokenAddress: helpers.withMessage(t("walletTransfer.invalidAddress"), helpers.withAsync(tokenAddressVerifier)),
      escrowAccount: helpers.withMessage(t("walletTransfer.escrowAccount"), helpers.withAsync(escrowAccountVerifier)),
    },
    sendAmount: {
      required: helpers.withMessage(t("walletTransfer.minTransfer"), required),
      greaterThanZero: helpers.withMessage(t("walletTransfer.minTransfer"), minValue(isCurrencyFiat.value ? convertCryptoToFiat(0.0001) : 0.0001)),
      lessThanBalance: helpers.withMessage(
        t("walletTransfer.insufficientBalance"),
        maxValue(isCurrencyFiat.value ? convertCryptoToFiat(getTokenBalance()) : getTokenBalance())
      ),
      nft: helpers.withMessage(t("walletTransfer.NFT"), nftVerifier),
    },
  };
});

const $v = useVuelidate(rules, { transferTo: transferToInternal, sendAmount });
/**
 * converts the fiatValue from selected fiat currency to selected crypto currency
 * @param fiatValue - amount of fiat
 */
function convertFiatToCrypto(fiatValue = 1) {
  const selectedCrypto = selectedToken.value.symbol?.toLowerCase();
  const selectedFiat = (currency.value === "sol" ? "usd" : currency.value).toLowerCase();
  if (selectedCrypto === "sol") {
    return fiatValue / solConversionRate.value;
  }
  return fiatValue / (selectedToken.value?.price?.[selectedFiat] || 1);
}

const generateTransaction = async (amount: number): Promise<Transaction> => {
  if (selectedToken?.value?.mintAddress) {
    // SPL TRANSFER
    transaction.value = await generateSPLTransaction(
      resolvedAddress.value,
      amount * 10 ** (selectedToken?.value?.data?.decimals || 0),
      selectedToken.value as SolAndSplToken,
      ControllerModule.selectedAddress,
      ControllerModule.connection
    );
  } else {
    // SOL TRANSFER
    const instuctions = SystemProgram.transfer({
      fromPubkey: new PublicKey(ControllerModule.selectedAddress),
      toPubkey: new PublicKey(resolvedAddress.value),
      lamports: amount * LAMPORTS_PER_SOL,
    });
    const latestBlockhash = await ControllerModule.connection.getLatestBlockhash();
    transaction.value = new Transaction({
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: lastValidBlockHeight.value,
      feePayer: new PublicKey(ControllerModule.selectedAddress),
    }).add(instuctions);
  }
  return transaction.value;
};

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
  messageModalState.messageStatus = STATUS.INFO;
  if (transferConfirmed.value) {
    router.push("/wallet/activity");
  }
};

const closeModal = () => {
  isOpen.value = false;
  trackUserClick(TransferPageInteractions.CANCEL);
  hasEstimationError.value = "";
  estimatedBalanceChange.value = [];
};

const openModal = async () => {
  transferDisabled.value = true;
  $v.value.$touch();
  resolvedAddress.value = transferTo.value;
  await $v.value.$validate();
  if (!$v.value.$invalid) {
    if (transferType.value.value === "sns") {
      const address = await addressPromise(transferType.value.value, transferTo.value); // doesn't throw
      if (address) {
        resolvedAddress.value = address;
      } else {
        return;
      }
    }

    isOpen.value = true;
    trackUserClick(TransferPageInteractions.INITIATE);
  }

  // This can't be guarantee

  const amount = isCurrencyFiat.value ? convertFiatToCrypto(sendAmount.value) : sendAmount.value;
  transaction.value = await generateTransaction(amount);
  estimateChanges(transaction.value, ControllerModule.connection, ControllerModule.selectedAddress);
  const { blockHash, fee, height } = await calculateTxFee(transaction.value.compileMessage(), ControllerModule.connection);
  blockhash.value = blockHash;
  lastValidBlockHeight.value = height;
  transactionFee.value = fee / LAMPORTS_PER_SOL;
  transferDisabled.value = false;
};

const confirmTransfer = async () => {
  trackUserClick(TransferPageInteractions.CONFIRM);
  // Delay needed for the message modal
  await delay(500);
  try {
    if (!transaction.value) throw new Error("Invalid Transaction");
    await ControllerModule.torus.transfer(transaction.value);
    // resetForm();
    transferConfirmed.value = true;
    showMessageModal({
      messageTitle: t("walletTransfer.transferSuccessTitle"),
      messageStatus: STATUS.INFO,
    });
  } catch (error) {
    log.error(error);
    showMessageModal({
      messageTitle: `${t("walletTransfer.submitFailed")}: ${(error as Error)?.message || t("walletSettings.somethingWrong")}`,
      messageStatus: STATUS.ERROR,
    });
  }
};

/**
 * usage: change the sendTo amount to a certain value based on selected option
 * @param type - "max" | "reset", decides what will be the final value, max: set to max possible, reset: set to 0
 */
async function setTokenAmount(type = "max") {
  let amount = 0;
  switch (type) {
    case "max":
      isSendAllActive.value = true;
      if (selectedToken.value.symbol?.toUpperCase() === "SOL") {
        // deduct the network fees
        const fee = 5000;
        amount = getTokenBalance() - fee / LAMPORTS_PER_SOL;
      } else {
        amount = getTokenBalance();
      }
      sendAmount.value = isCurrencyFiat.value ? convertCryptoToFiat(amount) : amount;
      break;
    case "reset":
      isSendAllActive.value = false;
      isCurrencyFiat.value = false;
      sendAmount.value = 0;
      break;
    default:
      break;
  }
}

/**
 * usage : change the sendAmount between crypto and its equivalent fiat
 * @param selectFiat - is the selected option is crypto , or fiat currency?
 */
function setAmountCurrency(selectFiat = true) {
  // select crypto as amount currency
  if (!selectFiat && isCurrencyFiat.value) {
    isCurrencyFiat.value = false;
    sendAmount.value = convertFiatToCrypto(sendAmount.value);
  }

  // select fiat as amount currency
  else if (selectFiat && !isCurrencyFiat.value) {
    isCurrencyFiat.value = true;
    sendAmount.value = convertCryptoToFiat(sendAmount.value);
  }
}

function updateSelectedToken($event: Partial<SolAndSplToken>) {
  if ($event.isFungible === false) {
    // new token selected is NFT
    showAmountField.value = false;
    sendAmount.value = 1;
  } else {
    // new token selected is SPL
    showAmountField.value = true;
    // last selected token was NFT
    if (!selectedToken.value.isFungible) {
      setTokenAmount("reset");
    } else {
      setAmountCurrency(false);
      isSendAllActive.value = false;
    }
  }
  selectedToken.value = $event;
  trackUserClick(TransferPageInteractions.TOKEN_SELECT + $event.mintAddress);
}

watch(
  transferTo,
  debounce(() => {
    if (/\.sol$/g.test(transferTo.value)) transferType.value = { ...ALLOWED_VERIFIERS[1] };
    else transferType.value = { ...ALLOWED_VERIFIERS[0] };
    snsAddressPromise = addressPromise(transferType.value.value, transferTo.value);
    transferToInternal.value = transferTo.value;
  }, 500)
);

// reset transfer token to solana if tokens no longer has current token
watch([tokens, nftTokens], () => {
  if (![...tokens.value, ...nftTokens.value].some((token) => token?.mintAddress === selectedToken.value?.mintAddress)) {
    updateSelectedToken(tokens.value[0]);
  }
});

async function onSelectTransferType() {
  // refresh address in case transferType changed
  snsAddressPromise = addressPromise(transferType.value.value, transferTo.value);
  $v.value.$reset();
  $v.value.$touch();
}
</script>

<template>
  <div class="py-2">
    <div class="mt-5 flex flex-row justify-around items-start md:space-x-5 lt-md:flex-col-reverse lt-md:justify-start">
      <Card class="w-full lt-md:mt-4">
        <form action="#" method="POST" class="w-full">
          <div class="flex flex-col justify-around items-start space-y-9">
            <AsyncTransferTokenSelect :selected-token="selectedToken" class="w-full" @update:selected-token="updateSelectedToken($event)" />
            <div class="w-full flex flex-row space-x-2">
              <ComboBox
                v-model="transferTo"
                :label="t('walletActivity.sendTo')"
                :errors="isOpen ? undefined : $v.transferTo.$errors"
                :items="contacts"
                class="w-2/3 flex-auto"
              />
              <div class="w-1/3 flex-auto mt-6">
                <SelectField v-model="transferType" :items="transferTypes" @update:model-value="onSelectTransferType" />
              </div>
            </div>

            <div v-if="showAmountField" class="w-full">
              <TextField
                v-model="sendAmount"
                :label="t('dappTransfer.amount')"
                :errors="$v.sendAmount.$errors"
                :postfix-text="isSendAllActive ? t('walletTransfer.reset') : t('walletTransfer.sendAll')"
                type="number"
                @update:postfix-text-clicked="setTokenAmount(isSendAllActive ? 'reset' : 'max')"
              >
                <div v-if="hasGeckoPrice" class="flex flex-row items-center justify-around h-full select-none">
                  <div
                    v-ga="TransferPageInteractions.CURRENCY_TOGGLE + selectedToken.symbol"
                    class="currency-selector mr-1"
                    :class="[!isCurrencyFiat ? 't-btn-tertiary active-currency' : '']"
                    @click="setAmountCurrency(false)"
                    @keydown="setAmountCurrency(false)"
                  >
                    {{ selectedToken.symbol }}
                  </div>
                  <div
                    v-ga="TransferPageInteractions.CURRENCY_TOGGLE + currency"
                    class="currency-selector"
                    :class="[isCurrencyFiat ? 't-btn-tertiary active-currency' : '']"
                    @click="setAmountCurrency(true)"
                    @keydown="setAmountCurrency(true)"
                  >
                    {{ currency }}
                  </div>
                </div>
              </TextField>
            </div>
            <Button class="ml-auto" :disabled="$v.$dirty && $v.$invalid" @click="openModal">
              {{ t("dappTransfer.transfer") }}
            </Button>
          </div>
        </form>
      </Card>
      <AsyncTokenBalance class="w-full" :selected-token="selectedToken" />
    </div>
    <AsyncMessageModal
      :is-open="messageModalState.showMessage"
      :title="messageModalState.messageTitle"
      :description="messageModalState.messageDescription"
      :status="messageModalState.messageStatus"
      @on-close="onMessageModalClosed"
    />
    <AsyncTransferConfirm
      :sender-pub-key="ControllerModule.selectedAddress"
      :receiver-pub-key="resolvedAddress"
      :crypto-amount="isCurrencyFiat ? convertFiatToCrypto(sendAmount) : sendAmount"
      :receiver-verifier="selectedVerifier"
      :receiver-verifier-id="resolvedAddress"
      :token-symbol="selectedToken?.data?.symbol || 'SOL'"
      :token="selectedToken"
      :is-open="isOpen && selectedToken.isFungible"
      :crypto-tx-fee="transactionFee"
      :transfer-disabled="transferDisabled"
      :estimation-in-progress="estimationInProgress"
      :estimated-balance-change="estimatedBalanceChange"
      :has-estimation-error="hasEstimationError"
      @transfer-confirm="confirmTransfer"
      @transfer-cancel="closeModal"
      @on-close-modal="closeModal"
    />
    <TransferNFT
      :sender-pub-key="ControllerModule.selectedAddress"
      :receiver-pub-key="resolvedAddress"
      :crypto-amount="sendAmount"
      :receiver-verifier="selectedVerifier"
      :receiver-verifier-id="resolvedAddress"
      :is-open="isOpen && !selectedToken.isFungible"
      :token="selectedToken"
      :crypto-tx-fee="transactionFee"
      :transfer-disabled="transferDisabled"
      :estimation-in-progress="estimationInProgress"
      :estimated-balance-change="estimatedBalanceChange"
      :has-estimation-error="hasEstimationError"
      @transfer-confirm="confirmTransfer"
      @transfer-reject="closeModal"
      @on-close-modal="closeModal"
    />
  </div>
</template>
<style scoped>
.active-currency {
  @apply dark:bg-app-gray-700;
}
.currency-selector {
  @apply py-1 px-4 uppercase text-xs cursor-pointer border-0 text-app-text-500 dark:text-app-text-dark-600;
}
</style>

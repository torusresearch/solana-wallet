<script setup lang="ts">
import { Dialog, DialogOverlay, DialogTitle, TransitionChild, TransitionRoot } from "@headlessui/vue";
import { useVuelidate } from "@vuelidate/core";
import { helpers, required } from "@vuelidate/validators";
import BigNumber from "bignumber.js";
import log from "loglevel";
import { computed, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";

import { Button, TextField } from "@/components/common";
import ControllerModule from "@/modules/controllers";

import { ImportToken } from "../../utils/enums";

const props = withDefaults(
  defineProps<{
    isOpen?: boolean;
    tokenList?: any;
    txFees?: number;
    importDisabled?: boolean;
    pricePerToken?: number;
    currency?: string;
  }>(),
  {
    isOpen: false,
    tokenList: [],
    importDisabled: false,
    txFees: 0,
    pricePerToken: 0,
    currency: "",
  }
);

const { t } = useI18n();

const emits = defineEmits(["importConfirm", "importCanceled", "onCloseModal"]);

const closeModal = () => {
  emits("onCloseModal");
};

const isDuplicateSplToken = (value: string): boolean => {
  log.info({ tokenList: props.tokenList });
  return !props?.tokenList?.includes(value);
};

const isAlnum = (value: string): boolean => {
  return /^[a-zA-Z0-9]+$/.test(value);
};

const defaultImportToken = {
  tokenContractAddress: "",
  tokenSymbol: "",
  tokenName: "",
};
const importTokenState = reactive<ImportToken>(defaultImportToken);

const rules = {
  tokenContractAddress: {
    required: helpers.withMessage("Required", required),
    checkIsAlnum: helpers.withMessage("Name should be alphanumeric", isAlnum),
    isDuplicateAddress: helpers.withMessage("Token Already Exists", isDuplicateSplToken),
  },
  tokenSymbol: {
    required: helpers.withMessage("Required", required),
  },
  tokenName: {
    required: helpers.withMessage("Required", required),
  },
};

const $v = useVuelidate(rules, importTokenState);

function setImportTokenState(contractAddress: string, name: string, symbol: string, setEmpty = false) {
  importTokenState.tokenContractAddress = setEmpty || contractAddress ? contractAddress : importTokenState.tokenContractAddress;
  importTokenState.tokenName = setEmpty || name ? name : importTokenState.tokenContractAddress;
  importTokenState.tokenSymbol = setEmpty || symbol ? symbol : importTokenState.tokenSymbol;
}

const fiatTxFeeString = computed(() => {
  const { pricePerToken, txFees, currency } = props;
  return `${new BigNumber(txFees).multipliedBy(pricePerToken).toFixed(5).toString()} ${currency}`;
});

function resetState() {
  setImportTokenState("", "", "", true);
  $v.value.$reset();
}

const onCancel = () => {
  emits("importCanceled");
  resetState();
};

const onImport = async () => {
  $v.value.$touch();
  if (!$v.value.$error && !$v.value.$invalid) {
    emits("importConfirm", importTokenState);
    resetState();
  }
};

async function resetKeyError() {
  if (!$v.value.tokenContractAddress.$invalid) {
    let resultToken: any = await ControllerModule.torus.fetchTokenFromContractAddress(importTokenState.tokenContractAddress);
    resultToken = resultToken[importTokenState.tokenContractAddress];
    log.info({ resultToken });
    if (resultToken) {
      setImportTokenState("", resultToken?.name, resultToken?.symbol);
    }
  } else {
    $v.value.tokenContractAddress.$touch();
  }
}
const refDiv = ref(null);
</script>
<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog :open="isOpen" :class="{ dark: ControllerModule.isDarkMode }" as="div" :initial-focus="refDiv" @close="closeModal">
      <div ref="refDiv" class="fixed inset-0 z-30 overflow-y-auto">
        <div class="min-h-screen px-4 text-center">
          <DialogOverlay class="fixed inset-0 opacity-30 bg-gray-200 dark:bg-gray-500" />
          <span class="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <div
              class="relative inline-block w-full max-w-sm my-8 overflow-hidden text-left align-middle transition-all bg-white dark:bg-app-gray-700 shadow-xl rounded-md px-4"
            >
              <DialogTitle as="div" class="shadow dark:shadow-dark text-center py-6 w-full">
                <p class="font-header text-lg font-bold text-app-text-600 dark:text-app-text-dark-500"> Import Token </p>
              </DialogTitle>
              <form @submit.prevent="onImport">
                <div class="col-span-3 sm:col-span-2">
                  <div class="text-sm text-app-text-500 dark:text-app-text-dark-600 mb-1">Token Contract Address</div>
                  <TextField
                    v-model="importTokenState.tokenContractAddress"
                    :errors="$v.tokenContractAddress.$errors"
                    @update:model-value="resetKeyError"
                  />
                </div>
                <div class="col-span-3 sm:col-span-2">
                  <div class="text-sm text-app-text-500 dark:text-app-text-dark-600 mb-1">Token Symbol</div>
                  <TextField v-model="importTokenState.tokenSymbol" :errors="$v.tokenSymbol.$errors" />
                </div>
                <div class="col-span-3 sm:col-span-2">
                  <div class="text-sm text-app-text-500 dark:text-app-text-dark-600 mb-1">Token Name</div>
                  <TextField v-model="importTokenState.tokenName" :errors="$v.tokenName.$errors" />
                </div>
              </form>
              <div class="col-span-3 sm:col-span-2">
                <div class="text-sm text-app-text-500 dark:text-app-text-dark-600 mb-1">
                  Transaction Cost : {{ props.txFees }} SOL / {{ fiatTxFeeString }}
                </div>
              </div>
              <div class="flex flex-row items-center my-6 mx-3">
                <Button class="flex-auto mx-2 w-1/2" :block="true" variant="tertiary" @click="onCancel">
                  {{ t("walletTransfer.cancel") }}
                </Button>
                <Button class="flex-auto mx-2 w-1/2" :disabled="$v.$invalid || importDisabled" :block="true" variant="primary" @click="onImport">
                  {{ t("walletTransfer.confirm") }}
                </Button>
              </div>
            </div>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
<style scoped>
.img_preview {
  max-width: 160px;
  min-width: 160px;
  @apply h-40 rounded-md object-cover;
}

.property-name {
  @apply font-bold text-sm leading-4;
}

.property-value {
  @apply text-sm leading-4;
}
</style>

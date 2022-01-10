<script setup lang="ts">
import { useI18n } from "vue-i18n";

import GoToLinkLogo from "@/assets/go-to-link.svg";
import SolanaLogoURL from "@/assets/solana-mascot.svg";
import SubtractURL from "@/assets/subtract.svg";
import { Button } from "@/components/common";
import { getDomainFromUrl } from "@/utils/helpers";

const { t } = useI18n();
const props = withDefaults(
  defineProps<{
    requestedFrom: string;
    logoUrl?: string;
    approvalMessage?: string;
  }>(),
  {
    logoUrl: SolanaLogoURL,
    requestedFrom: "",
    approvalMessage: "",
  }
);

const emits = defineEmits(["onApproved", "onCloseModal"]);

const closeModal = () => {
  emits("onCloseModal");
};

const onCancel = () => {
  closeModal();
};

const onConfirm = () => {
  emits("onApproved");
  closeModal();
};
function openLink() {
  window?.open(props?.requestedFrom, "_blank")?.focus();
}
</script>
<template>
  <div
    class="w-full h-full overflow-hidden text-left align-middle transition-all bg-white dark:bg-app-gray-800 shadow-xl flex flex-col justify-center items-center"
  >
    <div class="content-box w-full h-full transition-all bg-white dark:bg-app-gray-800 shadow-xl flex flex-col relative">
      <div class="shadow dark:shadow-dark bg-white dark:bg-app-gray-700 text-center py-6 flex flex-row justify-start items-center px-4" tabindex="0">
        <img class="h-7 left-5 absolute" :src="props.logoUrl" alt="Dapp Logo" />
        <p class="text-center font-header text-lg font-bold text-app-text-600 dark:text-app-text-dark-500 w-full">
          {{ t("dappTransfer.permission") }}
        </p>
      </div>
      <div class="mt-4 items-center px-4 flex flex-col justify-start items-start w-full">
        <div class="flex flex-col justify-start items-start mt-4 mb-8 w-full">
          <p class="text-sm text-app-text-600 dark:text-app-text-dark-500">{{ `${t("dappInfo.requestFrom")}:` }}</p>
          <div class="w-full flex flex-row justify-between items-center bg-white dark:bg-app-gray-700 h-12 px-5 mt-3 rounded-md">
            <a :href="props.requestedFrom" target="_blank" class="text-sm text-app-text-accent">{{ getDomainFromUrl(props.requestedFrom) }}</a>
            <div class="h-6 w-6 flex items-center justify-center rounded-md cursor-pointer" @click="openLink" @keydown="openLink">
              <img :src="GoToLinkLogo" alt="GoToLink" />
            </div>
          </div>
        </div>

        <div class="flex flex-col justify-start items-start w-full">
          <div class="w-full flex flex-row justify-start items-center">
            <img :src="SubtractURL" alt="Message Info" class="mr-2" />
            <p class="text-sm text-app-text-600 dark:text-app-text-dark-500">
              {{ `${t("dappTransfer.data")} ${t("dappTransfer.to")} ${t("dappTransfer.approve")}` }}
            </p>
          </div>
          <div class="w-full bg-white dark:bg-app-gray-700 h-12 mt-3 rounded-md approval-msg">
            <p class="text-sm text-app-text-600 dark:text-app-text-dark-500 m-4">{{ props.approvalMessage }}</p>
          </div>
        </div>
      </div>
      <hr class="mx-6 mt-auto" />
      <div class="flex flex-row items-center my-4 mx-4">
        <Button class="flex-auto mx-1" :block="true" variant="tertiary" @click="onCancel">{{ t("dappTransfer.cancel") }}</Button>
        <Button class="flex-auto mx-1" :block="true" variant="primary" @click="onConfirm">{{ t("dappTransfer.approve") }}</Button>
      </div>
    </div>
  </div>
</template>
<style scoped>
hr {
  border-color: #555555;
}
.approval-msg {
  overflow: auto;
  height: 100%;
  max-height: 180px !important;
}

@screen gt-xs {
  .content-box {
    max-width: 400px;
    max-height: 600px;
  }
}
</style>

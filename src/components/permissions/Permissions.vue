<script setup lang="ts">
import GoToLinkLogo from "@/assets/go-to-link.svg";
import SolanaLogoURL from "@/assets/solana-mascot.svg";
import SubtractURL from "@/assets/subtract.svg";
import { Button } from "@/components/common";
import { app } from "@/modules/app";
import { getDomainFromUrl } from "@/utils/helpers";

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
    :class="{ dark: app.isDarkMode }"
    class="
      inline-block
      w-screen
      h-screen
      overflow-hidden
      text-left
      align-middle
      transition-all
      transform
      bg-white
      dark:bg-app-gray-800
      shadow-xl
      flex flex-col
      justify-start
      align-start
    "
  >
    <div class="shadow dark:shadow-dark bg-white dark:bg-app-gray-700 text-center py-6 flex flex-row justify-start items-center px-4" tabindex="0">
      <div>
        <img class="h-7 mx-auto w-auto mb-1 mr-5" :src="props.logoUrl" alt="Dapp Logo" />
      </div>
      <p class="text-left font-header text-lg font-bold text-app-text-600 dark:text-app-text-dark-500 title-box">Permissions</p>
    </div>
    <div class="mt-4 px-6 items-center px-4">
      <div class="flex flex-col justify-start items-start mt-12">
        <p class="text-sm font-body text-app-text-600 dark:text-app-text-dark-500">Requested from:</p>
        <div class="w-full flex flex-row justify-between items-center bg-white dark:bg-app-gray-700 h-12 px-5 mt-3 rounded-md">
          <a :href="props.requestedFrom" target="_blank" class="text-sm font-body text-app-text-accent dark:text-app-text-accent">{{
            getDomainFromUrl(props.requestedFrom)
          }}</a>
          <div class="open-link" @click="openLink"><img :src="GoToLinkLogo" alt="GoToLink" /></div>
        </div>
      </div>

      <div class="flex flex-col justify-start items-start mt-8">
        <div class="w-full flex flex-row justify-start items-center">
          <img :src="SubtractURL" alt="Message Info" class="mr-2" />
          <p class="text-sm font-body text-app-text-600 dark:text-app-text-dark-500">Data to approve</p>
        </div>
        <div class="w-full bg-white dark:bg-app-gray-700 h-12 mt-3 rounded-md approval-msg">
          <p class="text-sm font-body text-app-text-600 dark:text-app-text-dark-500 m-4">{{ props.approvalMessage }}</p>
        </div>
      </div>
    </div>
    <div class="spacer"></div>
    <hr class="mx-6" />
    <div class="grid grid-cols-2 gap-3 m-6 px-4 rounded-md my-8">
      <div><Button class="ml-auto" :block="true" variant="tertiary" @click="onCancel">Cancel</Button></div>
      <div><Button class="ml-auto" :block="true" variant="primary" @click="onConfirm">Approve</Button></div>
    </div>
  </div>
</template>
<style scoped>
.title-box {
  flex: 1 1 auto;
}
.open-link {
  height: 24px;
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(0deg, #575d69, #575d69), #ffffff;
  border-radius: 6px;
  cursor: pointer;
}
.spacer {
  flex: 1 1 auto;
}
hr {
  border-color: #555555;
}
.approval-msg {
  overflow: auto;
  height: 100%;
  max-height: 180px !important;
}
</style>
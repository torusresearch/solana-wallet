<script setup lang="ts">
import { ref } from "vue";

import GoToLinkLogo from "@/assets/go-to-link.svg";
import SolanaLogoURL from "@/assets/solana-mascot.svg";
import SubtractURL from "@/assets/subtract.svg";
import { Button } from "@/components/common";
import ControllerModule from "@/modules/controllers";
import { getDomainFromUrl } from "@/utils/helpers";
import { DecodedDataType } from "@/utils/instruction_decoder";

import NetworkDisplay from "../common/NetworkDisplay.vue";
import InstructionDisplay from "../payments/InstructionDisplay.vue";

const props = withDefaults(
  defineProps<{
    logoUrl?: string;
    decodedInst: DecodedDataType[];
    origin: string;
  }>(),
  {
    logoUrl: SolanaLogoURL,
  }
);

const expand_inst = ref(false);
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
  window?.open(props?.origin, "_blank")?.focus();
}
</script>
<template>
  <div
    :class="{ dark: ControllerModule.isDarkMode }"
    class="inline-block w-screen h-screen overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-app-gray-800 shadow-xl flex flex-col justify-start align-start"
  >
    <div class="shadow dark:shadow-dark bg-white dark:bg-app-gray-700 text-center py-6 flex flex-row justify-start items-center px-4" tabindex="0">
      <div>
        <img class="h-7 mx-auto w-auto mb-1 mr-5" :src="props.logoUrl" alt="Dapp Logo" />
      </div>
      <p class="text-left font-header text-lg font-bold text-app-text-600 dark:text-app-text-dark-500 title-box">Confirm Permissions</p>
    </div>
    <div class="mt-4 px-6 items-center px-4 scrollbar">
      <div class="flex flex-col justify-start items-start mt-6">
        <NetworkDisplay />
        <p class="text-sm font-body text-app-text-600 dark:text-app-text-dark-500">Requested from:</p>

        <div class="w-full flex flex-row justify-between items-center bg-white dark:bg-app-gray-700 h-12 px-5 mt-3 rounded-md">
          <a :href="props.origin" target="_blank" class="text-sm font-body text-app-text-accent dark:text-app-text-accent">{{
            getDomainFromUrl(props.origin)
          }}</a>
          <div class="open-link" @click="openLink" @keydown="openLink"><img :src="GoToLinkLogo" alt="GoToLink" /></div>
        </div>
      </div>

      <div class="flex flex-col justify-start items-start mt-8 mb-12">
        <div class="w-full flex flex-row justify-start items-center">
          <img :src="SubtractURL" alt="Message Info" class="mr-2" />
          <p class="text-sm font-body text-app-text-600 dark:text-app-text-dark-500">
            {{ decodedInst.length }} Transaction Instruction(s) to approve
          </p>
        </div>
        <p
          class="text-right mt-4 text-sm font-body cursor-pointer view-details text-app-text-accent"
          @click="() => (expand_inst = !expand_inst)"
          @keydown="() => (expand_inst = !expand_inst)"
        >
          {{ expand_inst ? "Hide details" : "View more details" }}
        </p>
        <InstructionDisplay :is-expand="expand_inst" :decoded-inst="decodedInst" />
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

.scrollbar {
  max-height: 65vh;
  overflow: scroll;
  scrollbar-width: none;
}
.scrollbar::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}
</style>

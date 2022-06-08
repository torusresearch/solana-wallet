<script setup lang="ts">
import Button from "@toruslabs/vue-components/common/Button.vue";
import { useI18n } from "vue-i18n";

import SolanaLogoURL from "@/assets/solana-mascot.svg";
import { TextField } from "@/components/common";

const { t } = useI18n();

defineProps<{
  origin: string;
  fromNetwork: string;
  toNetwork: string;
}>();
const emits = defineEmits(["approveProviderChange", "denyProviderChange"]);
const approveProviderChange = () => {
  emits("approveProviderChange");
};

const denyProviderChange = () => {
  emits("denyProviderChange");
};
</script>
<template>
  <div class="h-full w-full bg-white dark:bg-app-gray-700 flex justify-center items-center">
    <div class="content-box h-full bg-white dark:bg-app-gray-700 flex flex-col justify-between shadow dark:shadow-dark">
      <div class="shadow w-full dark:shadow-dark text-center py-6 relative" tabindex="0">
        <img class="h-7 mx-auto w-auto mb-1 absolute left-5" :src="SolanaLogoURL" alt="Solana Logo" />
        <div class="font-header w-full text-lg font-bold text-app-text-600 dark:text-app-text-dark-500 title-box">
          {{ `${t("dappTransfer.confirm")} ${t("dappTransfer.permission")}` }}
        </div>
      </div>
      <div class="p-5">
        <div>
          <div class="text-lg mb-5 text-app-text-500 dark:text-app-text-500 font-semibold text-center">
            {{ t("dappPermission.allow") }} <strong class="dark:text-white">{{ origin }}</strong>
            {{ t("dappPermission.changeNetwork", { network: toNetwork }) }}
          </div>
          <!-- <div class="grid grid-cols-3 items-center mb-4">
            <div class="col-span-3 text-xs text-app-text-600 dark:text-app-text-dark-500">Requested From:</div>
          </div> -->
          <div class="grid grid-cols-3 items-center mb-4">
            <div class="col-span-3 text-xs text-app-text-600 dark:text-app-text-dark-500 mb-2">
              {{ `${t("dappPermission.currentNetwork")}:` }}
            </div>
            <div class="col-span-3"><TextField :model-value="fromNetwork" type="text" :disabled="true" /></div>
          </div>
          <div class="grid grid-cols-3 items-center mb-4">
            <div class="col-span-3 text-xs text-app-text-600 dark:text-app-text-dark-500 mb-2">{{ t("dappPermission.requestNew") }}</div>
            <div class="col-span-3"><TextField :model-value="toNetwork" type="text" :disabled="true" /></div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 m-6">
        <div>
          <Button class="ml-auto" :block="true" variant="tertiary" @click="denyProviderChange()">{{ t("dappProvider.cancel") }}</Button>
        </div>
        <div>
          <Button class="ml-auto" :block="true" variant="primary" @click="approveProviderChange()">{{ t("dappProvider.confirm") }}</Button>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
@screen gt-xs {
  .content-box {
    max-width: 400px;
    max-height: 600px;
  }
}
</style>

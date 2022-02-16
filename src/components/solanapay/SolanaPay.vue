<script setup lang="ts">
import log from "loglevel";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

import ControllerModule from "@/modules/controllers";
import { parseURL } from "@/utils/solanapay/parseURL";

const { t } = useI18n();
const props = withDefaults(
  defineProps<{
    requestedFrom: string;
    requestLink: string;
  }>(),
  {}
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

const invalidLink = ref(false);
const decodeParams = (requestLink: string) => {
  if (props.requestLink.length) {
    try {
      invalidLink.value = false;
      const result = parseURL(requestLink);
      // const tx = await createTransaction(this.connection, new PublicKey(this.selectedAddress), recipient, amount as BigNumber, {
      //   splToken,
      //   reference,
      //   memo,
      // });
      return result;
      // parseURL(requestLink);
    } catch (e) {
      invalidLink.value = true;
      log.error(e);
      //  popup invalid link
      // onclick back to
    }
  }
  return undefined;
};
const solanaParams = decodeParams(props.requestLink);
// solanaParams.value = parseURL(props.requestLink);
</script>

<template>
  <div
    :class="{ dark: ControllerModule.isDarkMode }"
    class="w-full h-full overflow-hidden text-left align-middle transform bg-white dark:bg-app-gray-600 shadow-xl flex flex-col justify-center items-center"
  >
    <div class="content-box w-full h-full transition-all bg-white dark:bg-app-gray-800 shadow-xl flex flex-col relative">
      <div class="shadow dark:shadow-dark bg-white dark:bg-app-gray-700 text-center py-6 flex flex-row justify-start items-center px-4" tabindex="0">
        <div v-if="invalidLink">
          <p>Invalid Link</p>
          <button @click="onCancel">Go Back</button>
        </div>

        <div v-else>
          <div>
            Pay to
            {{ solanaParams?.recipient.toBase58() }}
          </div>
          <div>
            Amount
            {{ solanaParams?.amount }}
            {{ solanaParams?.splToken?.toBase58() || "SOL" }}
          </div>
          <div>
            Label
            {{ solanaParams?.label }}
          </div>
          <div>
            Memo
            {{ solanaParams?.memo }}
          </div>
          <div>
            Message
            {{ solanaParams?.message }}
          </div>
          <hr class="mx-6 mt-auto" />
          <div class="flex flex-row items-center my-4 mx-4">
            <Button class="flex-auto mx-1" :block="true" variant="tertiary" @click="onCancel">{{ t("dappTransfer.cancel") }}</Button>
            <Button class="flex-auto mx-1" :block="true" variant="primary" @click="onConfirm">{{ t("dappTransfer.approve") }}</Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

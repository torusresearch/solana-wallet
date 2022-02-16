<script setup lang="ts">
import log from "loglevel";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

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
      // const result = parseURL(props.requestLink);
      return parseURL(requestLink);
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
</template>

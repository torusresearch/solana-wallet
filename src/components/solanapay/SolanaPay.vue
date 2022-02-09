<script setup lang="ts">
import { ParsedURL } from "@solana/pay";
import log from "loglevel";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

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

const solanaParams = computed((): ParsedURL | undefined => {
  if (props.requestLink.length) {
    try {
      // const result = parseURL(props.requestLink);
      // return parseURL(props.requestLink);
    } catch (e) {
      log.error(e);
    }
  }
  return undefined;
});
// solanaParams.value = parseURL(props.requestLink);
</script>
<template>
  <div>
    <hr class="mx-6 mt-auto" />
    {{ solanaParams?.amount }}
    <div class="flex flex-row items-center my-4 mx-4">
      <Button class="flex-auto mx-1" :block="true" variant="tertiary" @click="onCancel">{{ t("dappTransfer.cancel") }}</Button>
      <Button class="flex-auto mx-1" :block="true" variant="primary" @click="onConfirm">{{ t("dappTransfer.approve") }}</Button>
    </div>
  </div>
</template>

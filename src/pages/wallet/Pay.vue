/* eslint-disable vuejs-accessibility/media-has-caption */
<script setup lang="ts">
import { Transaction } from "@solana/web3.js";
import log from "loglevel";
import QrScanner from "qr-scanner";
import { onMounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import MessageModal from "@/components/common/MessageModal.vue";
import FullDivLoader from "@/components/FullDivLoader.vue";
import SolanaPay from "@/components/payments/SolanaPay.vue";
import controllerModule from "@/modules/controllers";
import { STATUS, STATUS_TYPE } from "@/utils/enums";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const requestLink = ref("");
const el = ref<HTMLVideoElement>();
const errMessage = ref("");
const loading = ref(true);

let scanner: QrScanner;
const messageModalState = reactive({
  showMessage: false,
  messageTitle: "",
  messageDescription: "",
  messageStatus: STATUS.INFO as STATUS_TYPE,
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
  // messageModalState.messageStatus = STATUS.INFO;
  if (messageModalState.messageStatus === STATUS.ERROR) {
    router.push("/wallet/home");
  } else {
    router.push("/wallet/activity");
  }
};

watch(
  route,
  () => {
    if (scanner) {
      scanner.stop();
      scanner.destroy();
    }
    log.info(scanner);
  },
  { flush: "pre", immediate: true, deep: true }
);
const onDecode = (result: { data: string; cornerPoints: { x: number; y: number }[] }) => {
  log.info("decode");
  log.info(result);
  try {
    requestLink.value = result.data;
    scanner.stop();
  } catch (e) {
    scanner.stop();
    errMessage.value = "Invalid Code";
  }
};

onMounted(async () => {
  if (el.value) {
    scanner = new QrScanner(el.value, onDecode, {
      highlightScanRegion: true,
      highlightCodeOutline: true,
    });
  }
  if (route.query.request) {
    // got query param request (expected from url_protocol web+solana:)
    const idx = window.location.search.indexOf("=");
    const webSchemaLink = window.location.search.substring(idx + 1);
    // reformat string to solana:<>
    requestLink.value = decodeURIComponent(webSchemaLink).slice("web+".length);
  } else {
    await scanner.start();
  }
  loading.value = false;
});

const rescan = async () => {
  log.info("click rescan");
  loading.value = true;
  requestLink.value = "";
  await scanner.start();
  loading.value = false;
};

const onApproved = async (tx: Transaction) => {
  // create Transaction send
  loading.value = true;
  try {
    await controllerModule.torus.transfer(tx);
    scanner.destroy();
    showMessageModal({
      messageTitle: t("walletTransfer.transferSuccessTitle"),
      messageStatus: STATUS.INFO,
    });
    // redirect to transaction page
    // router.push("/wallet/activity");
  } catch (e) {
    log.error(e);
    // show error message
    // requestLink.value = "";
    showMessageModal({
      messageTitle: `${t("walletTransfer.submitFailed")}: ${(e as Error)?.message || t("walletSettings.somethingWrong")}`,
      messageStatus: STATUS.ERROR,
    });
  }
  // loading.value = false;
};

const onReject = () => {
  log.info("reject");
  scanner.destroy();
  router.push("/wallet/home");
  // rescan();
};
</script>
<template>
  <div class="qrwrapper">
    <MessageModal
      :is-open="messageModalState.showMessage"
      :title="messageModalState.messageTitle"
      :description="messageModalState.messageDescription"
      :status="messageModalState.messageStatus"
      @on-close="onMessageModalClosed"
    />
    <FullDivLoader v-if="loading" class="absolute" />
    <button v-else-if="errMessage.length" @click="rescan">{{ errMessage }}</button>
    <SolanaPay
      v-else-if="requestLink.length"
      class="spay z-40 sm:z-0"
      :request-link="requestLink"
      @on-close-modal="onReject"
      @on-approved="onApproved"
    />
    <video v-show="!requestLink.length" ref="el" class="qrscanner" muted webkit-playsinline="true" playsinline="true" />
  </div>
</template>

<style>
.spay {
  position: absolute;
  top: 0;
  left: 0;
}
.qrwrapper-hidden {
  display: none;
}
.qrwrapper {
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}
.qrscanner {
  /* width: 100%; */
  max-width: none;
  height: 100%;
  object-fit: contain;
  left: 50%;
  transform: translateX(-50%);
}
</style>

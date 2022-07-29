/* eslint-disable vuejs-accessibility/media-has-caption */
<script setup lang="ts">
import { Transaction } from "@solana/web3.js";
import log from "loglevel";
import QrScanner from "qr-scanner";
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import FullDivLoader from "@/components/FullDivLoader.vue";
import SolanaPay from "@/components/payments/SolanaPay.vue";
import controllerModule from "@/modules/controllers";

const router = useRouter();
const route = useRoute();
const requestLink = ref("");
const el = ref<HTMLVideoElement>();
const errMessage = ref("");
const loading = ref(true);

let scanner: QrScanner;
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
    // redirect to transaction page
    router.push("/wallet/activity");
  } catch (e) {
    log.error(e);
    // show error message
    requestLink.value = "";
  }
  loading.value = false;
};

const onReject = () => {
  log.info("reject");
  rescan();
};
</script>
<template>
  <div class="qrwrapper">
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
  height: 100vh;
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

/* eslint-disable vuejs-accessibility/media-has-caption */
<script setup lang="ts">
import { Transaction } from "@solana/web3.js";
import log from "loglevel";
import QrScanner from "qr-scanner";
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import SolanaPay from "@/components/solanapay/SolanaPay.vue";
import controllerModule from "@/modules/controllers";

const router = useRouter();
const route = useRoute();
const requestLink = ref("");
const el = ref<HTMLVideoElement>();
const errMessage = ref("");

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
    scanner.start();
  }
});

const rescan = async () => {
  log.info("click rescan");
  requestLink.value = "";
  scanner.start();
};

const onApproved = async (tx: Transaction) => {
  // create Transaction send
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
};

const onReject = () => {
  log.info("reject");
  rescan();
};
</script>
<template>
  <div class="qrwrapper">
    <video v-show="!requestLink.length" ref="el" class="qrscanner" muted webkit-playsinline="true" playsinline="true" />
  </div>
  <SolanaPay v-if="requestLink.length" class="spay z-40 sm:z-0" :request-link="requestLink" @on-close-modal="onReject" @on-approved="onApproved" />
  <button v-if="errMessage.length" @click="rescan">{{ errMessage }}</button>
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
  /* top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); */
  /* overflow-x: hidden; */
}
</style>

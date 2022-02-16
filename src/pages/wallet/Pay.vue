/* eslint-disable vuejs-accessibility/media-has-caption */
<script setup lang="ts">
// import { ParsedURL, parseURL } from "@solana/pay";
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
    if (scanner) scanner.destroy();
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
    scanner = new QrScanner(el.value, onDecode, { highlightScanRegion: true });
    log.info(scanner);
  }

  if (route.query.request) {
    log.info(route.query);
    const idx = window.location.search.indexOf("=");
    requestLink.value = window.location.search.substring(idx + 1);
  } else {
    scanner.start();
  }
});

const rescan = async () => {
  log.info("click rescan");
  requestLink.value = "";
  scanner.start();
};

const onApproved = async () => {
  // create Transaction send
  try {
    await controllerModule.torus.solanapay(requestLink.value);
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
  <div></div>
  <video ref="el" muted />
  <SolanaPay
    v-if="requestLink.length"
    :requested-from="location?.origin || 'unknown'"
    :request-link="requestLink"
    @on-close-modal="onReject"
    @on-approved="onApproved"
  />
  <button v-if="errMessage.length" @click="rescan">{{ errMessage }}</button>
</template>

/* eslint-disable vuejs-accessibility/media-has-caption */
<script setup lang="ts">
// import { ParsedURL, parseURL } from "@solana/pay";
import log from "loglevel";
import QrScanner from "qr-scanner";
import { onMounted, ref } from "vue";

import SolanaPay from "@/components/solanapay/SolanaPay.vue";

const requestLink = ref("");
const el = ref<HTMLVideoElement>();
const onApproved = () => {
  // create Transaction send
};

const onReject = () => {
  log.info("reject");
};

const onDecode = (result: any) => {
  log.info("decode");
  log.info(result);
  requestLink.value = result;
};

onMounted(async () => {
  log.info("decode");
  // const cam = await QrScanner.hasCamera();
  // if (!cam) {
  //   throw Error("No Camera");
  // }
  const scanner = new QrScanner(el.value, onDecode);
  scanner.start();
  log.info(scanner);
});
</script>
<template>
  <div></div>
  <video ref="el" muted />
  <SolanaPay
    v-if="requestLink.length"
    :requested-from="window.origin"
    :request-link="requestLink"
    @on-close-modal="onReject"
    @on-approved="onApproved"
  />
</template>

<script setup lang="ts">
import log from "loglevel";
import QRCreator from "qr-creator";
import { onMounted, ref } from "vue";

const props = withDefaults(
  defineProps<{
    csize?: number;
    text: string;
    radius?: number;
    fill?: string;
    background?: string | null;
    ecLevel?: QRCreator.ErrorCorrectionLevel;
  }>(),
  {
    radius: 0.5,
    // fill: "#536DFE",
    fill: "#000",
    background: null,
    csize: 256,
    ecLevel: "M",
  }
);

const emits = defineEmits(["update:qrsrc"]);

const updateQrsrc = (value: string) => {
  emits("update:qrsrc", value);
};

const qrsrc = ref("");

onMounted(() => {
  const cv = document.getElementById("qr");
  if (cv) {
    log.info(props);
    QRCreator.render(
      {
        text: props.text,
        radius: props.radius, // 0.0 to 0.5
        ecLevel: props.ecLevel, // L, M, Q, H
        fill: props.fill, // foreground color
        background: "white", // props.background, // color or null for transparent
        size: props.csize, // in pixels
      },
      cv
    );
    qrsrc.value = (cv as HTMLCanvasElement).toDataURL();
    updateQrsrc(qrsrc.value);
    cv.remove();
  } else log.error("no canvas");
});
</script>
<template>
  <canvas id="qr" />
  <img :src="qrsrc" alt="" class="p-4 m-8 bg-white" />
</template>

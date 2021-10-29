<script setup lang="ts">
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { addressSlicer } from "@toruslabs/base-controllers";
import { computed } from "vue-demi";
const props = withDefaults(
  defineProps<{
    el: string;
    data: string | PublicKey | number | undefined;
  }>(),
  {}
);
const data_disp = computed(() => {
  let disp: string;
  if (props.data instanceof PublicKey) disp = props.data.toBase58();
  if (props.el === "lamports") disp = ((props.data as number) / LAMPORTS_PER_SOL).toString();
  else disp = props.data?.toString() as string;
  return addressSlicer(disp);
});
</script>
<template>
  <div v-if="data" class="pl-3 flex justify-between w-full text-app-text-500 dark:text-app-text-dark-300 text-xs">
    <span>{{ props.el }}</span>
    <span>{{ data_disp }}</span>
  </div>
</template>

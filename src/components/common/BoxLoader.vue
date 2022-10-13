<script setup lang="ts">
import { Loader } from "@toruslabs/vue-components/common";

import { isWhiteLabelDark } from "@/utils/whitelabel";

const props = withDefaults(
  defineProps<{
    backgroundColor: string;
  }>(),
  {
    backgroundColor: "",
  }
);
</script>
<template>
  <Loader :use-spinner="true" :background-color="props.backgroundColor" :is-dark="isWhiteLabelDark()" />
</template>

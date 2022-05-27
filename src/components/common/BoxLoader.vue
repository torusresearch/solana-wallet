<script setup lang="ts">
import { Loader } from "@toruslabs/vue-components/common";

import { isWhiteLabelDark } from "@/utils/white-label";
</script>
<template>
  <Loader :use-spinner="true" :is-dark="isWhiteLabelDark()" />
</template>

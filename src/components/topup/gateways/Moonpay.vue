<script setup lang="ts">
import { topupPlugin } from "@/plugins/Topup";
import { TOPUP } from "@/plugins/Topup/interface";

import BaseTopup from "./BaseTopup.vue";
</script>
<template>
  <BaseTopup :selected-provider="topupPlugin[TOPUP.MOONPAY]" />
</template>

<script setup lang="ts">
import { app } from "@/modules/app";
</script>

<template>
  <div :class="{ dark: app.isDarkMode }"><router-view /></div>
</template>

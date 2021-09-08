<script setup lang="ts">
import { Button } from "@/components/common";
</script>
<template>
  <div class="pb-4">
    <div class="text-sm font-body mb-2">Select a theme</div>
    <div class="grid grid-cols-2 space-x-3">
      <div>
        <Button variant="tertiary" block>Light</Button>
      </div>
      <div>
        <Button variant="tertiary" block>Dark</Button>
      </div>
    </div>
  </div>
</template>

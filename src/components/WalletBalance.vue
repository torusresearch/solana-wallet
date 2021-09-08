<script setup lang="ts">
import { Button, Card, NetworkDisplay } from "@/components/common";

defineProps<{
  showButtons?: boolean;
}>();
</script>
<template>
  <Card :height="showButtons ? '164px' : undefined">
    <div class="flex">
      <div class="font-header font-semibold text-app-text-600">Total Value</div>
      <div class="ml-auto"><NetworkDisplay /></div>
    </div>
    <div class="flex">
      <div>
        <span class="mr-2 font-body font-bold text-5xl text-app-text-500"
          >0.00</span
        >
        <span class="font-body text-xs text-app-text-500">USD</span>
      </div>
      <div class="ml-auto self-end text-app-text-400">1 ETH = 269.21 USD</div>
    </div>
    <template v-if="showButtons" #footer>
      <div class="grid grid-cols-2 gap-3 mt-3">
        <div>
          <Button block variant="tertiary">Top up</Button>
        </div>
        <div>
          <Button block variant="tertiary">Transfer</Button>
        </div>
      </div>
    </template>
  </Card>
</template>

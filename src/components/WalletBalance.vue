<script setup lang="ts">
import { Button, Card } from "@/components/common";

defineProps<{
  showButtons?: boolean;
}>();
</script>
<template>
  <Card :height="showButtons ? '164px' : undefined">
    <div class="flex">
      <div class="font-header font-semibold">Total Value</div>
      <div class="ml-auto">Casper Network</div>
    </div>
    <div class="flex">
      <div>
        <span class="font-body font-bold text-5xl">0.00</span>
        <span class="font-body text-xs">USD</span>
      </div>
      <div class="ml-auto self-end">1 ETH = 269.21 USD</div>
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

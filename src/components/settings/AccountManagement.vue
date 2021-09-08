<script setup lang="ts">
import { Button } from "@/components/common";

const accounts = [
  {
    id: "lionell@tor.us",
    default: true,
  },
  {
    id: "OpenLogin account",
    default: false,
  },
];
</script>
<template>
  <div class="pb-4">
    <div class="text-sm font-body mb-2">Accounts</div>
    <ul class="border rounded-md divide-y shadow mb-2">
      <li
        v-for="account in accounts"
        :key="account.id"
        class="flex items-center py-3 px-4"
      >
        <div class="flex items-center">
          <img
            class="mr-2"
            src="https://app.tor.us/v1.13.2/img/eth-grey-white.3edd2d65.svg"
            alt
          />
          <div class="font-body text-xs">{{ account.id }}</div>
        </div>
        <div class="ml-auto flex">
          <div v-if="account.default" class="font-body text-xs">Default</div>
          <Button v-else variant="text">Switch this to Default</Button>
        </div>
      </li>
    </ul>
    <div class="font-body text-xs text-app-text-400 px-2">
      Note: The selected default account shall be the account displayed when you
      sign in on a DApp.
    </div>
  </div>
</template>

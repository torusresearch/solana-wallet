<script setup lang="ts">
import CasperLogoURL from "@/assets/casper.svg";
import { Button, Card } from "@/components/common";
import WalletBalance from "@/components/WalletBalance.vue";
import WalletTabs from "@/components/WalletTabs.vue";
</script>

<template>
  <WalletTabs tab="home">
    <div class="py-2">
      <div class="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
        <WalletBalance show-buttons />
        <Card :height="'164px'">
          <div class="grid grid-cols-3 h-full">
            <div class="col-span-2">
              <div class="font-body font-bold text-app-text-600 dark:text-app-text-dark-500">Join us at User X Devcon After-Party</div>
              <div class="font-body text-xs text-app-text-600 dark:text-app-text-dark-500">11 Oct 2019 @ Osaka</div>
            </div>
            <div class="col-span-1">
              <img class="float-right h-2/4 sm:h-2/3" :src="CasperLogoURL" alt />
            </div>
          </div>
          <template #footer>
            <div class="flex sm:grid grid-cols-2 gap-3 mt-3">
              <div class="w-full sm:w-auto">
                <Button block variant="tertiary">More information</Button>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </WalletTabs>
</template>

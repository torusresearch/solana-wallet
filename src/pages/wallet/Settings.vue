<script setup lang="ts">
import { GlobeIcon, ListIcon, OptionsIcon, UserIcon } from "@toruslabs/vue-icons/basic";
import { MonitorIcon } from "@toruslabs/vue-icons/gadgets";
import { LockIcon } from "@toruslabs/vue-icons/security";

import { Panel } from "@/components/common";
import { AccountDetails, AccountManagement, AddressBook, CrashReporting, Display, Network } from "@/components/settings";
import WalletTabs from "@/components/WalletTabs.vue";
</script>

<template>
  <WalletTabs tab="settings">
    <div class="py-2">
      <div class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
        <div>
          <div class="mb-4">
            <Panel title="Privacy and Security" disabled>
              <AccountDetails />
              <template #leftIcon><LockIcon class="w-5 h-5 mr-2 text-app-text-600 dark:text-app-text-dark-500" /></template>
            </Panel>
          </div>
          <div class="mb-4">
            <Panel title="Address Book" disabled>
              <AddressBook />
              <template #leftIcon><ListIcon class="w-5 h-5 mr-2 text-app-text-600 dark:text-app-text-dark-500" /></template>
            </Panel>
          </div>
          <div class="mb-4">
            <Panel title="Crash Reporting" disabled>
              <CrashReporting />
              <template #leftIcon><MonitorIcon class="w-5 h-5 mr-2 text-app-text-600 dark:text-app-text-dark-500" /></template>
            </Panel>
          </div>
        </div>
        <div>
          <div class="mb-4">
            <Panel title="Network" disabled>
              <Network />
              <template #leftIcon><GlobeIcon class="w-5 h-5 mr-2 text-app-text-600 dark:text-app-text-dark-500" /></template>
            </Panel>
          </div>
          <div class="mb-4">
            <Panel title="Display" disabled>
              <Display />
              <template #leftIcon><OptionsIcon class="w-5 h-5 mr-2 text-app-text-600 dark:text-app-text-dark-500" /></template>
            </Panel>
          </div>
          <div class="mb-4">
            <Panel title="Account Management" disabled>
              <AccountManagement />
              <template #leftIcon><UserIcon class="w-5 h-5 mr-2 text-app-text-600 dark:text-app-text-dark-500" /></template>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  </WalletTabs>
</template>

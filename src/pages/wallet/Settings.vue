<script setup lang="ts">
import {
  AdjustmentsIcon,
  DesktopComputerIcon,
  GlobeAltIcon,
  LockClosedIcon,
  MenuAlt2Icon,
  UserIcon,
} from "@heroicons/vue/outline";

import WalletTabs from "@/components/WalletTabs.vue";
import {
  AccountDetails,
  AddressBook,
  CrashReporting,
  Display,
  Network,
  AccountManagement,
} from "@/components/settings";
import { Panel } from "@/components/common";
</script>

<template>
  <WalletTabs tab="settings">
    <div class="py-2">
      <div class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
        <div>
          <div class="mb-4">
            <Panel title="Privacy and Security" disabled>
              <AccountDetails />
              <template #leftIcon
                ><LockClosedIcon
                  class="
                    w-5
                    h-5
                    mr-2
                    text-app-text-600
                    dark:text-app-text-dark-500
                  "
              /></template>
            </Panel>
          </div>
          <div class="mb-4">
            <Panel title="Address Book" disabled>
              <AddressBook />
              <template #leftIcon
                ><MenuAlt2Icon
                  class="
                    w-5
                    h-5
                    mr-2
                    text-app-text-600
                    dark:text-app-text-dark-500
                  "
              /></template>
            </Panel>
          </div>
          <div class="mb-4">
            <Panel title="Crash Reporting" disabled>
              <CrashReporting />
              <template #leftIcon
                ><DesktopComputerIcon
                  class="
                    w-5
                    h-5
                    mr-2
                    text-app-text-600
                    dark:text-app-text-dark-500
                  "
              /></template>
            </Panel>
          </div>
        </div>
        <div>
          <div class="mb-4">
            <Panel title="Network" disabled>
              <Network />
              <template #leftIcon
                ><GlobeAltIcon
                  class="
                    w-5
                    h-5
                    mr-2
                    text-app-text-600
                    dark:text-app-text-dark-500
                  "
              /></template>
            </Panel>
          </div>
          <div class="mb-4">
            <Panel title="Display" disabled>
              <Display />
              <template #leftIcon
                ><AdjustmentsIcon
                  class="
                    w-5
                    h-5
                    mr-2
                    text-app-text-600
                    dark:text-app-text-dark-500
                  "
              /></template>
            </Panel>
          </div>
          <div class="mb-4">
            <Panel title="Account Management" disabled>
              <AccountManagement />
              <template #leftIcon
                ><UserIcon
                  class="
                    w-5
                    h-5
                    mr-2
                    text-app-text-600
                    dark:text-app-text-dark-500
                  "
              /></template>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  </WalletTabs>
</template>

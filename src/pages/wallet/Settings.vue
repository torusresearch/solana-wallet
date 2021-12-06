<script setup lang="ts">
import { ContactPayload } from "@toruslabs/base-controllers";
import { GlobeIcon, ListIcon, OptionsIcon } from "@toruslabs/vue-icons/basic";
import { MonitorIcon } from "@toruslabs/vue-icons/gadgets";
import { LockIcon } from "@toruslabs/vue-icons/security";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

import { Panel } from "@/components/common";
import { AccountDetails, AddressBook, CrashReporting, Display, Network } from "@/components/settings";
import ControllersModule from "@/modules/controllers";

const contacts = computed(() => ControllersModule.contacts);

const { t } = useI18n();

const saveContact = async (contactPayload: ContactPayload): Promise<void> => {
  await ControllersModule.addContact(contactPayload);
};

const deleteContact = async (contactId: number): Promise<void> => {
  await ControllersModule.deleteContact(contactId);
};
</script>

<template>
  <WalletTabs tab="settings">
    <div class="py-2">
      <div class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
        <div>
          <div class="mb-4">
            <Panel :title="t('walletSettings.privacySecurity')" disabled>
              <AccountDetails />
              <template #leftIcon><LockIcon class="w-5 h-5 mr-2 text-app-text-600 dark:text-app-text-dark-500" /></template>
            </Panel>
          </div>
          <div class="mb-4">
            <Panel :title="t('walletSettings.addressBook')" disabled>
              <AddressBook :state-contacts="contacts" @save-contact="saveContact" @delete-contact="deleteContact" />
              <template #leftIcon><ListIcon class="w-5 h-5 mr-2 text-app-text-600 dark:text-app-text-dark-500" /></template>
            </Panel>
          </div>
          <div class="mb-4">
            <Panel :title="t('walletSettings.crashReport')" disabled>
              <CrashReporting />
              <template #leftIcon><MonitorIcon class="w-5 h-5 mr-2 text-app-text-600 dark:text-app-text-dark-500" /></template>
            </Panel>
          </div>
        </div>
        <div>
          <div class="mb-4">
            <Panel :title="t('walletSettings.network')" disabled>
              <Network />
              <template #leftIcon><GlobeIcon class="w-5 h-5 mr-2 text-app-text-600 dark:text-app-text-dark-500" /></template>
            </Panel>
          </div>
          <div class="mb-4">
            <Panel :title="t('walletSettings.display')" disabled>
              <Display />
              <template #leftIcon><OptionsIcon class="w-5 h-5 mr-2 text-app-text-600 dark:text-app-text-dark-500" /></template>
            </Panel>
          </div>
          <!--          <div class="mb-4">-->
          <!--            <Panel :title="t('walletSettings.accountManagement')" disabled>-->
          <!--              <AccountManagement />-->
          <!--              <template #leftIcon><UserIcon class="w-5 h-5 mr-2 text-app-text-600 dark:text-app-text-dark-500" /></template>-->
          <!--            </Panel>-->
          <!--          </div>-->
        </div>
      </div>
    </div>
  </WalletTabs>
</template>

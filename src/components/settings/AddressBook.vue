<script setup lang="ts">
import { TrashIcon } from "@heroicons/vue/outline";
import { ref } from "vue";

import { Button, SelectField, TextField } from "@/components/common";

const contacts = [
  {
    id: 67,
    created_at: "2019-11-18T18:31:37.000Z",
    updated_at: "2019-11-18T18:31:37.000Z",
    verifier: "google",
    contact: "llenoil@gmail.com",
    name: "LionellMain",
    public_address: "0xA902444A4194e0e065baEFc52490637fe8593407",
  },
  {
    id: 1815,
    created_at: "2020-12-04T07:34:37.000Z",
    updated_at: "2020-12-04T07:34:37.000Z",
    verifier: "eth",
    contact: "0xF12Ae14aF3C0aB0406E36424f9a83F4Edc9b4964",
    name: "Lionell Torus tKey",
    public_address: "0xA902444A4194e0e065baEFc52490637fe8593407",
  },
  {
    id: 1862,
    created_at: "2020-12-21T10:53:53.000Z",
    updated_at: "2020-12-21T10:53:53.000Z",
    verifier: "eth",
    contact: "0x3E2a1F4f6b6b5d281Ee9a9B36Bb33F7FBf0614C3",
    name: "Chai",
    public_address: "0xA902444A4194e0e065baEFc52490637fe8593407",
  },
];

interface TranferType {
  label: string;
  value: string;
}

const transferType = ref<TranferType | undefined>();

const transferTypes: TranferType[] = [
  {
    label: "ETH address",
    value: "eth",
  },
  {
    label: "ENS domain",
    value: "ens",
  },
  {
    label: "Google account",
    value: "google",
  },
  {
    label: "Twitter handle",
    value: "twitter",
  },
  {
    label: "Reddit username",
    value: "reddit",
  },
  {
    label: "Discord ID",
    value: "discord",
  },
];
</script>
<template>
  <div class="py-4">
    <div class="flex items-center mb-4">
      <div class="font-body text-sm text-app-text-600 dark:text-app-text-dark-500">List of Contacts</div>
      <div class="ml-auto flex space-x-2">
        <TextField size="small" placeholder="Search by name" />
        <TextField size="small" placeholder="Filter by type" />
      </div>
    </div>
    <ul class="border dark:border-gray-900 rounded-md divide-y dark:divide-gray-900 shadow dark:shadow-dark mb-4">
      <li v-for="contact in contacts" :key="contact.id" class="flex items-center py-3 px-4">
        <div class="flex items-center">
          <img class="mr-2" src="https://app.tor.us/v1.13.2/img/eth-grey-white.3edd2d65.svg" alt />
          <div class="font-body text-xs text-app-text-600 dark:text-app-text-dark-500">
            {{ contact.name }} -
            <span class="text-app-text-500 dark:text-app-text-dark-500">{{ contact.contact }}</span>
          </div>
        </div>
        <div class="ml-auto">
          <TrashIcon class="w-4 h-4 text-app-text-500" />
        </div>
      </li>
    </ul>
    <div class="font-body text-sm text-app-text-600 dark:text-app-text-dark-500 mb-2">Add new Contact</div>
    <form>
      <div class="mb-4 grid grid-cols-3 space-x-2">
        <div class="col-span-2">
          <TextField placeholder="Enter Contact Name" />
        </div>
        <div class="col-span-1">
          <SelectField v-model="transferType" :items="transferTypes" />
        </div>
      </div>
      <div class="mb-4">
        <TextField placeholder="Enter ETH Address" />
      </div>
      <div>
        <Button class="ml-auto" variant="tertiary">Add Contact</Button>
      </div>
    </form>
  </div>
</template>

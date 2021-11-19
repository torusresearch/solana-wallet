<script setup lang="ts">
import { Contact } from "@toruslabs/base-controllers";
import { TrashIcon } from "@toruslabs/vue-icons/basic";
import { GithubIcon } from "@toruslabs/vue-icons/symbols";
import { useVuelidate } from "@vuelidate/core";
import { helpers, required } from "@vuelidate/validators";
import { computed, reactive, ref } from "vue";

import { Button, SelectField, TextField } from "@/components/common";
import { ALLOWED_VERIFIERS, ALLOWED_VERIFIERS_ERRORS, TransferType } from "@/utils/enums";
import { ruleVerifierId } from "@/utils/helpers";

const ensError = ref("");
const searchFilter = ref("");
const typeFilter = ref<TransferType>();

const transferTypes = ALLOWED_VERIFIERS;
const filterTypes = [
  {
    label: "All",
    value: "",
  },
  ...transferTypes,
];

const props = defineProps<{ stateContacts: Contact[] }>();

const emits = defineEmits(["saveContact", "deleteContact"]);

const contacts = computed<Contact[]>(() => {
  return props.stateContacts.filter((contact) => {
    switch (typeFilter?.value?.value) {
      case "sol":
        if (contact.contact_verifier !== "solana") return false;
        break;
      case null:
      case undefined:
      case "":
        break;
      default:
        if (contact.contact_verifier !== typeFilter?.value?.value) return false;
    }
    if (searchFilter?.value) {
      const nameFilter = new RegExp(searchFilter.value, "i");
      if (!contact.display_name.match(nameFilter)) return false;
    }
    return !!contact;
  });
});

const newContactState = reactive<{
  name: string;
  address: string;
  transferType: TransferType;
}>({
  name: "",
  address: "",
  transferType: transferTypes[0],
});

const validVerifier = (value: string) => {
  if (!newContactState.transferType) return true;
  return ruleVerifierId(newContactState.transferType.value, value);
};

const ensRule = (transferType: TransferType) => {
  if (transferType.value === "ENS" && ensError?.value) return false;
  return true;
};

const getErrorMessage = () => {
  const selectedType = newContactState.transferType?.value || "";
  if (!selectedType) return "";
  return ALLOWED_VERIFIERS_ERRORS[selectedType];
};

const validNewContact = (value: string): boolean => {
  return !props.stateContacts.some((x) => x.contact_verifier_id.toLowerCase() === value.toLowerCase());
};

const isAlnum = (value: string): boolean => {
  return /^[a-zA-Z0-9]+$/.test(value);
};

const rules = {
  name: {
    required: helpers.withMessage("Required", required),
    checkIsAlnum: helpers.withMessage("Name should be alphanumeric", isAlnum),
  },
  address: {
    validTransferTo: helpers.withMessage(getErrorMessage, validVerifier),
    required: helpers.withMessage("Required", required),
    isDuplicateContact: helpers.withMessage("Duplicate", validNewContact),
  },
  transferType: {
    ensRule: helpers.withMessage("ENS Error", ensRule),
  },
};
const $v = useVuelidate(rules, newContactState);

const onSave = () => {
  $v.value.$touch();
  if (!$v.value.$error && !$v.value.$invalid) {
    emits("saveContact", {
      display_name: newContactState.name,
      contact_verifier_id: newContactState.address,
      contact_verifier: newContactState.transferType.value === "sol" ? "solana" : newContactState.transferType.value,
    });
    $v.value.$reset();
    newContactState.name = "";
    newContactState.address = "";
    newContactState.transferType = transferTypes[0];
  }
};

const onDelete = (contactId: number) => {
  emits("deleteContact", contactId);
};
</script>
<template>
  <div class="py-4">
    <div class="grid grid-cols-3 items-center mb-4">
      <div class="col-span-3 sm:col-span-1 font-body text-sm text-app-text-600 dark:text-app-text-dark-500">List of Contacts</div>
      <div class="col-span-3 sm:col-span-2 flex gap-2">
        <TextField v-model="searchFilter" size="small" placeholder="Search by name" />
        <SelectField v-model="typeFilter" size="small" placeholder="Filter by type" :items="filterTypes" />
      </div>
    </div>
    <ul class="border dark:border-gray-900 rounded-md divide-y dark:divide-gray-900 shadow dark:shadow-dark mb-4">
      <li v-for="contact in contacts" :key="contact.id" class="flex items-center py-3 px-4 break-all">
        <div class="flex items-center">
          <div class="bg-app-gray-400 text-app-text-500 rounded-full flex justify-center items-center w-4 h-4 text-xs mr-2">
            <GithubIcon class="w-3 h-3" />
          </div>
          <div class="font-body text-xs text-app-text-600 dark:text-app-text-dark-500">
            {{ contact.display_name }} -
            <span class="text-app-text-500 dark:text-app-text-dark-500">{{ contact.contact_verifier_id }}</span>
          </div>
        </div>
        <div class="ml-auto">
          <TrashIcon class="w-4 h-4 text-app-text-500 dark:text-app-text-dark-500 cursor-pointer" @click="() => onDelete(contact.id)" />
        </div>
      </li>
    </ul>
    <div class="font-body text-sm text-app-text-600 dark:text-app-text-dark-500 mb-2">Add new Contact</div>
    <form @submit.prevent="onSave">
      <div class="mb-4 grid grid-cols-3 gap-2">
        <div class="col-span-3 sm:col-span-2">
          <TextField v-model.lazy="newContactState.name" :errors="$v.name.$errors" placeholder="Enter Contact Name" />
        </div>
        <div class="col-span-3 sm:col-span-1">
          <SelectField v-model="newContactState.transferType" :items="transferTypes" />
        </div>
      </div>
      <div class="mb-4">
        <TextField v-model.lazy="newContactState.address" :errors="$v.address.$errors" placeholder="Enter SOL Address" />
      </div>
      <div>
        <Button class="ml-auto" variant="tertiary" type="submit">Add Contact</Button>
      </div>
    </form>
  </div>
</template>

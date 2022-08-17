<script setup lang="ts">
import TextField from "@toruslabs/vue-components/common/TextField.vue";
import useVuelidate, { ErrorObject } from "@vuelidate/core";
import { helpers } from "@vuelidate/validators";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

import CheckBox from "./CheckBox.vue";

type ItemType = { text: string; value: string };

const props = withDefaults(
  defineProps<{
    label?: string;
    items: ItemType[];
    transferTo?: string;
    contactName?: string;
    checked?: boolean;
    errors?: Array<ErrorObject>;
  }>(),
  {
    label: "",
    transferTo: "",
    contactName: "",
    checked: false,
    errors: () => [],
  }
);

const emits = defineEmits(["update:transferTo", "update:contactName", "update:checked"]);

const value = computed({
  get: () => props.transferTo,
  set: (value2) => emits("update:transferTo", value2),
});

const contactName = computed({
  get: () => props.contactName,
  set: (value2) => emits("update:contactName", value2),
});

const checked = computed({
  get: () => props.checked,
  set: (value2) => emits("update:checked", value2),
});

// proceed to validatation only if checkbox is click
const lengthCheck = (min: number, max: number, contactValue: string): boolean => {
  return !checked.value || (contactValue.length >= min && contactValue.length <= max);
};

const isAlnum = (contactValue: string): boolean => {
  return !checked.value || /^[a-zA-Z0-9]+$/.test(contactValue);
};

const isRequiredandCheckbox = (contactValue: string): boolean => {
  return !checked.value || !!contactValue;
};

const rules = {
  contactName: {
    required: helpers.withMessage("Required", isRequiredandCheckbox),
    checkIsAlnum: helpers.withMessage("Name should be alphanumeric", isAlnum),
    lengthCheck: helpers.withMessage("Name should be less than 255 characters", (contactValue: string) => lengthCheck(0, 255, contactValue)),
  },
};

const $v = useVuelidate(rules, { contactName });

const isListOpen = ref(false);
const filteredItems = computed(() => {
  return props.items.filter((item) => {
    return item.text.toLowerCase().indexOf(value.value.toLowerCase()) >= 0;
  });
});

const { t } = useI18n();

const setSelectedItem = (item: ItemType) => {
  value.value = item.value;
  isListOpen.value = false;
};
const onBlur = () => {
  // delay hiding selection to get the click event
  setTimeout(() => {
    isListOpen.value = false;
  }, 500);
};
</script>

<template>
  <div class="flex flex-col">
    <div v-show="filteredItems.length > 0 && isListOpen" class="absolute inset-0 z-0" @click="isListOpen = false" @keydown="isListOpen = false"></div>

    <div class="text-sm mb-1 text-app-text-600 dark:text-app-text-dark-500">{{ t("walletActivity.sendTo") }}</div>
    <input
      v-model="value"
      type="text"
      class="combo-input-field h-54 z-10 dark:bg-app-gray-800 shadow-inner dark:shadow-none bg-white rounded-md border-0 text-app-text-500 dark:text-app-text-dark-500"
      aria-label="Select field"
      @focus="isListOpen = true"
      @blur="onBlur"
    />

    <div v-if="errors.length" class="mt-1 px-1 text-app-error text-xs">{{ errors[0].$message }}</div>
    <div v-show="filteredItems.length > 0 && isListOpen" class="z-10">
      <ul class="lt-md:w-72 absolute bg-white dark:bg-app-gray-700 rounded-md shadow dark:shadow-dark overflow-hidden">
        <li
          v-for="(filteredItem, idx) in filteredItems"
          :key="idx"
          class="text-app-text-500 break-words py-3 text-sm dark:text-app-text-dark-500 hover:bg-app-gray-200 dark:hover:bg-app-gray-500 cursor-pointer px-4"
          @click="setSelectedItem(filteredItem)"
          @keydown="setSelectedItem(filteredItem)"
        >
          {{ filteredItem.text }}
        </li>
      </ul>
    </div>
    <!-- if no errors and no filtered items ie. no saved contact, show checkbox to save contact-->
    <div v-if="filteredItems.length === 0 && !isListOpen">
      <CheckBox class="mt-4" label="Save Contact" :checked="checked" @change="checked = !checked" />
      <div v-if="checked" class="absolute w-[93%] mt-2">
        <TextField v-model="contactName" :errors="$v.contactName.$errors" :placeholder="t('walletSettings.enterContact')" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.h-54 {
  height: 54px;
}
</style>

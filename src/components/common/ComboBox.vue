<script setup lang="ts">
import { ErrorObject } from "@vuelidate/core";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

type ItemType = { text: string; value: string };

const props = withDefaults(
  defineProps<{
    label?: string;
    items: ItemType[];
    modelValue?: string;
    errors?: Array<ErrorObject>;
  }>(),
  {
    label: "",
    modelValue: "",
    errors: () => [],
  }
);

const emits = defineEmits(["update:modelValue"]);

const value = computed({
  get: () => props.modelValue,
  set: (value2) => emits("update:modelValue", value2),
});

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
      class="h-54 z-10 dark:bg-app-gray-800 shadow-inner dark:shadow-none bg-white rounded-md border-0 text-app-text-500 dark:text-app-text-dark-500"
      aria-label="Select field"
      @focus="isListOpen = true"
      @blur="onBlur"
    />

    <div v-if="errors.length" class="mt-1 px-1 text-app-error text-xs">{{ errors[0].$message }}</div>
    <div v-show="filteredItems.length > 0 && isListOpen" class="z-10">
      <ul class="lt-sm:w-72 absolute bg-white dark:bg-app-gray-700 rounded-md shadow dark:shadow-dark overflow-hidden">
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
  </div>
</template>

<style scoped>
.h-54 {
  height: 54px;
}
</style>

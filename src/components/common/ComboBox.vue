<script setup lang="ts">
import { ErrorObject } from "@vuelidate/core";
import { computed, ref } from "vue";

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
  <div class="combo-container flex flex-col">
    <div v-show="filteredItems.length > 0 && isListOpen" class="absolute inset-0 z-0" @click="isListOpen = false" @keydown="isListOpen = false"></div>

    <div class="text-sm mb-1 font-body text-app-text-600 dark:text-app-text-dark-500">Sending to</div>
    <input v-model="value" type="text" class="combo-input-field" aria-label="Select field" @focus="isListOpen = true" @blur="onBlur" />

    <div v-if="errors?.length" class="flex mt-1 px-1">
      <div v-if="errors.length" class="text-app-error text-xs font-body">{{ errors[0].$message }}</div>
    </div>
    <div v-show="filteredItems.length > 0 && isListOpen" class="z-20">
      <ul class="w-full absolute bg-white dark:bg-app-gray-700 rounded-md shadow dark:shadow-dark overflow-hidden">
        <li
          v-for="(filteredItem, idx) in filteredItems"
          :key="idx"
          class="text-app-text-500 py-3 text-sm dark:text-app-text-dark-500 hover:bg-app-gray-200 dark:hover:bg-app-gray-500 cursor-pointer px-4"
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
.combo-input-field {
  @apply z-20 dark:bg-app-gray-800 shadow-inner dark:shadow-none bg-white rounded-md border-0 text-app-text-500 dark:text-app-text-dark-500;
  height: 54px;
}
</style>

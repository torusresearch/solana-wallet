<script setup lang="ts">
import { ErrorObject } from "@vuelidate/core";
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    size?: "small" | "medium" | "large";
    variant?: "dark-bg" | "light-bg";
    label?: string;
    placeholder?: string;
    modelValue?: string | number;
    errors?: Array<ErrorObject>;
    type?: string;
    spellCheck?: boolean;
    postfixText?: string;
  }>(),
  {
    size: "medium",
    variant: "light-bg",
    label: "",
    placeholder: "",
    modelValue: "",
    errors: () => [],
    type: "text",
    spellCheck: false,
    postfixText: "",
  }
);

const emits = defineEmits(["update:modelValue", "update:postfixTextClicked"]);

const value = computed({
  get: () => props.modelValue,
  set: (val) => emits("update:modelValue", val),
});
</script>

<template>
  <div v-if="label" class="flex flex-row justify-between items-center w-full mb-1">
    <div class="text-sm text-app-text-600 dark:text-app-text-dark-500">
      {{ label }}
    </div>
    <div
      v-if="postfixText?.length"
      class="text-sm text-app-text-accent cursor-pointer select-none ml-2"
      @click="emits(`update:postfixTextClicked`)"
      @keydown="emits(`update:postfixTextClicked`)"
    >
      {{ postfixText }}
    </div>
  </div>
  <div
    class="flex flex-row justify-between items-center shadow-inner dark:shadow-none bg-white rounded-md"
    :class="[`size-${size}`, variant === 'dark-bg' ? 'dark:bg-app-gray-700' : 'dark:bg-app-gray-800']"
  >
    <input
      v-model="value"
      class="border-0 bg-transparent focus:outline-none focus:ring-0 text-app-text-500 dark:text-app-text-dark-500 w-7/12"
      :class="[`size === 'small' ? 'text-xs' : 'text-base'`, $slots.default ? 'w-7/12' : 'w-full']"
      :type="type"
      :placeholder="placeholder"
      aria-label="text field"
      :spellcheck="spellCheck"
    />

    <div class="p-1 h-full"><slot></slot></div>
  </div>
  <div class="flex mt-1 px-1">
    <div v-if="errors.length" class="text-app-error text-xs">{{ errors[0].$message }}</div>
  </div>
</template>

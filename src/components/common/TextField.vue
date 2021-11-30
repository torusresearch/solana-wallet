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
  }
);

const emits = defineEmits(["update:modelValue"]);

const value = computed({
  get: () => props.modelValue,
  set: (val) => emits("update:modelValue", val),
});
</script>

<template>
  <div class="relative w-full items-stretch">
    <div v-if="label" class="label-container mb-1">
      <div class="text-sm font-body text-app-text-600 dark:text-app-text-dark-500">
        {{ label }}
      </div>
    </div>
    <div
      class="input-container flex shadow-inner dark:shadow-none bg-white rounded-md"
      :class="[`size-${size}`, variant === 'dark-bg' ? 'dark:bg-app-gray-700' : 'dark:bg-app-gray-800']"
    >
      <input
        v-model="value"
        class="w-full font-body border-0 bg-transparent focus:outline-none focus:ring-0 text-app-text-500 dark:text-app-text-dark-500"
        :class="size === 'small' ? 'text-xs' : 'text-base'"
        :type="type"
        :placeholder="placeholder"
        aria-label="text field"
        :spellcheck="spellCheck"
      />
    </div>
    <div v-if="errors?.length" class="flex mt-1 px-1">
      <div v-if="errors.length" class="text-app-error text-xs font-body">{{ errors[0].$message }}</div>
    </div>
  </div>
</template>

<style scoped>
.size-small {
  height: 32px;
}
.size-medium {
  height: 54px;
}
.size-large {
  height: 60px;
}
</style>

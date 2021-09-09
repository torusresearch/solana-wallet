<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    size?: "small" | "medium" | "large";
    label?: string;
    placeholder?: string;
    modelValue?: string | number;
  }>(),
  {
    size: "medium",
    label: "",
    placeholder: "",
    modelValue: "",
  }
);

const emits = defineEmits(["update:modelValue"]);

const value = computed({
  get: () => props.modelValue,
  set: (value) => emits("update:modelValue", value),
});
</script>

<template>
  <div class="relative w-full items-stretch">
    <div v-if="label" class="label-container mb-1">
      <div
        class="text-sm font-body text-app-text-600 dark:text-app-text-dark-500"
      >
        {{ label }}
      </div>
    </div>
    <div
      class="
        input-container
        flex
        shadow-inner
        dark:shadow-none
        bg-white
        dark:bg-app-gray-800
        rounded-md
      "
      :class="`size-${size}`"
    >
      <input
        v-model="value"
        class="
          w-full
          font-body
          border-0
          bg-transparent
          focus:outline-none focus:ring-0
          text-app-text-500
          dark:text-app-text-dark-500
        "
        :class="size === 'small' ? 'text-xs' : 'text-base'"
        type="text"
        :placeholder="placeholder"
      />
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

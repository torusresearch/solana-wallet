<script setup lang="ts">
import { ButtonHTMLAttributes, computed } from "vue";

const props = withDefaults(
  defineProps<{
    size?: "small" | "medium" | "large";
    variant?: "primary" | "secondary" | "tertiary" | "text";
    block?: boolean;
    type?: ButtonHTMLAttributes["type"];
    loading?: boolean;
  }>(),
  {
    size: "medium",
    variant: "primary",
    block: false,
    type: "button",
    loading: false,
  }
);

const classList = computed(() => {
  let sizeClass = "";
  const fontClasses = ["font-body"];
  if (props.variant === "text") {
    fontClasses.push("text-xs");
  } else {
    sizeClass = `size-${props.size}`;
    fontClasses.push("text-base");
  }

  return [...fontClasses, sizeClass, `t-btn-${props.variant}`, { block: props.block }];
});
</script>

<template>
  <button class="flex items-center justify-center" :class="classList" :type="type" :disabled="loading">
    <div
      v-if="loading"
      style="border-top-color: transparent"
      class="w-5 h-5 border-2 border-app-gray-500 border-solid rounded-full animate-spin"
    ></div>
    <slot v-else></slot>
  </button>
</template>

<style scoped>
.size-small {
  height: 40px;
}
.size-medium {
  height: 48px;
}
.size-large {
  height: 60px;
}
.block {
  width: 100%;
}
</style>

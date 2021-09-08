<script setup lang="ts">
import { ButtonHTMLAttributes, computed } from "vue";

const props = withDefaults(
  defineProps<{
    size?: "small" | "medium" | "large";
    variant?: "primary" | "secondary" | "tertiary" | "text";
    block?: boolean;
    type?: ButtonHTMLAttributes["type"];
  }>(),
  {
    size: "medium",
    variant: "primary",
    block: false,
    type: "button",
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

  return [
    ...fontClasses,
    sizeClass,
    `t-btn-${props.variant}`,
    { block: props.block },
  ];
});
</script>

<template>
  <button
    class="flex items-center justify-center"
    :class="classList"
    :type="type"
  >
    <slot></slot>
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

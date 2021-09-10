<script setup lang="ts">
withDefaults(
  defineProps<{
    height?: number | string;
  }>(),
  {
    height: "inherit",
  }
);
</script>

<template>
  <div
    class="
      card-container
      bg-white
      dark:bg-app-gray-700
      border border-solid border-app-gray-200
      dark:border-transparent
      rounded-md
      shadow
      dark:shadow-dark
      px-6
      py-4
    "
    :style="{ height }"
  >
    <slot></slot>
    <div class="footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<style scoped>
.card-container {
  position: relative;
}
.footer {
  position: absolute;
  width: calc(100% - 48px);
  bottom: 16px;
  right: 24px;
  left: 24px;
}
</style>

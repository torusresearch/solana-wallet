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
    class="bg-white dark:bg-app-gray-700 border border-solid border-app-gray-300 dark:border-transparent rounded-md shadow dark:shadow-dark px-6 py-4 flex flex-row items-start justify-between"
    :style="{ height }"
  >
    <div class="flex flex-col items-start justify-between flex-grow flex-shrink h-full">
      <div class="flex-grow w-full flex flex-row justify-start items-start">
        <div id="card-content-parent" class="flex flex-col justify-start items-start h-full w-full">
          <slot></slot>
        </div>
        <span class="gt-sm:hidden h-full flex justify-center items-center"><slot name="right-content"></slot></span>
      </div>
      <slot name="footer"></slot>
    </div>
    <span class="lt-sm:hidden block h-full flex justify-center items-center"> <slot name="right-content"></slot> </span>
  </div>
</template>

<style scoped>
.footer {
  /*width: calc(100% - 48px);*/
}
</style>

<script setup lang="ts">
const props = defineProps<{
  breadCrumbData: { text: string; id?: string | number }[];
}>();
</script>
<template>
  <div class="flex flex-row justify-start items-center">
    <div v-for="(data, idx) in props.breadCrumbData" :key="data.text">
      <p class="text-app-text-500 dark:text-app-text-dark-500 font-bold text-base mr-1">
        {{ data.text }}{{ `${idx + 1 < props.breadCrumbData.length ? " >>" : ""}` }}
      </p>
    </div>
  </div>
</template>

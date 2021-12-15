<script setup lang="ts">
const props = defineProps<{
  breadCrumbData: { text: string; id?: string | number }[];
}>();
</script>
<template>
  <div class="flex flex-row justify-start items-center font-body">
    <div v-for="(data, idx) in props.breadCrumbData" :key="data.text">
      <p class="text-app-text-500 dark:text-app-text-dark-500 crumb-text mr-1">
        {{ data.text }}{{ `${idx + 1 < props.breadCrumbData.length ? " >>" : ""}` }}
      </p>
    </div>
  </div>
</template>
<style scoped>
.crumb-text {
  font-weight: 700;
  font-size: 16px;
}
</style>

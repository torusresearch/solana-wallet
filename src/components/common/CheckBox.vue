<script setup lang="ts">
withDefaults(
  defineProps<{
    checked?: boolean;
    label?: string;
  }>(),
  {
    block: false,
    checked: false,
    label: "CheckBox",
  }
);
</script>

<template>
  <div>
    <div class="form-check">
      <label for="checkbox" class="flex items-center form-check-label text-app-text-600 dark:text-app-text-dark-500">
        <input
          id="checkbox"
          :v-model="checked"
          type="checkbox"
          class="form-check-input mr-2 appearance-none h-4 w-4 border border-gray-300 focus:outline-app-primary-500 rounded-sm bg-white checked:bg-app-primary-500 checked:border-app-primary-500 checked:outline-app-primary-500 checked:text-app-primary-500 cursor-pointer"
          value=""
        />
        {{ label }}
      </label>
    </div>
  </div>
</template>

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
      <label for="checkbox" class="form-check-label inline-block text-app-text-600 dark:text-app-text-dark-500">
        <input
          id="checkbox"
          :v-model="checked"
          type="checkbox"
          class="form-check-input appearance-none h-4 w-4 border border-gray-300 dark:border- rounded-sm bg-white checked:bg-app-primary-500 checked:border-app-primary-500 focus:outline-none checked:text-app-primary-500 cursor-pointer"
          value=""
        />
        {{ label }}
      </label>
    </div>
  </div>
</template>

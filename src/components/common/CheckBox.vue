<script setup lang="ts">
withDefaults(
  defineProps<{
    checked?: boolean;
    label?: string;
    labelPosition?: string;
  }>(),
  {
    block: false,
    checked: false,
    label: "CheckBox",
    labelPosition: "left",
  }
);
</script>

<template>
  <div>
    <div class="form-check">
      <label for="checkbox" class="flex items-center text-sm form-check-label text-app-text-600 dark:text-app-text-dark-500">
        {{ labelPosition === "right" ? label : "" }}
        <input
          id="checkbox"
          :v-model="checked"
          type="checkbox"
          class="form-check-input appearance-none h-4 w-4 border border-gray-300 focus:outline-app-primary-500 rounded-sm bg-white checked:bg-app-primary-500 checked:border-app-primary-500 checked:outline-app-primary-500 checked:text-app-primary-500 cursor-pointer"
          :class="[labelPosition === 'right' ? 'ml-1' : 'mr-1']"
          value=""
        />
        {{ labelPosition === "left" ? label : "" }}
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/common";
import ControllerModule from "@/modules/controllers";
</script>
<template>
  <div class="pb-4">
    <div class="text-sm font-body mb-2 text-app-text-600 dark:text-app-text-dark-500">Select a theme</div>
    <div class="grid grid-cols-2 space-x-3">
      <div>
        <Button :variant="ControllerModule.isDarkMode ? 'tertiary' : 'primary'" :block="true" @click="ControllerModule.setTheme('light')"
          >Light</Button
        >
      </div>
      <div>
        <Button :variant="ControllerModule.isDarkMode ? 'primary' : 'tertiary'" :block="true" @click="ControllerModule.setTheme('dark')">Dark</Button>
      </div>
    </div>
  </div>
</template>

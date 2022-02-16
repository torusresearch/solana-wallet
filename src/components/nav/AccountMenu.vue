<script setup lang="ts">
import { Menu, MenuButton, MenuItems } from "@headlessui/vue";
import { UserInfo } from "@toruslabs/base-controllers";
import { ChevronBottomIcon } from "@toruslabs/vue-icons/arrows";
import { useI18n } from "vue-i18n";

defineProps<{
  user: UserInfo;
}>();
const { t } = useI18n();
</script>

<template>
  <Menu as="div" class="ml-3 relative z-50">
    <div>
      <MenuButton class="max-w-xs flex items-center text-sm outline-focus" tabindex="0">
        <span class="sr-only">{{ t("navBar.userMenu") }}</span>
        <div class="flex items-center">
          <span class="text-app-text-600 dark:text-app-text-dark-500 text-sm font-bold mr-1">{{ user?.name }}</span>
          <ChevronBottomIcon class="text-app-text-600 dark:text-app-text-dark-500 w-4" />
        </div>
      </MenuButton>
    </div>
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <MenuItems
        class="origin-top-right absolute right-0 mt-2 w-96 rounded-md shadow-lg dark:shadow-dark py-1 bg-white dark:bg-app-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none"
        ><slot />
      </MenuItems>
    </transition>
  </Menu>
</template>

<style scoped>
.outline-focused:focus {
  outline: 2px solid white;
  outline-offset: 2px;
}
</style>

<script setup lang="ts">
import { MenuIcon } from "@toruslabs/vue-icons/basic";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import { Button } from "@/components/common";

const router = useRouter();

const showNav = ref(false);
const toggleNav = () => {
  showNav.value = !showNav.value;
};
onMounted(() => {
  router.beforeResolve(() => {
    showNav.value = false;
  });
});
</script>

<template>
  <Button variant="text" @click="toggleNav()"><MenuIcon class="w-6 h-6 text-app-primary-500 wl-color" /></Button>

  <div
    :class="{ hidden: !showNav }"
    class="fixed bg-app-gray-900 opacity-40 inset-0 z-20"
    @click.self="toggleNav()"
    @keydown.self="toggleNav()"
  ></div>
  <div
    :class="{ 'translate-x-full': !showNav }"
    class="fixed bg-white dark:bg-app-gray-700 w-80 right-0 inset-y-0 z-20 transition duration-200 ease-in-out overflow-auto"
  >
    <slot />
  </div>
</template>

<style scoped></style>

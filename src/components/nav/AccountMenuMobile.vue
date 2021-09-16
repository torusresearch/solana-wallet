<script setup lang="ts">
import { MenuIcon } from "@toruslabs/vue-icons/basic";
import { ref } from "vue";

import { Button } from "@/components/common";

import AccountMenuList from "./AccountMenuList.vue";

const showNav = ref(false);
const toggleNav = () => {
  showNav.value = !showNav.value;
};
</script>

<template>
  <Button variant="text" @click="toggleNav()"><MenuIcon class="w-6 h-6 text-app-primary-500" /></Button>

  <div :class="{ hidden: !showNav }" class="fixed bg-app-gray-900 opacity-40 inset-0 z-10" @click.self="toggleNav()"></div>
  <div :class="{ 'translate-x-full': !showNav }" class="fixed bg-white w-80 right-0 inset-y-0 z-10 transform transition duration-200 ease-in-out">
    <AccountMenuList />
  </div>
</template>

<style scoped></style>

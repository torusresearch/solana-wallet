<script setup lang="ts"></script>

<template>
  <div class="w-full mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 items-center justify-items-center">
    <div class="w-full cursor-pointer bg-white dark:bg-app-gray-700 rounded-lg shadow-md dark:shadow-dark">
      <div class="flex flex-col">
        <div class="w-full relative nft-image">
          <div class="w-full"></div>
          <img alt="" class="skeleton-animation w-full pt-[100%] rounded-xl" />
        </div>
        <div class="flex items-center justify-between h-20 px-2 nft-info">
          <div class="flex flex-col space-y-1 w-[70%]">
            <p class="token-name skeleton-animation skeleton-p w-3/4 h-3 mb-2 rounded-md"></p>
            <p
              class="font-normal text-xs leading-3 skeleton-animation w-3/4 h-3 mb-2 rounded-md skeleton-p truncate text-app-text-600 dark:text-app-text-400"
            ></p>
          </div>
          <div class="rounded-full overflow-hidden h-10 w-10">
            <img alt="" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.token-name {
  @apply font-bold text-sm leading-5 text-gray-800 break-all dark:text-app-text-dark-white truncate;
}
</style>

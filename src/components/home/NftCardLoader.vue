<script setup lang="ts"></script>

<template>
  <div class="w-full mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 items-center justify-items-center">
    <div class="w-full cursor-pointer bg-white dark:bg-app-gray-700 rounded-lg shadow-md dark:shadow-dark">
      <div class="flex flex-col">
        <div class="w-full relative profile-image">
          <div class="w-full"></div>
          <img alt="" />
        </div>
        <div class="flex items-center justify-between h-20 px-2 profile-info">
          <div class="flex flex-col space-y-1 w-[70%]">
            <p class="token-name"></p>
            <p class="font-normal text-xs leading-3 truncate text-app-text-600 dark:text-app-text-400"></p>
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
.profile-image img {
  width: 100%;
  padding-top: 100%;
  border-radius: 0.75rem;

  animation: skeleton-loading 1s linear infinite alternate;
}
.profile-info span {
  height: 16px;
  display: block;
  animation: skeleton-loading 1s linear infinite alternate;
}
.profile-info h3 {
  animation: skeleton-loading 1s linear infinite alternate;
}
.profile-info p {
  width: 80%;
  height: 0.7rem;
  margin-bottom: 0.5rem;
  border-radius: 0.25rem;
  animation: skeleton-loading 1s linear infinite alternate;
}
@-webkit-keyframes skeleton-loading {
  0% {
    background-color: #c2cfd6;
  }
  100% {
    background-color: #f0f3f5;
  }
}

@keyframes skeleton-loading {
  0% {
    background-color: #c2cfd6;
  }
  100% {
    background-color: #f0f3f5;
  }
}
</style>

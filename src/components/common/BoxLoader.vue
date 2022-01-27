<script setup lang="ts">
const hidden = [4, 6, 7, 9];
const spinnerStyle = () => {
  const delay = Math.random();
  return {
    animationDelay: `-${delay.toFixed(2)}s`,
  };
};
</script>
<template>
  <div class="box-loader inline-block">
    <div
      v-for="n in 9"
      :key="n"
      class="box-loader_beat inline-block bg-app-primary-500 w-5 h-5 rounded-full"
      :class="[`box-loader_beat-${n % 2 ? 'odd' : 'even'}`, { 'box-loader_beat--hidden': hidden.includes(n) }]"
      :style="spinnerStyle()"
    ></div>
  </div>
</template>

<style scoped>
.box-loader {
  width: 84px;
  line-height: 0;
}
.box-loader_beat {
  margin: 2px;
}
.box-loader_beat.box-loader_beat--hidden {
  opacity: 0;
}
.box-loader_beat:not(.box-loader_beat--hidden) {
  animation: lds-grid 1.2s linear infinite;
}
@keyframes lds-grid {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}
</style>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

const props = withDefaults(
  defineProps<{
    isDark?: boolean;
  }>(),
  {
    isDark: true,
  }
);

const isDark = computed(() => {
  return props.isDark;
});

let slideTimer: any;
const show = ref(false);
const slideValues = [
  {
    image: `login-bg-new-${isDark.value ? "dark-" : ""}1.svg`,
    title: "login.slide1Title",
    subtitle1: "login.slide1Subtitle1",
    subtitle2: "login.slide1Subtitle2",
    id: 0,
  },
  {
    image: `login-bg-new-${isDark.value ? "dark-" : ""}2.svg`,
    title: "login.slide2Title",
    subtitle1: "login.slide2Subtitle1",
    subtitle2: "login.slide2Subtitle2",
    id: 1,
  },
  {
    image: `login-bg-new-${isDark.value ? "dark-" : ""}3.svg`,
    title: "login.slide3Title",
    subtitle1: "login.slide3Subtitle1",
    subtitle2: "login.slide3Subtitle2",
    id: 2,
  },
];
const slides = ref(slideValues);
const current = ref(0);
const direction = ref(1);
const setSliderInterval = () => {
  slideTimer = setInterval(() => {
    current.value = current.value < 2 ? (current.value += 1) : 0;
  }, 6000);
};
const slide = (dir: number) => {
  direction.value = dir;
  current.value = dir;
  clearInterval(slideTimer);
  setSliderInterval();
};
onMounted(() => {
  show.value = true;
  setSliderInterval();
});
</script>
<template>
  <div>
    <transition-group name="slide-next" tag="div" class="slides-group">
      <div :key="current" class="slide">
        <img :src="require(`../../assets/${slides[current].image}`)" alt="Landing page" />
      </div>
    </transition-group>
    <div class="font-header text-xl mb-2">{{ slides[current].title }}</div>
    <div class="text-base">{{ slides[current].subtitle1 }}</div>
    <div v-if="slides[current].subtitle2" class="text-base">{{ slides[current].subtitle2 }}</div>
    <button
      type="button"
      value="0"
      class="button-carousel"
      :class="{ 'button-active': current === 0 }"
      aria-label="Carousel slide 1 of 3"
      @click="slide(0)"
    >
      <span class="v-btn__content"><i aria-hidden="true" class="v-icon notranslate mdi mdi-circle theme--dark" style="font-size: 18px"></i></span>
    </button>
    <button
      type="button"
      value="0"
      :class="{ 'button-active': current === 1 }"
      class="button-carousel"
      aria-label="Carousel slide 2 of 3"
      @click="slide(1)"
    >
      <span class="v-btn__content"><i aria-hidden="true" class="v-icon notranslate mdi mdi-circle theme--dark" style="font-size: 18px"></i></span>
    </button>
    <button
      type="button"
      :class="{ 'button-active': current === 2 }"
      value="0"
      class="button-carousel"
      aria-label="Carousel slide 3 of 3"
      @click="slide(2)"
    >
      <span class="v-btn__content"><i aria-hidden="true" class="v-icon notranslate mdi mdi-circle theme--dark" style="font-size: 18px"></i></span>
    </button>
  </div>
</template>
<style scoped>
.button-carousel {
  width: 14px;
  height: 6px;
  margin: 0 5px;
  border-radius: 3px;
  background-color: #a4cafe;
}
.button-active {
  background-color: #0364ff;
  width: 28px;
}
.display-none {
  display: none;
}

/* FADE IN */
.fade-enter-active {
  transition: opacity 1s;
}
.fade-enter {
  opacity: 0;
}

/* GO TO NEXT SLIDE */
.slide-next-enter-active,
.slide-next-leave-active {
  display: none;
}
.slide-next-enter {
  transition: transform 0.1s ease-in-out;
}
.slide-next-leave-to {
  display: none;
  opacity: 0;
}
.slide {
  min-height: 400px;
}
</style>

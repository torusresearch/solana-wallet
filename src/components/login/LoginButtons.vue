<script setup lang="ts">
import { LOGIN_PROVIDER } from "@toruslabs/openlogin";
import Button from "@toruslabs/vue-components/common/Button.vue";
import { ChevronBottomIcon } from "@toruslabs/vue-icons/arrows";
import {
  AppleIcon,
  DiscordIcon,
  FacebookIcon,
  GithubIcon,
  GoogleIcon,
  KakaoIcon,
  LineIcon,
  LinkedinIcon,
  RedditIcon,
  TwitchIcon,
  TwitterIcon,
  WechatIcon,
} from "@toruslabs/vue-icons/auth";
import { useVuelidate } from "@vuelidate/core";
import { email, required } from "@vuelidate/validators";
import { computed, ref, RenderFunction } from "vue";

import {
  ActiveAppleIcon,
  ActiveDiscordIcon,
  ActiveFacebookIcon,
  ActiveGithubIcon,
  ActiveGoogleIcon,
  ActiveKakaoIcon,
  ActiveLineIcon,
  ActiveLinkedinIcon,
  ActiveRedditIcon,
  ActiveTwitchIcon,
  ActiveTwitterIcon,
  ActiveWechatIcon,
} from "@/assets/auth";
import { LOGIN_CONFIG } from "@/utils/enums";

import { TextField } from "../common";

const iconList: Record<string, { default: RenderFunction; active: string }> = {
  google: {
    default: GoogleIcon,
    active: ActiveGoogleIcon,
  },
  facebook: {
    default: FacebookIcon,
    active: ActiveFacebookIcon,
  },
  twitter: {
    default: TwitterIcon,
    active: ActiveTwitterIcon,
  },
  discord: {
    default: DiscordIcon,
    active: ActiveDiscordIcon,
  },
  line: {
    default: LineIcon,
    active: ActiveLineIcon,
  },
  apple: {
    default: AppleIcon,
    active: ActiveAppleIcon,
  },
  github: {
    default: GithubIcon,
    active: ActiveGithubIcon,
  },
  twitch: {
    default: TwitchIcon,
    active: ActiveTwitchIcon,
  },
  linkedin: {
    default: LinkedinIcon,
    active: ActiveLinkedinIcon,
  },
  wechat: {
    default: WechatIcon,
    active: ActiveWechatIcon,
  },
  kakao: {
    default: KakaoIcon,
    active: ActiveKakaoIcon,
  },
  reddit: {
    default: RedditIcon,
    active: ActiveRedditIcon,
  },
};

const props = withDefaults(
  defineProps<{
    loginButtons: LOGIN_CONFIG[];
    activeButton: string;
    isEmbed?: boolean;
  }>(),
  {
    isEmbed: false,
  }
);
const viewMoreOptions = ref(false);
const userEmail = ref("");

const mainButtons = computed(() => {
  return props.loginButtons.filter((button: LOGIN_CONFIG) => {
    if (viewMoreOptions.value) {
      return button.description === "";
    }
    return button.mainOption && button.description === "";
  });
});
const rules = computed(() => {
  return {
    userEmail: { required, email },
  };
});
const $v = useVuelidate(rules, { userEmail });

const emits = defineEmits(["onLogin", "onHover"]);

const login = (verifier: string) => {
  emits("onLogin", verifier);
};
const hover = (verifier: string) => {
  emits("onHover", verifier);
};
const onEmailLogin = () => {
  $v.value.$touch();
  if (!$v.value.$invalid) {
    emits("onLogin", LOGIN_PROVIDER.EMAIL_PASSWORDLESS, userEmail.value);
  }
};
const toggleViewMore = () => {
  viewMoreOptions.value = !viewMoreOptions.value;
};
</script>

<template>
  <div class="grid grid-cols-3 gap-2 w-full" :class="{ 'sm:w-10/12': !isEmbed }">
    <div class="col-span-3">
      <Button variant="tertiary" :block="true" @click="login(LOGIN_PROVIDER.GOOGLE)" @mouseover="hover(LOGIN_PROVIDER.GOOGLE)">
        <img v-if="activeButton === LOGIN_PROVIDER.GOOGLE" class="w-6 mr-2" :src="iconList[LOGIN_PROVIDER.GOOGLE].active" alt="" />
        <component :is="iconList[LOGIN_PROVIDER.GOOGLE].default" v-else class="w-6 h-6 mr-1 text-app-text-400" />
        <span class="text-app-text-400">Continue with Google</span></Button
      >
    </div>
    <div v-for="loginButton in mainButtons" :key="loginButton.loginProvider" class="col-span-1">
      <Button
        v-if="loginButton.loginProvider"
        variant="tertiary"
        icon
        :block="true"
        :title="loginButton.loginProvider"
        @click="login(loginButton.loginProvider)"
        @mouseover="hover(loginButton.loginProvider)"
      >
        <img v-if="activeButton === loginButton.loginProvider" class="w-6 mr-1" :src="iconList[loginButton.loginProvider].active" alt="" />
        <component :is="iconList[loginButton.loginProvider].default" v-else class="w-6 h-6 mr-1 text-app-text-400" />
      </Button>
    </div>
  </div>
  <div class="mt-3 relative w-full" :class="{ 'sm:w-10/12': !isEmbed }">
    <div class="absolute inset-0 flex items-center" aria-hidden="true">
      <div class="w-full border-t border-app-text-400" />
    </div>
    <div class="relative flex justify-center text-sm">
      <span class="px-2 bg-white dark:bg-app-gray-800 text-app-text-500 dark:text-app-text-dark-600">or</span>
    </div>
  </div>
  <div class="mt-3 w-full" :class="{ 'sm:w-10/12': !isEmbed }">
    <form @submit.prevent="onEmailLogin">
      <TextField v-model.lazy="userEmail" variant="dark-bg" class="mb-3" placeholder="Enter your email" :errors="$v.userEmail.$errors" />
      <Button variant="tertiary" :block="true" type="submit">Continue with Email</Button>
    </form>
  </div>
  <div class="mt-2 w-full flex justify-end" :class="{ 'sm:w-10/12': !isEmbed }">
    <Button variant="text" class="text-app-text-500 text-sm" type="button" @click="toggleViewMore"
      >{{ viewMoreOptions ? "View less options" : "View more options" }}<ChevronBottomIcon class="ml-1 h-3 w-3 text-gray-400" aria-hidden="true"
    /></Button>
  </div>
</template>

<style scoped></style>

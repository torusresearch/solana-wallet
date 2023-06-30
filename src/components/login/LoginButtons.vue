<script setup lang="ts">
import { LOGIN_PROVIDER } from "@toruslabs/openlogin-utils";
import Button from "@toruslabs/vue-components/common/Button.vue";
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
import { useI18n } from "vue-i18n";

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

const { t } = useI18n();
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
</script>

<template>
  <div :class="isEmbed ? 'grid grid-cols-3 gap-4 w-full' : 'grid grid-cols-3 gap-2 w-full sm:w-10/12'">
    <div class="col-span-3">
      <Button
        :size="isEmbed ? 'small' : 'medium'"
        :class="isEmbed && 'embed-google relative'"
        :variant="isEmbed ? 'secondary' : 'tertiary'"
        :block="true"
        @click="login(LOGIN_PROVIDER.GOOGLE)"
        @keydown="login(LOGIN_PROVIDER.GOOGLE)"
        @mouseover="hover(LOGIN_PROVIDER.GOOGLE)"
        @focus="hover(LOGIN_PROVIDER.GOOGLE)"
      >
        <div v-if="isEmbed" class="w-10 h-10 absolute left-1 flex justify-center items-center rounded-md bg-white">
          <img class="w-4 h-4" :src="iconList[LOGIN_PROVIDER.GOOGLE].active" alt="" />
        </div>
        <img v-else-if="activeButton === LOGIN_PROVIDER.GOOGLE" class="w-6 h-6" :src="iconList[LOGIN_PROVIDER.GOOGLE].active" alt="" />
        <component :is="iconList[LOGIN_PROVIDER.GOOGLE].default" v-else class="w-6 h-6 mr-1 text-app-text-400" />
        <span :class="isEmbed ? 'text-white font-bold' : 'text-app-text-400'">{{ t("dappLogin.continue", { verifier: "Google" }) }}</span></Button
      >
    </div>
    <div v-for="loginButton in mainButtons" :key="loginButton.loginProvider" class="col-span-1">
      <Button
        v-if="loginButton.loginProvider"
        :size="isEmbed ? 'small' : 'medium'"
        :class="isEmbed && `embed-${loginButton.loginProvider}`"
        :variant="isEmbed ? 'secondary' : 'tertiary'"
        icon
        :block="true"
        :title="loginButton.loginProvider"
        @click="login(loginButton.loginProvider)"
        @keydown="login(loginButton.loginProvider)"
        @mouseover="hover(loginButton.loginProvider)"
        @focus="hover(loginButton.loginProvider)"
      >
        <img
          v-if="activeButton === loginButton.loginProvider && !isEmbed"
          class="w-6 mr-1"
          :src="iconList[loginButton.loginProvider].active"
          alt=""
        />
        <component :is="iconList[loginButton.loginProvider].default" v-else class="w-8 h-8 mr-0 text-white" />
      </Button>
    </div>
  </div>
  <div :class="isEmbed ? 'mt-4 relative w-full' : 'mt-3 relative w-full sm:w-10/12'">
    <div class="absolute inset-0 flex items-center" aria-hidden="true">
      <div class="w-full border-t border-app-text-400" />
    </div>
    <div class="relative flex justify-center text-sm">
      <span class="px-2 bg-white dark:bg-app-gray-800 text-app-text-500 dark:text-app-text-dark-600">{{ t("login.or") }}</span>
    </div>
  </div>
  <div :class="isEmbed ? 'mt-4 w-full' : 'sm:w-10/12 mt-3 w-full'">
    <form @submit.prevent="onEmailLogin">
      <TextField
        v-model.lazy="userEmail"
        :size="isEmbed ? 'medium' : 'medium'"
        variant="dark-bg"
        :placeholder="t('login.enterYourEmail')"
        :errors="$v.userEmail.$errors"
      />
      <Button
        :size="isEmbed ? 'medium' : 'medium'"
        :variant="isEmbed ? 'primary' : 'tertiary'"
        :class="isEmbed ? 'mt-4 font-bold continue text-base' : 'mt-3'"
        :block="true"
        type="submit"
        >{{ t("dappLogin.continue", { verifier: t("loginCountry.email") }) }}</Button
      >
    </form>
  </div>
</template>

<style scoped>
button.continue {
  background-color: rgba(214, 164, 255, 0.12);
  color: rgb(214, 164, 255);
  font-family: "DM Sans", "Roboto", "Helvetica Neue", Helvetica, Arial, sans-serif !important;
}
button.continue:hover,
button.continue:active {
  background-color: rgba(214, 164, 255, 0.2) !important;
}
.embed-google {
  height: 3rem !important;
  background-color: #4285f4 !important;
  border: none !important;
  padding-left: 3rem;
  font-family: "DM Sans", "Roboto", "Helvetica Neue", Helvetica, Arial, sans-serif !important;
}

.embed-google:hover {
  background-color: rgba(66, 133, 244, 0.8) !important;
}
.embed-facebook {
  height: 3rem !important;
  background-color: #1977f3 !important;
  border: none !important;
}
.embed-facebook:hover {
  background-color: rgba(25, 119, 243, 0.8) !important;
}
.embed-twitter {
  height: 3rem !important;
  background-color: #4d9fec !important;
  border: none !important;
}

.embed-twitter:hover {
  background-color: rgba(77, 159, 236, 0.8) !important;
}

.embed-discord {
  height: 3rem !important;
  background-color: #5865f2 !important;
  border: none !important;
}
.embed-discord:hover {
  background-color: rgba(88, 101, 242, 0.8) !important;
}

@media screen and (max-width: 639px) {
  .embed-discord,
  .embed-facebook,
  .embed-twitter {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
</style>

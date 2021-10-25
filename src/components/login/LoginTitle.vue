<script setup lang="ts">
import { LOGIN_PROVIDER } from "@toruslabs/openlogin";

import { LOGIN_CONFIG } from "@/utils/enums";

withDefaults(
  defineProps<{
    buttonDetails: LOGIN_CONFIG | undefined;
    isEmbed?: boolean;
  }>(),
  {
    isEmbed: false,
  }
);
</script>

<template>
  <div v-if="buttonDetails" class="font-header text-app-text-500 dark:text-app-text-dark-400" :class="{ 'mb-4': !isEmbed }">
    <template v-if="isEmbed">
      <div class="text-2xl">Sign in</div>
      <div class="text-lg">
        Your digital wallet with
        <span v-if="buttonDetails.loginProvider === LOGIN_PROVIDER.GOOGLE">
          <span class="verifier-title__google-blue">G</span>
          <span class="verifier-title__google-red">o</span>
          <span class="verifier-title__google-yellow">o</span>
          <span class="verifier-title__google-blue">g</span>
          <span class="verifier-title__google-green">l</span>
          <span class="verifier-title__google-red">e</span>
        </span>
        <span v-else :class="[`verifier-title__${buttonDetails.name.toLowerCase()}`]">{{ buttonDetails.name }}</span>
      </div>
    </template>
    <template v-else>
      <div class="text-2xl sm:text-3xl">
        Your
        <span v-if="buttonDetails.loginProvider === LOGIN_PROVIDER.GOOGLE">
          <span class="verifier-title__google-blue">G</span>
          <span class="verifier-title__google-red">o</span>
          <span class="verifier-title__google-yellow">o</span>
          <span class="verifier-title__google-blue">g</span>
          <span class="verifier-title__google-green">l</span>
          <span class="verifier-title__google-red">e</span>
        </span>
        <span v-else :class="[`verifier-title__${buttonDetails.name.toLowerCase()}`]">{{ buttonDetails.name }}</span>
      </div>
      <div class="text-2xl sm:text-3xl">digital wallet in one-click</div>
    </template>
  </div>
</template>

<style scoped>
.verifier-title__google-blue {
  color: #4285f4;
}
.verifier-title__google-red {
  color: #ea4335;
}
.verifier-title__google-yellow {
  color: #fbbc05;
}
.verifier-title__google-green {
  color: #34a853;
}
.verifier-title__facebook {
  color: #3478ea;
}
.verifier-title__reddit {
  color: #ff4500;
}
.verifier-title__twitch {
  color: #695790;
}
.verifier-title__discord {
  color: #7289da;
}
.verifier-title__github {
  color: #000000;
}
.verifier-title__linkedin {
  color: #2867b2;
}
.verifier-title__twitter {
  color: #55acee;
}
.verifier-title__weibo {
  color: #e71f19;
}
.verifier-title__kakao {
  color: #f7e004;
}
.verifier-title__email {
  color: #000000;
}
.verifier-title__email_password {
  color: #000000;
}
.verifier-title__line {
  color: #00b900;
}
.verifier-title__apple {
  color: #000000;
}
.verifier-title__wechat {
  color: #2dc100;
}
.verifier-title__jwt {
  color: #000000;
}
</style>

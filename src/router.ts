import { createRouter, createWebHistory } from "vue-router";

import { PKG } from "@/const";

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: [
    { path: "/", redirect: "/login" },
    {
      path: "/login",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "LOGIN" */ "@/pages/Login.vue"),
      meta: { title: "Login" },
    },
    {
      path: "/start",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "START" */ "@/pages/Start.vue"),
      meta: { title: "Start" },
    },
    {
      path: "/end",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "END" */ "@/pages/End.vue"),
      meta: { title: "End" },
    },
    {
      path: "/confirm",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "CONFIRM" */ "@/pages/Confirm.vue"),
      meta: { title: "Confirm" },
    },
    {
      path: "/confirm_message",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "CONFIRM_MESSAGE" */ "@/pages/ConfirmMessage.vue"),
      meta: { title: "Sign Message" },
    },
    {
      path: "/redirect",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "REDIRECT_HANDLER" */ "@/pages/RedirectHandler.vue"),
      meta: { title: "redirecting" },
    },
    {
      path: "/providerchange",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "PROVIDER_CHANGE" */ "@/pages/ProviderChange.vue"),
      meta: { title: "ProviderChange" },
    },
    {
      path: "/frame",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "FRAME" */ "@/pages/Frame.vue"),
      meta: { title: "Frame" },
    },
    {
      path: "/logout",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "LOGOUT" */ "@/pages/Logout.vue"),
      meta: { title: "Logout" },
    },
    {
      path: "/wallet/home",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "HOME" */ "@/pages/wallet/Home.vue"),
      meta: { title: "Home" },
    },
    {
      path: "/wallet/transfer",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "TRANSFER" */ "@/pages/wallet/Transfer.vue"),
      meta: { title: "Transfer" },
    },
    {
      path: "/wallet/topup",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "TOPUP" */ "@/pages/wallet/TopUp.vue"),
      meta: { title: "Top Up" },
    },
    {
      path: "/wallet/activity",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "ACTIVITY" */ "@/pages/wallet/Activity.vue"),
      meta: { title: "Activity" },
    },
    {
      path: "/wallet/settings",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "SETTINGS" */ "@/pages/wallet/Settings.vue"),
      meta: { title: "Settings" },
    },
  ],
});

router.beforeEach((to, _, next) => {
  document.title = to.meta.title ? `${to.meta.title} | ${PKG.app.name}` : PKG.app.name;
  next();
});

export default router;

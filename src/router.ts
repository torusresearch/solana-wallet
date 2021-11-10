import { createRouter, createWebHistory, RouteLocationNormalized, RouteRecordName } from "vue-router";

import { PKG } from "@/const";

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: [
    { path: "/", redirect: "/login" },
    {
      name: "login",
      path: "/login",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "LOGIN" */ "@/pages/Login.vue"),
      meta: { title: "Login" },
    },
    {
      name: "start",
      path: "/start",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "START" */ "@/pages/Start.vue"),
      meta: { title: "Start" },
    },
    {
      name: "end",
      path: "/end",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "END" */ "@/pages/End.vue"),
      meta: { title: "End" },
    },
    {
      name: "confirm",
      path: "/confirm",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "CONFIRM" */ "@/pages/Confirm.vue"),
      meta: { title: "Confirm" },
    },
    {
      name: "confirm_message",
      path: "/confirm_message",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "CONFIRM_MESSAGE" */ "@/pages/ConfirmMessage.vue"),
      meta: { title: "Sign Message" },
    },
    {
      name: "redirect",
      path: "/redirect",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "REDIRECT_HANDLER" */ "@/pages/RedirectHandler.vue"),
      meta: { title: "redirecting" },
    },
    {
      name: "providerchange",
      path: "/providerchange",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "PROVIDER_CHANGE" */ "@/pages/ProviderChange.vue"),
      meta: { title: "ProviderChange" },
    },
    {
      name: "frame",
      path: "/frame",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "FRAME" */ "@/pages/Frame.vue"),
      meta: { title: "Frame" },
    },
    {
      name: "logout",
      path: "/logout",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "LOGOUT" */ "@/pages/Logout.vue"),
      meta: { title: "Logout" },
    },
    {
      name: "walletHome",
      path: "/wallet/home",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "HOME" */ "@/pages/wallet/Home.vue"),
      meta: { title: "Home" },
    },
    {
      name: "walletTransfer",
      path: "/wallet/transfer",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "TRANSFER" */ "@/pages/wallet/Transfer.vue"),
      meta: { title: "Transfer" },
    },
    {
      name: "walletTopup",
      path: "/wallet/topup",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "TOPUP" */ "@/pages/wallet/topup/TopUp.vue"),
      meta: { title: "Top Up" },
      children: [
        {
          name: "rampNetwork",
          path: "ramp-network",
          component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "TOPUP-RAMP" */ "@/components/topup/gateways/RampTopup.vue"),
          meta: { title: "Topup - Ramp Network" },
        },
        { path: "*", redirect: { name: "rampNetwork" } },
      ],
    },
    {
      name: "walletActivity",
      path: "/wallet/activity",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "ACTIVITY" */ "@/pages/wallet/Activity.vue"),
      meta: { title: "Activity" },
    },
    {
      name: "walletSettings",
      path: "/wallet/settings",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "SETTINGS" */ "@/pages/wallet/Settings.vue"),
      meta: { title: "Settings" },
    },
  ],
});

function hasInstanceId(route: RouteLocationNormalized) {
  return Object.prototype.hasOwnProperty.call(route.query, "instanceId");
}

router.beforeResolve((toRoute: RouteLocationNormalized, fromRoute: RouteLocationNormalized, next) => {
  if ((toRoute.name as string)?.includes("login")) {
    return next();
  }
  if (!hasInstanceId(toRoute) && hasInstanceId(fromRoute)) {
    return next({ name: toRoute.name as RouteRecordName, query: fromRoute.query, hash: toRoute.hash, params: toRoute.params });
  }
  return next();
});

router.beforeEach((to, _, next) => {
  document.title = to.meta.title ? `${to.meta.title} | ${PKG.app.name}` : PKG.app.name;
  next();
});

export default router;

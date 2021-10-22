import { createRouter, createWebHistory, RouteLocationNormalized, RouteRecordName } from "vue-router";

import { PKG } from "@/const";

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: [
    { path: "/", component: () => import("@/pages/Login.vue"), meta: { title: "Login" } },
    {
      name: "login",
      path: "/login",
      component: () => import("@/pages/Login.vue"),
      meta: { title: "Login" },
    },
    {
      name: "start",
      path: "/start",
      component: () => import("@/pages/Start.vue"),
      meta: { title: "Start" },
    },
    {
      name: "end",
      path: "/end",
      component: () => import("@/pages/End.vue"),
      meta: { title: "End" },
    },
    {
      name: "confirm",
      path: "/confirm",
      component: () => import("@/pages/Confirm.vue"),
      meta: { title: "Confirm" },
    },
    {
      name: "confirm_message",
      path: "/confirm_message",
      component: () => import("@/pages/ConfirmMessage.vue"),
      meta: { title: "Sign Message" },
    },
    {
      name: "redirect",
      path: "/redirect",
      component: () => import("@/pages/RedirectHandler.vue"),
      meta: { title: "redirecting" },
    },
    {
      name: "providerchange",
      path: "/providerchange",
      component: () => import("@/pages/ProviderChange.vue"),
      meta: { title: "ProviderChange" },
    },
    {
      name: "frame",
      path: "/frame",
      component: () => import("@/pages/Frame.vue"),
      meta: { title: "Frame" },
    },
    {
      name: "logout",
      path: "/logout",
      component: () => import("@/pages/Logout.vue"),
      meta: { title: "Logout" },
    },
    {
      name: "walletHome",
      path: "/wallet/home",
      component: () => import("@/pages/wallet/Home.vue"),
      meta: { title: "Home" },
    },
    {
      name: "walletTransfer",
      path: "/wallet/transfer",
      component: () => import("@/pages/wallet/Transfer.vue"),
      meta: { title: "Transfer" },
    },
    {
      name: "walletTopup",
      path: "/wallet/topup",
      component: () => import("@/pages/wallet/TopUp.vue"),
      meta: { title: "Top Up" },
    },
    {
      name: "walletActivity",
      path: "/wallet/activity",
      component: () => import("@/pages/wallet/Activity.vue"),
      meta: { title: "Activity" },
    },
    {
      name: "walletSettings",
      path: "/wallet/settings",
      component: () => import("@/pages/wallet/Settings.vue"),
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

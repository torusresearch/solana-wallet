// import Nft from "@pages/wallet/Nft.vue";
// import NftPage from "@pages/wallet/NftDetail.vue";
import { createRouter, createWebHistory, RouteLocationNormalized, RouteRecordName } from "vue-router";

import { PKG } from "@/const";
import ControllerModule from "@/modules/controllers";
import Page404 from "@/pages/404.vue";
import Confirm from "@/pages/Confirm.vue";
import ConfirmNft from "@/pages/ConfirmNft.vue";
import ConfirmSpl from "@/pages/ConfirmSpl.vue";
import End from "@/pages/End.vue";
import Frame from "@/pages/Frame.vue";
import Login from "@/pages/Login.vue";
import Logout from "@/pages/Logout.vue";
import ProviderChange from "@/pages/ProviderChange.vue";
import RedirectFlow from "@/pages/RedirectFlowHandler.vue";
import RedirectUrl from "@/pages/RedirectHandler.vue";
import Start from "@/pages/Start.vue";
import Activity from "@/pages/wallet/Activity.vue";
import Base from "@/pages/wallet/Base.vue";
import Home from "@/pages/wallet/Home.vue";
import Settings from "@/pages/wallet/Settings.vue";
import TopupPage from "@/pages/wallet/TopUp.vue";
import Transfer from "@/pages/wallet/Transfer.vue";

// import { backendStatePromise } from "./utils/helpers";
import { getB64DecodedData, getRedirectConfig } from "./utils/redirectflow_helpers";

const enum AuthStates {
  AUTHENTICATED = "auth",
  NON_AUTHENTICATED = "un-auth",
}

export function isLoggedIn(): boolean {
  return !!ControllerModule?.torus?.selectedAddress;
}

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: "/wallet",
    },
    // UNAUTHENTICATED ROUTES
    {
      name: "login",
      path: "/login",
      component: Login, // import(/* webpackPrefetch: true */ /* webpackChunkName: "LOGIN" */ "@/pages/Login.vue"),
      meta: { title: "Login", auth: AuthStates.NON_AUTHENTICATED },
    },
    // AUTHENTICATED ROUTES
    {
      name: "walletBase",
      path: "/wallet",
      component: Base, // import(/* webpackPrefetch: true */ /* webpackChunkName: "WALLET" */ "@/pages/wallet/Base.vue"),
      meta: { title: "Solana Wallet", auth: AuthStates.AUTHENTICATED },
      redirect: "/wallet/home",
      children: [
        {
          name: "walletHome",
          path: "home",
          component: Home, // import(/* webpackPrefetch: true */ /* webpackChunkName: "HOME" */ "@/pages/wallet/Home.vue"),
          meta: { title: "Home", tab: "home", tabHeader: "false" },
        },
        {
          name: "walletTransfer",
          path: "transfer",
          component: Transfer, // () => import(/* webpackPrefetch: true */ /* webpackChunkName: "TRANSFER" */ "@/pages/wallet/Transfer.vue"),
          meta: { title: "Transfer", tab: "transfer" },
        },
        {
          name: "walletTopup",
          path: "topup",
          component: TopupPage, // () => import(/* webpackPrefetch: true */ /* webpackChunkName: "TOPUP" */ "@/pages/wallet/TopUp.vue"),
          meta: { title: "Top Up", tab: "topup" },
          children: [
            // {
            //   name: "rampNetwork",
            //   path: "ramp-network",
            //   component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "TOPUP-RAMP" */ "@/components/topup/gateways/RampTopup.vue"),
            //   meta: { title: "Topup - Ramp Network" },
            // },
            {
              name: "moonpay",
              path: "moonpay",
              component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "TOPUP-RAMP" */ "@/components/topup/gateways/Moonpay.vue"),
              meta: { title: "Topup - Moonpay" },
            },
            { path: "/:catchAll(.*)", redirect: { name: "moonpay" } },
          ],
          redirect: { name: "moonpay" },
        },
        {
          name: "walletActivity",
          path: "activity",
          component: Activity, // () => import(/* webpackPrefetch: true */ /* webpackChunkName: "ACTIVITY" */ "@/pages/wallet/Activity.vue"),
          meta: { title: "Activity", tab: "activity" },
        },
        {
          name: "walletSettings",
          path: "settings",
          component: Settings, // () => import(/* webpackPrefetch: true */ /* webpackChunkName: "SETTINGS" */ "@/pages/wallet/Settings.vue"),
          meta: { title: "Settings", tab: "settings" },
        },
        {
          name: "walletNfts",
          path: "nfts",
          component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "NFTS" */ "@/pages/wallet/NftDetail.vue"),
          meta: { title: "NFTs", tab: "nfts" },
        },
      ],
    },
    // AUTH STATE INDEPENDENT ROUTES
    {
      name: "walletNFT",
      path: "/wallet/nfts/:mint_address",
      component: () => import(/* webpackPrefetch: true */ /* webpackChunkName: "NFT" */ "@/pages/wallet/Nft.vue"),
      meta: { title: "NFT Details" },
    },
    {
      name: "logout",
      path: "/logout",
      component: Logout, // () => import(/* webpackPrefetch: true */ /* webpackChunkName: "LOGOUT" */ "@/pages/Logout.vue"),
      meta: { title: "Logout" },
    },
    {
      name: "start",
      path: "/start",
      component: Start, // () => import(/* webpackPrefetch: true */ /* webpackChunkName: "START" */ "@/pages/Start.vue"),
      meta: { title: "Start" },
    },
    {
      name: "end",
      path: "/end",
      component: End, // () => import(/* webpackPrefetch: true */ /* webpackChunkName: "END" */ "@/pages/End.vue"),
      meta: { title: "End" },
    },
    {
      name: "confirm",
      path: "/confirm",
      component: Confirm, // () => import(/* webpackPrefetch: true */ /* webpackChunkName: "CONFIRM" */ "@/pages/Confirm.vue"),
      meta: { title: "Confirm" },
    },
    {
      name: "confirm_nft",
      path: "/confirm_nft",
      component: ConfirmNft, // () => import(/* webpackPrefetch: true */ /* webpackChunkName: "CONFIRM_NFT" */ "@/pages/ConfirmNft.vue"),
      meta: { title: "Confirm Nft" },
    },
    {
      name: "confirm_spl",
      path: "/confirm_spl",
      component: ConfirmSpl, // () => import(/* webpackPrefetch: true */ /* webpackChunkName: "CONFIRM_SPL" */ "@/pages/ConfirmSpl.vue"),
      meta: { title: "Confirm Spl" },
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
      component: RedirectUrl, // () => import(/* webpackPrefetch: true */ /* webpackChunkName: "REDIRECT_HANDLER" */ "@/pages/RedirectHandler.vue"),
      meta: { title: "redirecting" },
    },
    {
      name: "redirectflow",
      path: "/redirectflow",
      component: RedirectFlow, // () => import(/* webpackPrefetch: true */ /* webpackChunkName: "REDIRECT_HANDLER" */ "@/pages/RedirectFlowHandler.vue"),
      meta: { title: "redirecting" },
      beforeEnter: (to: RouteLocationNormalized, from: RouteLocationNormalized, next) => {
        const { method = "" } = getB64DecodedData(to.hash);
        const resolveRoute = (to.query.resolveRoute as string) || "";
        const { redirectPath, requiresLogin, shouldRedirect } = getRedirectConfig(method);
        if (!resolveRoute || !method) return next({ name: "404", query: to.query, hash: to.hash });
        if (!ControllerModule.selectedAddress && requiresLogin)
          return next({
            name: "login",
            query: {
              redirectTo: shouldRedirect ? redirectPath : "/redirectflow",
              resolveRoute,
            },
            hash: to.hash,
          });
        if (shouldRedirect) return next(`${redirectPath}?resolveRoute=${resolveRoute}${to.hash}`);
        return next();
      },
    },
    {
      name: "providerchange",
      path: "/providerchange",
      component: ProviderChange, // () => import(/* webpackPrefetch: true */ /* webpackChunkName: "PROVIDER_CHANGE" */ "@/pages/ProviderChange.vue"),
      meta: { title: "ProviderChange" },
    },
    {
      name: "frame",
      path: "/frame",
      component: Frame, // () => import(/* webpackPrefetch: true */ /* webpackChunkName: "FRAME" */ "@/pages/Frame.vue"),
      meta: { title: "Frame" },
    },
    {
      name: "404",
      path: "/404",
      component: Page404, // () => import(/* webpackPrefetch: true */ /* webpackChunkName: "404" */ "@/pages/404.vue"),
      meta: { title: "404" },
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
    return next({
      name: toRoute.name as RouteRecordName,
      query: fromRoute.query,
      hash: toRoute.hash,
      params: toRoute.params,
    });
  }
  return next();
});

router.beforeEach(async (to, _, next) => {
  document.title = to.meta.title ? `${to.meta.title} | ${PKG.app.name}` : PKG.app.name;
  // const authMeta = to.meta.auth;
  const isRedirectFlow = !!(to.query.resolveRoute || to.query.method);
  // if (!["frame", "redirect", "start", "end"].includes(to.name?.toString() || "")) await backendStatePromise.promise;
  if (to.name === "404") return next(); // to prevent 404 redirecting to 404
  if (to.query.redirectTo) return next(); // if already redirecting, dont do anything
  if (isRedirectFlow && (!getB64DecodedData(to.hash).method || !to.query.resolveRoute)) return next({ name: "404", query: to.query, hash: to.hash });
  // if (authMeta === AuthStates.AUTHENTICATED && !isLoggedIn() && !isRedirectFlow) return next("/login");
  // if (authMeta === AuthStates.NON_AUTHENTICATED && isLoggedIn() && !isRedirectFlow) return next("/");
  return next();
});

export default router;

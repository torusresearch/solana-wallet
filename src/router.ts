// import log from "loglevel";
import { pageview } from "vue-gtag";
import { createRouter, createWebHistory, RouteLocationNormalized } from "vue-router";

import { beforeEachResolve, hasInstanceId, walletRoutes } from "./utils/router";

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: walletRoutes,
});

router.beforeResolve((toRoute: RouteLocationNormalized, fromRoute: RouteLocationNormalized) => {
  if ((toRoute.name as string)?.includes("login")) {
    return true;
  }
  if (!hasInstanceId(toRoute) && hasInstanceId(fromRoute)) {
    return { ...toRoute, ...{ query: fromRoute.query } };
  }
  return true;
});

router.beforeEach(async (to) => {
  const result = await beforeEachResolve(to);
  return result;
});

router.afterEach(() => {
  pageview({ page_title: document.title, page_path: window.location.href });
});
export default router;

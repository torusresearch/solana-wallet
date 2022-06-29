import { pageview } from "vue-gtag";
import { createRouter, createWebHistory, RouteLocationNormalized } from "vue-router";

import { beforeEachResolver, hasInstanceId, walletRoutes } from "@/utils/router";

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: walletRoutes,
});

// Instance Id query parameter passed to subsequent routes if present
router.beforeResolve((toRoute: RouteLocationNormalized, fromRoute: RouteLocationNormalized) => {
  if ((toRoute.name as string)?.includes("login")) {
    return true;
  }
  if (!hasInstanceId(toRoute) && hasInstanceId(fromRoute)) {
    return { ...toRoute, ...{ query: fromRoute.query } };
  }
  return true;
});

// Auth State flow, Redirection flow check and redirection
router.beforeEach(async (to) => {
  const result = await beforeEachResolver(to);
  return result;
});

// gtag
router.afterEach(() => {
  pageview({ page_title: document.title, page_path: window.location.href });
});
export default router;

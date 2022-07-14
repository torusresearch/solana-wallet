import { useRoute, useRouter } from "vue-router";

import ControllerModule from "../modules/controllers";
import { REDIRECT_FLOW_CONFIG } from "./enums";

export const getB64DecodedData = (hashString: string, defaultData?: unknown) => {
  let data;
  data = new URLSearchParams(hashString.slice(1)).get("redirectflowdata");
  if (data)
    try {
      data = JSON.parse(Buffer.from(data, "base64").toString());
    } catch (e) {
      data = defaultData || {};
    }
  else data = defaultData || {};
  return data;
};

export const getRedirectConfig = (method: string): { redirectPath: string; requiresLogin: boolean; shouldRedirect: boolean } => {
  const redirectConfig = REDIRECT_FLOW_CONFIG[method] || { redirectPath: "404", requiresLogin: false };
  return {
    redirectPath: redirectConfig.redirectPath,
    requiresLogin: redirectConfig.requiresLogin,
    shouldRedirect: redirectConfig.redirectPath !== "/",
  };
};

export const timeoutWindowClose = (): void => {
  setTimeout(window.close, 0);
};

export const redirectToResult = (jsonrpc: string, result: unknown, id: number, resolveRoute: string): void => {
  const jrpcObj = { jsonrpc, result, id };
  const res = Buffer.from(JSON.stringify(jrpcObj)).toString("base64");
  const decodedResolveRoute = decodeURIComponent(resolveRoute);
  if (!decodedResolveRoute) {
    if (window.opener === null) window.location.href = window.location.origin;
    else window.close();
  } else if (decodedResolveRoute.startsWith("http")) {
    window.location.href = `${decodedResolveRoute}#result=${res}`;
  } else {
    window.location.replace(`${decodedResolveRoute}#result=${res}`);
  }
};

export const useRedirectFlow = () => {
  const route = useRoute();

  const { params = {}, method = "", id = 1, jsonrpc = "2.0" } = getB64DecodedData(route.hash, route.params);
  const { resolveRoute } = route.query;
  const isRedirectFlow = !!resolveRoute || !!method; // since method and resolveRoute are always required

  return { params, method, req_id: id, jsonrpc, resolveRoute: resolveRoute as string, isRedirectFlow, query: route.query, hash: route.hash };
};

export async function evalRedirectflow() {
  const { params, method, resolveRoute, req_id, jsonrpc, query, hash } = useRedirectFlow();
  const router = useRouter();

  if (!resolveRoute || !method) return router.push({ name: "404", query, hash });

  const { redirectPath, requiresLogin, shouldRedirect } = getRedirectConfig(method);

  await ControllerModule.torus.restoreFromBackend();
  if (!ControllerModule.hasSelectedPrivateKey && requiresLogin) {
    return router.push({
      name: "login",
      query: {
        redirectTo: shouldRedirect ? redirectPath : "/redirectflow",
        resolveRoute,
      },
      hash,
    });
  }
  if (shouldRedirect) return router.push(`${redirectPath}?resolveRoute=${resolveRoute}${hash}`);

  const res = await ControllerModule.handleRedirectFlow({ method, params, resolveRoute });
  if (method !== "topup") redirectToResult(jsonrpc, { data: res, method, success: true }, req_id, resolveRoute);
  // syntax need return - temporary return string "void"
  return "void";
}

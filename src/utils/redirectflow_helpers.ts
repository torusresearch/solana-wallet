import { REDIRECT_FLOW_CONFIG } from "./enums";

export const getB64DecodedParams = (defaultParams?: unknown) => {
  let params;
  params = new URLSearchParams(window.location.hash.slice(1)).get("params");
  if (params)
    try {
      params = JSON.parse(Buffer.from(params, "base64").toString());
    } catch (e) {
      params = defaultParams || {};
    }
  else params = defaultParams || {};
  return params;
};

export const getRedirectConfig = (method: string): { redirectPath: string; requiresLogin: boolean; shouldRedirect: boolean } => {
  const { redirectPath = "/", requiresLogin = false } = method ? REDIRECT_FLOW_CONFIG[method] : {};
  return { redirectPath, requiresLogin, shouldRedirect: redirectPath !== "/" };
};

export const timeoutWindowClose = (): void => {
  setTimeout(window.close, 0);
};

export const redirectToResult = (method: string, result: unknown, resolveRoute: string, isComplete = true): void => {
  const res = Buffer.from(JSON.stringify(result)).toString("base64");
  if (!resolveRoute) {
    if (window.opener === null) window.location.href = window.location.origin;
    else window.close();
  } else if (resolveRoute.startsWith("http")) {
    window.location.href = `${resolveRoute}?method=${method}&isComplete=${isComplete}#result=${res}`;
  } else {
    window.location.replace(`${resolveRoute}?method=${method}&result=${res}&isComplete=${isComplete}`);
  }
};

export const useRedirectFlow = (defaultParams?: unknown) => {
  const params = getB64DecodedParams(defaultParams);
  const queryParameters = new URLSearchParams(window.location.search);
  const method = queryParameters.get("method") || "";
  const resolveRoute = queryParameters.get("resolveRoute") || "";
  const isRedirectFlow = !!resolveRoute || !!method; // since message and resolveRoute are always required
  return { params, method, resolveRoute, isRedirectFlow };
};

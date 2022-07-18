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
  const { redirectPath = "/", requiresLogin = false } = method ? REDIRECT_FLOW_CONFIG[method] : {};
  return { redirectPath, requiresLogin, shouldRedirect: redirectPath !== "/" };
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

export const useRedirectFlow = (defaultParams?: unknown) => {
  const { params = {}, method = "", id = 1, jsonrpc = "2.0" } = getB64DecodedData(window.location.hash, defaultParams);
  const queryParameters = new URLSearchParams(window.location.search);
  const resolveRoute = queryParameters.get("resolveRoute") || "";
  const isRedirectFlow = !!resolveRoute || !!method; // since method and resolveRoute are always required
  return { params, method, req_id: id, jsonrpc, resolveRoute, isRedirectFlow };
};

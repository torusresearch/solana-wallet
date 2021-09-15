import type { OpenloginUserInfo } from "@toruslabs/openlogin";

export const LOCAL_STORAGE_KEY = "localStorage";
export const SESSION_STORAGE_KEY = "sessionStorage";
export type STORAGE_TYPE = typeof LOCAL_STORAGE_KEY | typeof SESSION_STORAGE_KEY;

export type OpenLoginPopupResponse = {
  userInfo: OpenloginUserInfo;
  privKey: string;
};

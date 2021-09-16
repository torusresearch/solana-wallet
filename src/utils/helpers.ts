import config from "@/config";

import { STORAGE_TYPE } from "./enums";

export function getStorage(key: STORAGE_TYPE): Storage | undefined {
  if (config.isStorageAvailable[key]) return window[key];
  return undefined;
}

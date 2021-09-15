import { STORAGE_TYPE } from "./enums";

export function storageAvailable(type: STORAGE_TYPE): boolean {
  let storageExists = false;
  let storageLength = 0;
  let storage: Storage;
  try {
    storage = window[type];
    storageExists = true;
    storageLength = storage.length;
    const x = "__storage_test__";
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (error: unknown) {
    const localError = error as { code?: number; name?: string };
    return (
      !!error &&
      // everything except Firefox
      (localError.code === 22 ||
        // Firefox
        localError.code === 1014 ||
        // test name field too, because code might not be present
        // everything except Firefox
        localError.name === "QuotaExceededError" ||
        // Firefox
        localError.name === "NS_ERROR_DOM_QUOTA_REACHED") &&
      // acknowledge QuotaExceededError only if there's something already stored
      storageExists &&
      storageLength !== 0
    );
  }
}

import log from "loglevel";
import { Payload } from "vuex";

import config from "@/config";
import store from "@/store";
import { CONTROLLER_MODULE_KEY, KeyState, LOCAL_STORAGE_KEY, STORAGE_TYPE } from "@/utils/enums";
import { getStorage } from "@/utils/helpers";

import VuexPersistence, { ModulePersistOptions } from "./vuexPersist";

const persistInstance = new VuexPersistence();
log.info("installing persist plugin");
persistInstance.plugin(store);

export default function installStorePlugin({
  key,
  storage,
  saveState,
  restoreState,
  filter,
  moduleKey,
}: {
  key: string;
  storage?: STORAGE_TYPE;
  saveState?: (key2: string, state: Record<string, unknown>, storage2?: Storage) => void;
  restoreState?: (
    key2: string,
    storage2?: Storage
  ) => Promise<{
    [CONTROLLER_MODULE_KEY]: KeyState;
    state: unknown;
  }>;
  filter?: (mutation: Payload) => boolean;
  moduleKey?: string;
}): void {
  const finalStorage = storage || LOCAL_STORAGE_KEY;
  const finalModuleKey = moduleKey || key;
  const storageRef = getStorage(finalStorage);
  if (!storageRef) return;
  const pluginOptions: ModulePersistOptions = {
    key,
    storage: storageRef,
    moduleName: finalModuleKey,
  };
  if (saveState && restoreState) {
    pluginOptions.saveState = saveState;
    pluginOptions.restoreState = restoreState;
  }
  if (filter) {
    pluginOptions.filter = filter;
  }
  if (config.isStorageAvailable[finalStorage]) {
    persistInstance.addModule(pluginOptions);
  }
}

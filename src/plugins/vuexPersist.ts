/* eslint-disable class-methods-use-this */
import { merge } from "lodash-es";
import log from "loglevel";
import { MutationPayload, Payload, Plugin, Store } from "vuex";

import { CONTROLLER_MODULE_KEY, KeyState } from "@/utils/enums";

const defaultRestoreStateFn = async (): Promise<{
  [CONTROLLER_MODULE_KEY]: KeyState;
  state: unknown;
}> =>
  Promise.resolve({
    [CONTROLLER_MODULE_KEY]: {
      priv_key: "",
    },
    state: {},
  });

const defaultFilterFn = () => true;

// eslint-disable-next-line @typescript-eslint/no-empty-function
const defaultSaveStateFn = () => {};

const defaultReducerFn = (state: unknown, moduleKey: string): Partial<KeyState> => {
  return { [moduleKey]: state as Record<string, unknown> } as Partial<KeyState>;
};

export interface ModulePersistOptions {
  /**
   * Window.Storage type object.
   */
  storage: Storage;

  /**
   * Method to retrieve state from persistence
   * @param key -
   * @param storage -
   */
  restoreState?: (
    key: string,
    storage: Storage
  ) => Promise<{
    [CONTROLLER_MODULE_KEY]: KeyState;
    state: unknown;
  }>;

  /**
   * Method to save state into persistence
   * @param key -
   * @param state -
   * @param storage -
   */
  saveState?: (key: string, state: Record<string, unknown>, storage: Storage) => void;

  /**
   * Function to reduce state to the object you want to save.
   * Be default, we save the entire state.
   * You can use this if you want to save only a portion of it.
   * @param state -
   */
  reducer?: (state: unknown, moduleKey: string) => Partial<unknown>;

  /**
   * Key to use to save the state into the storage
   */
  key: string;

  /**
   * Method to filter which mutations will trigger state saving
   * Be default returns true for all mutations.
   * Check mutations using <code>mutation.type</code>
   * @param mutation - object of type {@link Payload}
   */
  filter?: (mutation: Payload) => boolean;

  moduleName: string;
}

export interface VuexPersistModules {
  [moduleName: string]: ModulePersistOptions;
}

export default class VuexPersistence<S> {
  public modules: VuexPersistModules;

  public subscribed: boolean;

  // Maintain a reference to store
  public store: Store<S> | null;

  public constructor() {
    this.subscribed = false;
    this.modules = {};
    this.store = null;
  }

  public async addModule(options: ModulePersistOptions): Promise<void> {
    const moduleOptions = { ...options };
    if (!this.store) throw new Error("Install the plugin first");
    if (this.modules[moduleOptions.moduleName]) throw new Error("Module already installed");
    log.info("registering module", moduleOptions.moduleName);
    const { key } = moduleOptions;
    const { storage } = moduleOptions;
    moduleOptions.restoreState = moduleOptions.restoreState || defaultRestoreStateFn;
    moduleOptions.saveState = moduleOptions.saveState || defaultSaveStateFn;
    moduleOptions.filter = moduleOptions.filter || defaultFilterFn;
    moduleOptions.reducer = moduleOptions.reducer || defaultReducerFn;
    // register this module
    this.modules[moduleOptions.moduleName] = moduleOptions;

    const savedState = (await moduleOptions.restoreState(key, storage)).state;
    log.info("Add Module, restoring state = ", savedState);
    this.store.replaceState(merge(this.store.state, savedState || {}) as S);
  }

  /**
   * The plugin function that can be used inside a vuex store.
   */
  plugin: Plugin<S> = (store: Store<S>) => {
    if (this.store) throw new Error("Plugin is singleton and already installed in store");
    this.store = store;
    this.subscriber(store)((mutation: MutationPayload, state: S) => {
      // get the module for mutation
      // check if it's in approved modules list
      // reduce the state to only include the module of the mutation
      const moduleName = mutation.type.split("/")[0];
      const currentModule = this.modules[moduleName];
      if (!currentModule || !currentModule.filter || !currentModule.reducer || !currentModule.saveState) return;

      if (currentModule.filter(mutation)) {
        const reducedState = currentModule.reducer(state, moduleName);
        currentModule.saveState(currentModule.key, reducedState, currentModule.storage);
      }
    });

    this.subscribed = true;
  };

  /**
   * Creates a subscriber on the store. automatically is used
   * when this is used a vuex plugin. Not for manual usage.
   * @param store -
   */
  private subscriber = (store: Store<S>) => (handler: (mutation: MutationPayload, state: S) => unknown) => store.subscribe(handler);
}

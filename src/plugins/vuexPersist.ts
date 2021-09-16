import { merge } from "lodash";
import log from "loglevel";
import { MutationPayload, Payload, Plugin, Store } from "vuex";

export interface ModulePersistOptions<S> {
  /**
   * Window.Storage type object.
   */
  storage: Storage;

  /**
   * Method to retrieve state from persistence
   * @param key
   * @param [storage]
   */
  restoreState?: (key: string, storage: Storage) => S;

  /**
   * Method to save state into persistence
   * @param key
   * @param state
   * @param [storage]
   */
  saveState?: (key: string, state: Record<string, unknown>, storage: Storage) => void;

  /**
   * Function to reduce state to the object you want to save.
   * Be default, we save the entire state.
   * You can use this if you want to save only a portion of it.
   * @param state
   */
  reducer?: (state: S, moduleKey: string) => Partial<S>;

  /**
   * Key to use to save the state into the storage
   */
  key: string;

  /**
   * Method to filter which mutations will trigger state saving
   * Be default returns true for all mutations.
   * Check mutations using <code>mutation.type</code>
   * @param mutation object of type {@link Payload}
   */
  filter?: (mutation: Payload) => boolean;

  moduleName: string;
}

export interface VuexPersistModules<S> {
  [moduleName: string]: ModulePersistOptions<S>;
}

export default class VuexPersistence<S> {
  public modules: VuexPersistModules<S>;
  public subscribed: boolean;
  // Maintain a reference to store
  public store: Store<S> | null;

  public constructor() {
    this.subscribed = false;
    this.modules = {};
    this.store = null;
  }

  public addModule(moduleOptions: ModulePersistOptions<S>): void {
    if (!this.store) throw new Error("Install the plugin first");
    if (this.modules[moduleOptions.moduleName]) throw new Error("Module already installed");
    log.info("registering module", moduleOptions.moduleName);
    const key = moduleOptions.key;
    const storage = moduleOptions.storage;
    moduleOptions.restoreState = moduleOptions.restoreState || defaultRestoreStateFn;
    moduleOptions.filter = moduleOptions.filter || defaultFilterFn;
    moduleOptions.saveState = moduleOptions.saveState || defaultSaveStateFn;
    moduleOptions.reducer = moduleOptions.reducer || defaultReducerFn;
    // register this module
    this.modules[moduleOptions.moduleName] = moduleOptions;

    const savedState = moduleOptions.restoreState(key, storage) as S;
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
   * @param store
   */
  private subscriber = (store: Store<S>) => (handler: (mutation: MutationPayload, state: S) => unknown) => store.subscribe(handler);
}

const defaultRestoreStateFn = (key: string, storage: Storage) => {
  const value = storage.getItem(key);
  if (typeof value === "string") {
    // If string, parse, or else, just return
    return JSON.parse(value || "{}");
  } else {
    return value || {};
  }
};

const defaultFilterFn = () => true;

const defaultSaveStateFn = (key: string, state: Record<string, unknown>, storage: Storage) =>
  storage.setItem(
    key, // Second argument is state _object_ if localforage, stringified otherwise
    JSON.stringify(state)
  );

const defaultReducerFn = <S>(state: unknown, moduleKey: string): Partial<S> => {
  return { [moduleKey]: (state as Record<string, unknown>)[moduleKey] } as Partial<S>;
};

// Reference - https://github.com/xanf/vuex-shared-mutations/blob/master/src/vuexSharedMutations.js

import { BroadcastChannel } from "broadcast-channel";
import cloneDeep from "lodash-es/cloneDeep";
import merge from "lodash-es/merge";
import omit from "lodash-es/omit";
import log from "loglevel";
import { Store } from "vuex";

// eslint-disable-next-line import/no-cycle
import { VuexState } from "@/store";
import { CONTROLLER_MODULE_KEY } from "@/utils/enums";

export default () => {
  let sharingInProgress = false;
  const BC = new BroadcastChannel("TABS_SYNC_STORE");
  return (store: Store<VuexState>) => {
    store.subscribe((_mutation, state) => {
      if (sharingInProgress) return;
      const requiredState = cloneDeep(omit(state, [`${CONTROLLER_MODULE_KEY}.torus`]));
      log.info("Send: SyncState", requiredState);
      BC.postMessage(requiredState);
    });

    BC.addEventListener("message", (state: VuexState) => {
      try {
        sharingInProgress = true;
        log.info("Receive: SyncState", state);
        store.replaceState(merge(store.state, state));
      } finally {
        sharingInProgress = false;
      }
    });
  };
};

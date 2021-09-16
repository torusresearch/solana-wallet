import { computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";

import ControllerModule from "./controllers";

export function requireLoggedIn(): void {
  const router = useRouter();
  onMounted(() => {
    const address = ControllerModule.torusState.PreferencesControllerState.selectedAddress;
    if (!address) router.push("/login");
  });

  const currentAddress = computed(() => ControllerModule.torusState.PreferencesControllerState.selectedAddress);

  // TODO: check if prefsController fucks up
  watch(currentAddress, (newAddr, oldAddr) => {
    if (newAddr !== oldAddr && !newAddr) {
      // This means user logged out
      router.push("/login");
    }
  });
}

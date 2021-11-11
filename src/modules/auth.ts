import { computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";

import ControllerModule from "./controllers";

export function requireLoggedIn(): void {
  const router = useRouter();
  onMounted(() => {
    if (!ControllerModule.torus.selectedAddress) router.push("/login");
  });

  const currentAddress = computed(() => ControllerModule.torus.selectedAddress);

  // TODO: check if prefsController fucks up
  watch(currentAddress, (newAddr, oldAddr) => {
    if (newAddr !== oldAddr && !newAddr) {
      // This means user logged out
      router.push("/login");
    }
  });
}

import { computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";

import OpenLoginFactory from "@/auth/OpenLogin";

import ControllerModule from "./controllers";

export function requireLoggedIn(): void {
  const router = useRouter();
  onMounted(async () => {
    if (!ControllerModule.selectedAddress) router.push("/login");
    const openLoginHandler = await OpenLoginFactory.getInstance(true);
    const { sessionId } = openLoginHandler;
    if (!sessionId) {
      ControllerModule.logout();
      router.push("/login");
    }
  });

  const currentAddress = computed(() => ControllerModule.selectedAddress);

  watch(currentAddress, (newAddr, oldAddr) => {
    if (newAddr !== oldAddr && !newAddr) {
      // This means user logged out
      router.push("/login");
    }
  });
}

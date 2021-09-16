<script setup lang="ts">
import log from "loglevel";
import { useRoute } from "vue-router";

import OpenLoginFactory from "../auth/OpenLogin";

async function startLogin() {
  try {
    const query = useRoute().query;
    const { loginProvider, state, ...rest } = query;
    if (!loginProvider) throw new Error("Invalid Login Provider");
    const openLoginInstance = await OpenLoginFactory.getInstance();
    await openLoginInstance.login({
      loginProvider: loginProvider as string,
      appState: state as string,
      extraLoginOptions: rest,
      relogin: true,
    });
  } catch (error) {
    log.error(error);
  }
}

startLogin();
</script>

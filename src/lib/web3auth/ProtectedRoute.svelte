<script lang="ts">
  import { browser } from "$app/env";
  import { session, page } from "$app/stores";
  import { getContext } from "svelte";
  import {
    WEB3AUTH_CONTEXT_CLIENT_PROMISE,
    login,
    isAuthenticated,
  } from "./Web3Auth.svelte";
  import type { Web3AuthContextClientPromise } from "../types";
  import { isTokenExpired } from "./jwt";

  const loadUser = async () => {
    if (browser) {
      const web3authPromise: Web3AuthContextClientPromise = getContext(
        WEB3AUTH_CONTEXT_CLIENT_PROMISE
      );
      let doLogin = false;
      // const web3authParamsFn = await web3authPromise;
      // const web3AuthParams = web3authParamsFn($page.path, $page.params);
      if (!$session?.user || !$session?.accessToken) {
        doLogin = true;
      } else {
        const expired = isTokenExpired($session.accessToken);
        if (expired) {
          doLogin = true;
        }
      }

      if (doLogin) {
        try {
          await login(web3authPromise);
        } catch (e) {
          console.error(
            `Error while attempting to load user for ProtectedRoute: ${e}`
          );
        }
      }
    }
  };
</script>

{#await loadUser()}
  <p>Loading...</p>
{:then}
  {#if $isAuthenticated}
    <slot />
  {:else}
    404
  {/if}
{/await}

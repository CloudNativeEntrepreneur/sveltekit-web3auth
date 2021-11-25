<script lang="ts">
  import { browser } from "$app/env";
  import { session, page } from "$app/stores";
  import { getContext } from "svelte";
  import { WEB3AUTH_CONTEXT_CLIENT_PROMISE, login } from "./Web3Auth.svelte";
  import type { Web3AuthContextClientPromise } from "../types";
  import { isTokenExpired } from "./jwt";

  let isAuthenticated = false;

  const loadUser = async () => {
    if (browser) {
      const web3AuthPromise: Web3AuthContextClientPromise = getContext(
        WEB3AUTH_CONTEXT_CLIENT_PROMISE
      );
      const web3Auth_func = await web3AuthPromise;
      const web3Params = web3Auth_func($page.path, $page.params);
      if (!$session?.user || !$session?.accessToken) {
        try {
          console.log("user or access token is missing", $session);
          await login(web3AuthPromise);
        } catch (e) {
          console.error(e);
        }
      } else {
        if (isTokenExpired($session.accessToken)) {
          console.log("access token is expired", $session);
          await login(web3AuthPromise);
        }
        isAuthenticated = true;
      }
    }
  };
</script>

{#await loadUser()}
  <p>Loading...</p>
{:then}
  {#if isAuthenticated}
    <slot />
  {:else}
    404
  {/if}
{/await}

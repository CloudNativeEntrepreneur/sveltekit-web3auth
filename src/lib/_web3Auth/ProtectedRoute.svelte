<script lang="ts">
  import { browser } from "$app/env";
  import { session, page } from "$app/stores";
  import { getContext } from "svelte";
  import { WEB3AUTH_CONTEXT_CLIENT_PROMISE } from "./Web3Auth.svelte";
  import type { Web3AuthContextClientPromise } from "../types";
  import { isTokenExpired } from "./jwt";

  let isAuthenticated = false;

  const loadUser = async () => {
    if (browser) {
      const web3AuthPromise: Web3AuthContextClientPromise = getContext(
        WEB3AUTH_CONTEXT_CLIENT_PROMISE
      );
      const web3Auth_func = await web3AuthPromise;
      const { redirect } = web3Auth_func($page.path, $page.params);
      if (!$session?.user || !$session?.access_token || !$session?.user) {
        try {
          console.log(redirect);
          // window.location.assign(redirect);
          console.log("AUTH HERE");
        } catch (e) {
          console.error(e);
        }
      } else {
        if (isTokenExpired($session.access_token)) {
          console.log(redirect);
          // window.location.assign(redirect);
          console.log("AUTH HERE");
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
  {/if}
{/await}

<script lang="ts">
  import { getContext } from "svelte";
  import {
    WEB3AUTH_CONTEXT_CLIENT_PROMISE,
    WEB3AUTH_CONTEXT_POST_LOGOUT_REDIRECT_URI,
    logout,
  } from "./Web3Auth.svelte";
  import type { Web3AuthContextClientPromise } from "../types";

  const web3authPromise: Web3AuthContextClientPromise = getContext(
    WEB3AUTH_CONTEXT_CLIENT_PROMISE
  );
  const postLogoutRedirectURI: string = getContext(
    WEB3AUTH_CONTEXT_POST_LOGOUT_REDIRECT_URI
  );

  let clazz = "btn btn-primary";
  export { clazz as class };
</script>

<button
  class={clazz}
  on:click|preventDefault={() => logout(web3authPromise, postLogoutRedirectURI)}
>
  <slot />
</button>

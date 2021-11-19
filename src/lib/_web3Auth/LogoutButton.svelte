<script lang="ts">
  import { getContext } from "svelte";
  import {
    WEB3AUTH_CONTEXT_CLIENT_PROMISE,
    WEB3AUTH_CONTEXT_POST_LOGOUT_REDIRECT_URI,
    logout,
  } from "./Web3Auth.svelte";
  import type { Web3AuthContextClientPromise } from "../types";

  const web3AuthPromise: Web3AuthContextClientPromise = getContext(
    WEB3AUTH_CONTEXT_CLIENT_PROMISE
  );
  const post_logout_redirect_uri: string = getContext(
    WEB3AUTH_CONTEXT_POST_LOGOUT_REDIRECT_URI
  );

  let clazz: string = "btn btn-primary";
  export { clazz as class };
</script>

<button
  class={clazz}
  on:click|preventDefault={() =>
    logout(web3AuthPromise, post_logout_redirect_uri)}
>
  <slot />
</button>

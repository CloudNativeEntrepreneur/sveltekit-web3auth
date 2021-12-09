<script lang="ts">
  import { getContext } from "svelte";
  import {
    WEB3AUTH_CONTEXT_CLIENT_PROMISE,
    refreshToken,
    tokenRefresh,
  } from "./Web3Auth.svelte";
  import type { Web3AuthContextClientPromise } from "../types";

  const web3authPromise: Web3AuthContextClientPromise = getContext(
    WEB3AUTH_CONTEXT_CLIENT_PROMISE
  );

  let clazz = "btn btn-primary";
  export { clazz as class };
</script>

<button
  class={clazz}
  on:click|preventDefault={() => tokenRefresh(web3authPromise, $refreshToken, 'refresh button')}
>
  <slot />
</button>

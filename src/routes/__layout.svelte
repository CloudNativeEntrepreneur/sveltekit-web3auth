<script lang="ts">
  import "../app.postcss";
  import { Web3Auth } from "$lib";
  import { config } from "../config";
  import Header from "../components/shared/Header/index.svelte";
</script>

<Header />
<Web3Auth
  issuer={config.web3auth.issuer}
  clientId={config.web3auth.clientId}
  postLogoutRedirectURI={config.web3auth.postLogoutRedirectUri}
>
  <slot />
</Web3Auth>

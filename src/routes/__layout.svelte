<script lang="ts">
  import "../app.postcss";
  import { Web3Auth } from "$lib";
  import Header from "../components/shared/Header/index.svelte";
</script>

<Header />
<Web3Auth
  issuer={import.meta.env.VITE_WEB3AUTH_ISSUER}
  clientId={import.meta.env.VITE_WEB3AUTH_CLIENT_ID}
  postLogoutRedirectURI={import.meta.env.VITE_WEB3AUTH_POST_LOGOUT_REDIRECT_URI}
>
  <slot />
</Web3Auth>

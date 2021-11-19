<script lang="ts">
  import "../app.postcss";
  import { Web3Auth } from "$lib";
  import Header from "../components/shared/Header/index.svelte";
</script>

<Header />
<Web3Auth
  issuer={import.meta.env.VITE_WEB3_AUTH_ISSUER}
  clientId={import.meta.env.VITE_WEB3_AUTH_CLIENT_ID}
  scope={import.meta.env.VITE_WEB3_AUTH_CLIENT_SCOPE}
  redirectURI={import.meta.env.VITE_WEB3_AUTH_REDIRECT_URI}
  postLogoutRedirectURI={import.meta.env
    .VITE_WEB3_AUTH_POST_LOGOUT_REDIRECT_URI}
  refreshTokenEndpoint={import.meta.env.VITE_WEB3_AUTH_REFRESH_TOKEN_ENDPOINT}
  refreshPageOnSessionTimeout={import.meta.env
    .VITE_WEB3_AUTH_REFRESH_PAGE_ON_SESSION_TIMEOUT}
>
  <slot />
</Web3Auth>

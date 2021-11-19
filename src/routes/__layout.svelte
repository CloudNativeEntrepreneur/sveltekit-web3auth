<script lang="ts">
  import "../app.postcss";
  import { Web3Auth } from "$lib";
  import Header from "../components/shared/Header/index.svelte";
</script>

<Header />
<Web3Auth
  issuer={import.meta.env.VITE_WEB3_AUTH_ISSUER}
  client_id={import.meta.env.VITE_WEB3_AUTH_CLIENT_ID}
  scope={import.meta.env.VITE_WEB3_AUTH_CLIENT_SCOPE}
  redirect_uri={import.meta.env.VITE_WEB3_AUTH_REDIRECT_URI}
  post_logout_redirect_uri={import.meta.env.VITE_WEB3_AUTH_POST_LOGOUT_REDIRECT_URI}
  refresh_token_endpoint={import.meta.env.VITE_WEB3_AUTH_REFRESH_TOKEN_ENDPOINT}
  refresh_page_on_session_timeout={import.meta.env
    .VITE_WEB3_AUTH_REFRESH_PAGE_ON_SESSION_TIMEOUT}
>
  <slot />
</Web3Auth>

# sveltekit + web3auth

This project aims to integrate web3auth via MetaMask with a JWT Issuing auth server from a confidential client for use with APIs in Sveltekit. Once login is complete, Navigation to protected pages of app don't require a request to Authorization Server. Sveltekit hooks take care of :

    [x] Silent Refresh Workflow
    [x] Validating the client accessToken validity
    [x] Renewing the token in case of token expiry
    [x] Offline Auth server error handling
    [x] Setting valid user information ( accessToken, refreshToken, userid etc. ) in form of cookies
    [x] Populating session variable with user information

When the client side kicks in, it:

    [x] Checks for user and Auth server information in session variable
    [x] In case, no user is found or some error has occured on server-side, populate AuthStore with proper messages
    [x] Provides Login, Logout functionality
    [x] Initiates authorization flow, in case of protected component via Sveletkit Load method.
    [x] Logout in one browser tab initiates automatic logout from all tabs.
    [x] Prompt on all browser tabs and Page reloading on User Login.

Goal is complete JWT Implementation based on [Hasura Blog on BEST Practices for JWT AUTH](https://hasura.io/blog/best-practices-of-using-jwt-with-graphql/) in context of meta mask login and challenge/signature auth flow.

More useful reading:

- https://github.com/vnovick/graphql-jwt-tutorial/
- https://www.toptal.com/ethereum/one-click-login-flows-a-metamask-tutorial
- https://github.com/amaurym/login-with-metamask-demo

### Npm Package link

https://www.npmjs.com/package/sveltekit-web3auth

# Usage

## Template

The easiest way to get started is with the template: https://github.com/CloudNativeEntrepreneur/sveltekit-web3auth-template

## Installation

<code>
    npm i sveltekit-web3auth --save-dev
</code>

## Server

You can use this server: [CloudNativeEntrepreneur/web3-auth-service](https://github.com/CloudNativeEntrepreneur/web3-auth-service)

## Configuration

Create an .env file in project root with following content

```ts
VITE_WEB3_AUTH_ISSUER="http://localhost:8000"
VITE_WEB3_AUTH_CLIENT_ID="local-public"
VITE_WEB3_AUTH_CLIENT_SECRET="1439e34f-343e-4f71-bbc7-cc602dced84a"
// VITE_WEB3_AUTH_POST_LOGOUT_REDIRECT_URI="http://localhost:3000" // optional, just set to enable
VITE_WEB3_AUTH_TOKEN_REFRESH_MAX_RETRIES="5"
VITE_GRAPHQL_URL=http://hasura.default.127.0.0.1.sslip.io/v1/graphql
VITE_GRAPHQL_INTERNAL_URL=http://hasura.default.127.0.0.1.sslip.io/v1/graphql
VITE_GRAPHQL_WS_URL=ws://hasura.default.127.0.0.1.sslip.io/v1/graphql
```

### Inside your src/global.d.ts

```ts
interface ImportMetaEnv {
  VITE_WEB3AUTH_ISSUER: string;
  VITE_WEB3AUTH_CLIENT_ID: string;
  VITE_WEB3AUTH_CLIENT_SECRET: string;
  VITE_WEB3AUTH_POST_LOGOUT_REDIRECT_URI?: string;
  VITE_WEB3AUTH_TOKEN_REFRESH_MAX_RETRIES: number;
  VITE_GRAPHQL_URL: string;
  VITE_GRAPHQL_INTERNAL_URL: string;
  VITE_GRAPHQL_WS_URL: string;
}
```

## Auth Endpoints

SvelteKit only includes the `$lib` folder in published packages, so you'll need to set up the needed routes to support the confidential authentication flow in your own project.

From [the source repo of sveltekit-web3auth](https://github.com/CloudNativeEntrepreneur/sveltekit-web3auth), copy the `src/routes/auth` folder into your own SvelteKit project. Also copy the `src/config` folder, the `src/hooks.ts` file, and `src/routes/__layout.svelte` into the same spots in your own project.

Replace imports of `$lib` with `sveltekit-web3auth`.

You may also optionally copy in the `routes/graphql` and `routes/profile`

Feel free to customize them after this point.

### Use these stores for auth information

```html
<script lang="ts">
  import {
    isAuthenticated,
    isLoading,
    authError,
    accessToken,
    idToken,
    userInfo,
    refreshToken,
    LoginButton,
  } from "sveltekit-web3auth";
</script>

{#if $isAuthenticated}
<div>User is authenticated</div>
{:else}
<LoginButton class="btn btn-primary">Login</LoginButton>
{/if}
<div></div>
```

### For protected routes

```html
<script lang="ts">
  import { ProtectedRoute, LogoutButton } from "sveltekit-web3auth";
</script>

<ProtectedRoute>
  <div
    class="h-screen-minus-navbar bg-gray-800 text-white flex flex-col justify-center items-center w-full"
  >
    This is a protected page

    <LogoutButton class="btn btn-primary">Logout</LogoutButton>
  </div>
</ProtectedRoute>
```

# Application Screenshots

### Login / Index page

![Login Page](https://github.com/CloudNativeEntrepreneur/sveltekit-web3auth/blob/main/docs/web3auth/1.png?raw=true)

### Once user clicks login, Redirection to Auth server

![Metamask Auth](https://github.com/CloudNativeEntrepreneur/sveltekit-web3auth/blob/main/docs/web3auth/2.png?raw=true)

### Auth Complete - client hydrated with accessToken

![Index page with JWT](https://github.com/CloudNativeEntrepreneur/sveltekit-web3auth/blob/main/docs/web3auth/3.png?raw=true)

### Protected Page and Session variables with user info

![Index page with JWT](https://github.com/CloudNativeEntrepreneur/sveltekit-web3auth/blob/main/docs/web3auth/4.png?raw=true)

## Developing

Once you've created a project and installed dependencies with `npm ci`, start a development server:

```bash
npm run dev
```

## Building

When building for production, sveltekit will use `.env.production` values.

In production mode it's important to build with a blank `VITE_WEB3AUTH_CLIENT_SECRET` so it is not accessible on the client side. Instead, `WEB3AUTH_CLIENT_SECRET` will be accessible to the process at runtime during a run of a production build.

```bash
npm run build
```

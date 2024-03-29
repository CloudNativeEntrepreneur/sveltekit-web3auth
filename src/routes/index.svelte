<script lang="ts">
  import {
    isAuthenticated,
    isLoading,
    authError,
    accessToken,
    LoginButton,
    LogoutButton,
    RefreshTokenButton,
  } from "$lib";
  import debug from "debug";

  const log = debug("sveltekit-web3auth:routes/index");

  let accessTokenElement;
  let isAccessTokenCopied = false;
  function copyAccessTokenToClipboard() {
    if (accessTokenElement) {
      try {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(accessTokenElement);
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand("copy");
        selection.removeAllRanges();
        isAccessTokenCopied = true;
        setTimeout(() => {
          isAccessTokenCopied = false;
        }, 1000);
      } catch (e) {
        log(accessTokenElement);
        console.error(e);
      }
    }
  }
</script>

<main
  class="h-screen-minus-navbar w-screen flex flex-col justify-center items-center bg-gray-800"
>
  <h1
    class="mb-4 p-4 text-5xl bg-pink-600 text-gray-200 font-semibold rounded-md shadow-md"
  >
    Sveltekit + web3auth
  </h1>

  {#if $isAuthenticated}
    <section
      class="p-5 bg-green-100 text-center flex flex-col justify-start items-center shadow-lg rounded-lg"
    >
      <div><span class="font-bold text-gray-800">Access Token</span></div>
      <div class="flex flex-row justify-end items-start w-100">
        <p
          access-token
          class="break-words w-100 max-w-5xl m-2 border-none overflow-visible font-mono text-gray-600"
          bind:this={accessTokenElement}
        >
          {$accessToken}
        </p>
        <div class="flex flex-col justify-start items-center w-100">
          <button
            class="btn btn-primary"
            on:click|preventDefault={copyAccessTokenToClipboard}>Copy</button
          >
          {#if isAccessTokenCopied}
            <div class="bg-gray-800 text-green-300 rounded-md p-2 text-xs">
              Copied!
            </div>
          {/if}
        </div>
      </div>
      <LogoutButton class="btn btn-primary">Logout</LogoutButton>
      <RefreshTokenButton class="btn btn-primary"
        >Refresh Tokens</RefreshTokenButton
      >
    </section>
  {:else if $authError}
    <section class="p-5 rounded-lg bg-red-400">
      {$authError?.errorDescription}
    </section>
  {:else if $isLoading}
    <section
      class="px-10 py-5 h-20 shadow-md rounded-lg bg-pink-400 text-white font-mono font-semibold flex flex-row justify-center items-center"
    >
      Loading ...
    </section>
  {:else}
    <section
      class="px-10 py-5 shadow-md rounded-lg bg-pink-400 text-white font-mono font-semibold flex flex-col justify-center items-center"
    >
      <p class="block p-2">NO AUTH AVAILABLE</p>
      <LoginButton class="btn btn-primary">Login</LoginButton>
    </section>
  {/if}
</main>

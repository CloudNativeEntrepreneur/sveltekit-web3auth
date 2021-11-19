<script context="module" lang="ts">
  import { setContext } from "svelte";
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/env";
  import { page, session } from "$app/stores";
  import type {
    Web3AuthContextClientFn,
    Web3AuthContextClientPromise,
  } from "../types";
  import { handleAuthenticate, handleSignup } from "./api";
  import { handleSignMessage } from "./metamask";

  console.log("Web3Auth module loading");
  // TODO: this LS key is temporary - at least it's current value, and likely how it's used
  const LS_KEY = "login-with-metamask:auth";

  let web3;
  // let web3: Web3 | undefined = undefined; // Will hold the web3 instance

  export const WEB3AUTH_CONTEXT_CLIENT_PROMISE = {};
  export const WEB3AUTH_CONTEXT_REDIRECT_URI: string = "";
  export const WEB3AUTH_CONTEXT_POST_LOGOUT_REDIRECT_URI: string = "";

  import { writable } from "svelte/store";
  /**
   * Stores
   */
  export const isLoading = writable(true);
  export const isAuthenticated = writable(false);
  export const accessToken = writable("");
  export const idToken = writable("");
  export const refreshToken = writable("");
  export const userInfo = writable({});
  export const authError = writable(null);

  const AuthStore = {
    isLoading,
    isAuthenticated,
    accessToken,
    idToken,
    refreshToken,
    userInfo,
    authError,
  };

  const handleLoggedIn = (publicAddress: string, session) => (auth: any) => {
    localStorage.removeItem("user_logout");
    localStorage.setItem("user_login", JSON.stringify(auth));
    localStorage.setItem(LS_KEY, JSON.stringify(auth));
    AuthStore.isAuthenticated.set(true);
    AuthStore.accessToken.set(auth.accessToken);
    AuthStore.userInfo.set({
      publicAddress,
    });
    console.log("You bastard. You're in");
    console.log(auth);
  };

  async function metaMaskLogin({ issuer, session }) {
    console.log("Web3Auth:metaMaskLogin");
    if (!(window as any).ethereum) {
      window.alert("Please install MetaMask first.");
      return;
    }

    if (!web3) {
      try {
        // Request account access if needed
        await (window as any).ethereum.enable();

        // We don't know window.web3 version, so we use our own instance of Web3
        // with the injected provider given by MetaMask
        web3 = new (window as any).Web3((window as any).ethereum);
      } catch (error) {
        console.error(error);
        window.alert("You need to allow MetaMask.");
        return;
      }
    }

    const coinbase = await web3.eth.getCoinbase();
    if (!coinbase) {
      window.alert("Please activate MetaMask first.");
      return;
    }

    const publicAddress = coinbase.toLowerCase();

    // Look if user with current publicAddress is already present on backend
    console.log("Finding user with address", publicAddress);

    fetch(`${issuer}/api/users?publicAddress=${publicAddress}`)
      .then((response) => response.json())
      // If yes, retrieve it. If no, create it.
      .then((users) =>
        users.length ? users[0] : handleSignup(issuer)(publicAddress)
      )
      // Popup MetaMask confirmation modal to sign message
      .then(handleSignMessage(web3))
      // Send signature to backend on the /auth route
      .then(handleAuthenticate(issuer))
      // Pass accessToken back to parent component (to save it in localStorage)
      .then(handleLoggedIn(publicAddress, session))
      .catch((err) => {
        window.alert(err);
      });
  }

  export async function login(web3AuthPromise: Web3AuthContextClientPromise) {
    console.log("Web3Auth:login");
    try {
      const web3Auth_func = await web3AuthPromise;
      const { session, issuer, page } = web3Auth_func();
      console.log(session, issuer, page);

      if (session?.auth_server_online === false) {
        const testAuthServerResponse = await fetch(issuer, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!testAuthServerResponse.ok) {
          throw {
            error: await testAuthServerResponse.json(),
          };
        }
      } else {
        AuthStore.isLoading.set(true);

        const relogin_initiate_error_list = [
          "missing_jwt",
          "invalid_grant",
          "invalid_token",
          "token_refresh_error",
        ];
        const relogin_initiate = session?.error?.error
          ? relogin_initiate_error_list.includes(session.error.error)
          : false;

        if (!session?.user && (!session?.error || relogin_initiate)) {
          AuthStore.isAuthenticated.set(false);
          AuthStore.accessToken.set(null);
          AuthStore.refreshToken.set(null);

          await metaMaskLogin({ issuer, session });
        } else if (session?.error) {
          AuthStore.isAuthenticated.set(false);
          AuthStore.accessToken.set(null);
          AuthStore.refreshToken.set(null);
          AuthStore.authError.set(session.error);
          AuthStore.isLoading.set(false);
        } else {
          AuthStore.isLoading.set(false);
          AuthStore.isAuthenticated.set(true);
          AuthStore.accessToken.set(session.access_token);
          AuthStore.refreshToken.set(session.refresh_token);
          AuthStore.authError.set(null);
          if (window.location.toString().includes("code=")) {
            window.location.assign(page.path);
          }
        }
      }
    } catch (e) {
      console.error(e);
      AuthStore.isLoading.set(false);
      AuthStore.isAuthenticated.set(false);
      AuthStore.accessToken.set(null);
      AuthStore.refreshToken.set(null);
      AuthStore.authError.set({
        error: "auth_server_conn_error",
        error_description: "Auth Server Connection Error",
      });
    }
  }

  export async function logout(
    web3AuthPromise: Web3AuthContextClientPromise,
    postLogoutRedirectURI?: string
  ) {
    console.log("Web3Auth:logout");
    const web3Auth_func = await web3AuthPromise;
    const web3Params = web3Auth_func();
    // TODO: potential improvement - notify auth server to end session

    window.localStorage.removeItem(LS_KEY);
    // trigger logout in other tabs
    window.localStorage.removeItem("user_login");
    AuthStore.accessToken.set(null);
    AuthStore.refreshToken.set(null);
    AuthStore.isAuthenticated.set(false);
    AuthStore.isLoading.set(false);
    window.localStorage.setItem("user_logout", "true");

    if (postLogoutRedirectURI) {
      console.log("post_logout_redirect", postLogoutRedirectURI);
      window.location.assign(postLogoutRedirectURI);
    } else {
      console.log("no post logout redirect configured");
    }
  }
</script>

<script lang="ts">
  // props.
  export let issuer: string;
  export let clientId: string;
  export let redirectURI: string;
  export let postLogoutRedirectURI: string;
  export let scope: string;
  export let refreshTokenEndpoint: string;
  export let refreshPageOnSessionTimeout: boolean = false;

  const web3Auth_func: Web3AuthContextClientFn = () => {
    return {
      session: $session,
      issuer,
      page: $page,
      clientId,
    };
  };

  const web3_auth_promise: Web3AuthContextClientPromise =
    Promise.resolve(web3Auth_func);

  setContext(WEB3AUTH_CONTEXT_CLIENT_PROMISE, web3_auth_promise);
  setContext(WEB3AUTH_CONTEXT_REDIRECT_URI, redirectURI);
  setContext(WEB3AUTH_CONTEXT_POST_LOGOUT_REDIRECT_URI, postLogoutRedirectURI);

  let tokenTimeoutObj = null;
  export async function silentRefresh(oldRefreshToken: string) {
    console.log("Web3Auth:silentRefresh");
    try {
      const reqBody = `refresh_token=${oldRefreshToken}`;
      const res = await fetch(refreshTokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: reqBody,
      });

      if (res.ok) {
        const resData = await res.json();

        if (resData.error) {
          throw {
            error: "token_refresh_error",
            error_description: "Unable to Refresh token",
          };
        }

        const { access_token, refresh_token } = resData;

        AuthStore.accessToken.set(access_token);
        AuthStore.refreshToken.set(refresh_token);

        const jwtData = JSON.parse(atob(access_token.split(".")[1]).toString());
        const tokenSkew = 10; // 10 seconds before actual token expiry
        const skewedTimeoutDuration =
          jwtData.exp * 1000 - tokenSkew * 1000 - new Date().getTime();
        const timeoutDuration =
          skewedTimeoutDuration > 0
            ? skewedTimeoutDuration
            : skewedTimeoutDuration + tokenSkew * 1000;

        if (tokenTimeoutObj) {
          clearTimeout(tokenTimeoutObj);
        }

        if (timeoutDuration > 0) {
          tokenTimeoutObj = setTimeout(async () => {
            await silentRefresh(refresh_token);
          }, timeoutDuration);
        } else {
          throw {
            error: "invalid_grant",
            error_description: "Session not active",
          };
        }
      }
    } catch (e) {
      if (tokenTimeoutObj) {
        clearTimeout(tokenTimeoutObj);
      }
      AuthStore.accessToken.set(null);
      AuthStore.refreshToken.set(null);
      AuthStore.isAuthenticated.set(false);
      AuthStore.authError.set({
        error: e?.error,
        error_description: e?.error_description,
      });
      if (refreshPageOnSessionTimeout) {
        window.location.assign($page.path);
      }
    }
  }

  const syncLogout = (event: StorageEvent) => {
    if (browser) {
      if (event.key === "user_logout") {
        console.log("Web3Auth:syncLogout");
        try {
          if (JSON.parse(window.localStorage.getItem("user_logout"))) {
            window.localStorage.removeItem("user_login");

            AuthStore.accessToken.set(null);
            AuthStore.refreshToken.set(null);
            AuthStore.isAuthenticated.set(false);
            AuthStore.authError.set({
              error: "invalid_grant",
              error_description: "Session is not active",
            });
            if (refreshPageOnSessionTimeout) {
              console.log("refresh page on session timeout");
              window.location.assign($page.path);
            }
          }
        } catch (e) {}
      }
    }
  };

  const syncLogin = (event: StorageEvent) => {
    console.log("syncLogin - storage changed");
    if (browser) {
      if (event.key === "user_login") {
        console.log("Web3Auth:syncLogin");
        try {
          window.localStorage.removeItem("user_logout");
          const userInfo = JSON.parse(
            window.localStorage.getItem("user_login")
          );
          if (
            userInfo &&
            (!$session.user ||
              $session.user?.preferred_username !==
                userInfo?.preferred_username)
          ) {
            const answer = confirm(
              `Welcome ${userInfo?.preferred_username || "user"}. Refresh page!`
            );
            if (answer) {
              window.location.assign($page.path);
            }
          }
        } catch (e) {}
      }
    }
  };

  async function handleMount() {
    console.log("Web3Auth:handleMount");
    try {
      console.log("Web3Auth:handleMount - adding event listeners");
      window.addEventListener("storage", syncLogout);
      window.addEventListener("storage", syncLogin);
    } catch (e) {}

    try {
      if ($session?.auth_server_online === false) {
        console.log("Web3Auth:handleMount - testing Server", issuer);
        const testAuthServerResponse = await fetch(issuer, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!testAuthServerResponse.ok) {
          throw {
            error: await testAuthServerResponse.json(),
          };
        }
      } else {
        console.log("Web3Auth:handleMount - loaded");
        AuthStore.isLoading.set(false);
        if (!$session.user) {
          AuthStore.isAuthenticated.set(false);
          AuthStore.accessToken.set(null);
          AuthStore.refreshToken.set(null);
          if (window.location.toString().includes("event=logout")) {
            window.location.assign($page.path);
          }
        } else {
          AuthStore.isAuthenticated.set(true);
          AuthStore.accessToken.set($session.access_token);
          AuthStore.refreshToken.set($session.refresh_token);
          const jwtData = JSON.parse(
            atob($session.access_token.split(".")[1]).toString()
          );
          const tokenSkew = 10; // 10 seconds before actual token expiry
          const skewedTimeoutDuration =
            jwtData.exp * 1000 - tokenSkew * 1000 - new Date().getTime();
          const timeoutDuration =
            skewedTimeoutDuration > 0
              ? skewedTimeoutDuration
              : skewedTimeoutDuration + tokenSkew * 1000;
          tokenTimeoutObj = setTimeout(async () => {
            await silentRefresh($session.refresh_token);
          }, timeoutDuration);
          AuthStore.authError.set(null);
          if (window.location.toString().includes("code=")) {
            window.location.assign($page.path);
          }

          try {
            window.localStorage.setItem(
              "user_login",
              JSON.stringify($session.user)
            );
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error("Web3Auth:handleMount - error");
      console.error(e);
      AuthStore.isLoading.set(false);
      AuthStore.isAuthenticated.set(false);
      AuthStore.accessToken.set(null);
      AuthStore.refreshToken.set(null);
      AuthStore.authError.set({
        error: "auth_server_conn_error",
        error_description: "Auth Server Connection Error",
      });
      if (window.location.toString().includes("event=logout")) {
        window.location.assign($page.path);
      }
    }
  }
  onMount(handleMount);

  onDestroy(() => {
    if (tokenTimeoutObj) {
      clearTimeout(tokenTimeoutObj);
    }
    try {
      window.removeEventListener("storage", syncLogout);
      window.removeEventListener("storage", syncLogin);
    } catch (e) {}
  });
</script>

<slot />

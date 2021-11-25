<script context="module" lang="ts">
  import { setContext } from "svelte";
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/env";
  import { page, session } from "$app/stores";
  import type {
    Web3AuthContextClientFn,
    Web3AuthContextClientPromise,
  } from "../types";
  import { handleAuthenticate, handleSignup } from "./routes-api";
  import { handleSignMessage } from "./metamask";

  let web3;

  export const WEB3AUTH_CONTEXT_CLIENT_PROMISE = {};
  export const WEB3AUTH_CONTEXT_REDIRECT_URI = "";
  export const WEB3AUTH_CONTEXT_POST_LOGOUT_REDIRECT_URI = "";

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

  const handleLoggedIn = (publicAddress: string) => (auth: any) => {
    const user = JSON.parse(atob(auth.idToken.split(".")[1]).toString());
    delete user.aud;
    delete user.exp;
    delete user.iat;
    delete user.iss;
    delete user.sub;
    delete user.typ;

    localStorage.removeItem("user_logout");
    localStorage.setItem("user_login", JSON.stringify(user));
    AuthStore.isAuthenticated.set(true);
    AuthStore.accessToken.set(auth.accessToken);
    AuthStore.refreshToken.set(auth.refreshToken);
    AuthStore.userInfo.set({
      ...user,
    });
    session.set({
      userid: publicAddress,
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      user,
      authServerOnline: true,
    });
  };

  async function metaMaskLogin({ clientId }) {
    try {
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

      let user;
      let users;
      const usersWithPublicAddressResponse = await fetch(`/auth/users`, {
        body: JSON.stringify({
          publicAddress,
          clientId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (usersWithPublicAddressResponse.ok) {
        users = await usersWithPublicAddressResponse.json();
      }

      if (users.length) {
        user = users[0];
      } else {
        user = await handleSignup(clientId)(publicAddress);
      }

      const signedMessage = await handleSignMessage(web3)(user);
      const authResponse = await handleAuthenticate(clientId)(signedMessage);

      await handleLoggedIn(publicAddress)(authResponse);
    } catch (err) {
      window.alert(err);
    }
  }

  export async function login(web3authPromise: Web3AuthContextClientPromise) {
    try {
      const web3auth_func = await web3authPromise;
      const { session, issuer, page, clientId } = web3auth_func();

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

          await metaMaskLogin({ clientId });
        } else if (session?.error) {
          AuthStore.isAuthenticated.set(false);
          AuthStore.accessToken.set(null);
          AuthStore.refreshToken.set(null);
          AuthStore.authError.set(session.error);
          AuthStore.isLoading.set(false);
        } else {
          AuthStore.isLoading.set(false);
          AuthStore.isAuthenticated.set(true);
          AuthStore.accessToken.set(session.accessToken);
          AuthStore.refreshToken.set(session.refreshToken);
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
    web3authPromise: Web3AuthContextClientPromise,
    postLogoutRedirectURI?: string
  ) {
    console.log("Web3Auth:logout");
    const web3auth_func = await web3authPromise;
    const { clientId } = web3auth_func();

    // trigger logout in other tabs
    window.localStorage.removeItem("user_login");
    AuthStore.accessToken.set(null);
    AuthStore.refreshToken.set(null);
    AuthStore.isAuthenticated.set(false);
    AuthStore.isLoading.set(false);
    session.set({
      authServerOnline: true,
    });
    window.localStorage.setItem("user_logout", "true");

    try {
      let result = await fetch("/auth/logout", {
        body: JSON.stringify({
          clientId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      let json = await result.json();

      console.log("Log out", json);
    } catch (err) {
      console.error("Error logging out", err);
    }

    if (postLogoutRedirectURI) {
      console.log("post_logout_redirect", postLogoutRedirectURI);
      window.location.assign(postLogoutRedirectURI);
    } else {
      console.log("no post logout redirect configured");
    }
  }

  export const tokenRefresh = async (
    web3authPromise: Web3AuthContextClientPromise,
    refreshTokenToExchange
  ) => {
    const web3auth_func = await web3authPromise;
    const { clientId } = web3auth_func();
    try {
      const res = await fetch("/auth/refresh-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          refreshToken: refreshTokenToExchange,
        }),
      });

      if (res.ok) {
        const resData = await res.json();

        if (resData.error) {
          throw {
            error: "token_refresh_error",
            error_description: "Unable to Refresh token",
          };
        }

        const { accessToken, refreshToken } = resData;

        AuthStore.accessToken.set(accessToken);
        AuthStore.refreshToken.set(refreshToken);

        return { accessToken, refreshToken };
      }
    } catch (e) {
      AuthStore.accessToken.set(null);
      AuthStore.refreshToken.set(null);
      AuthStore.isAuthenticated.set(false);
      AuthStore.authError.set({
        error: e?.error,
        error_description: e?.error_description,
      });
    }
  };
</script>

<script lang="ts">
  // props.
  export let issuer: string;
  export let clientId: string;
  export let redirectURI: string;
  export let postLogoutRedirectURI: string;
  export let scope: string;
  export let refreshTokenEndpoint: string;
  export let refreshPageOnSessionTimeout = false;

  const web3auth_func: Web3AuthContextClientFn = () => {
    return {
      session: $session,
      issuer,
      page: $page,
      clientId,
    };
  };

  const web3_auth_promise: Web3AuthContextClientPromise =
    Promise.resolve(web3auth_func);

  setContext(WEB3AUTH_CONTEXT_CLIENT_PROMISE, web3_auth_promise);
  setContext(WEB3AUTH_CONTEXT_REDIRECT_URI, redirectURI);
  setContext(WEB3AUTH_CONTEXT_POST_LOGOUT_REDIRECT_URI, postLogoutRedirectURI);

  let tokenTimeoutObj = null;
  async function silentRefresh(refreshTokenToExchange: string) {
    console.log("Web3Auth:silentRefresh");
    try {
      const { accessToken, refreshToken } = await tokenRefresh(
        web3_auth_promise,
        refreshTokenToExchange
      );

      const jwtData = JSON.parse(atob(accessToken.split(".")[1]).toString());
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
          await silentRefresh(refreshToken);
        }, timeoutDuration);
      } else {
        throw {
          error: "invalid_grant",
          error_description: "Session not active",
        };
      }
    } catch (e) {
      if (tokenTimeoutObj) {
        clearTimeout(tokenTimeoutObj);
      }
      if (refreshPageOnSessionTimeout) {
        window.location.assign($page.path);
      }
    }
  }

  const syncLogout = (event: StorageEvent) => {
    if (browser) {
      if (event.key === "user_logout") {
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
        } catch (err) {
          console.error("Sync logout error", err);
        }
      }
    }
  };

  const syncLogin = (event: StorageEvent) => {
    if (browser) {
      if (event.key === "user_login") {
        try {
          window.localStorage.removeItem("user_logout");
          const userInfo = JSON.parse(
            window.localStorage.getItem("user_login")
          );
          if (
            userInfo &&
            (!$session.user || $session.user?.username !== userInfo?.username)
          ) {
            const answer = confirm(
              `Welcome ${userInfo?.username || "user"}. Refresh page!`
            );
            if (answer) {
              window.location.assign($page.path);
            }
          }
        } catch (err) {
          console.error("Sync login error", err);
        }
      }
    }
  };

  async function handleMount() {
    if (browser) {
      try {
        window.addEventListener("storage", syncLogout);
        window.addEventListener("storage", syncLogin);
      } catch (err) {
        console.error("Error adding storage event handlers", err);
      }
    }

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
          // if (window.location.toString().includes("event=logout")) {
          //   window.location.assign($page.path);
          // }
        } else {
          AuthStore.isAuthenticated.set(true);
          AuthStore.accessToken.set($session.accessToken);
          AuthStore.refreshToken.set($session.refreshToken);
          const jwtData = JSON.parse(
            atob($session.accessToken.split(".")[1]).toString()
          );
          const tokenSkew = 10; // 10 seconds before actual token expiry
          const skewedTimeoutDuration =
            jwtData.exp * 1000 - tokenSkew * 1000 - new Date().getTime();
          const timeoutDuration =
            skewedTimeoutDuration > 0
              ? skewedTimeoutDuration
              : skewedTimeoutDuration + tokenSkew * 1000;
          tokenTimeoutObj = setTimeout(async () => {
            await silentRefresh($session.refreshToken);
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
          } catch (e) {
            console.error("Error setting local storage 'user_login'");
          }
        }
      }
    } catch (e) {
      console.error("Web3Auth:handleMount - error", e);
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
  onMount(handleMount);

  onDestroy(() => {
    if (tokenTimeoutObj) {
      clearTimeout(tokenTimeoutObj);
    }
    if (browser) {
      try {
        window.removeEventListener("storage", syncLogout);
        window.removeEventListener("storage", syncLogin);
      } catch (err) {
        console.error("Error removing storage event listeners", err);
      }
    }
  });
</script>

<slot />
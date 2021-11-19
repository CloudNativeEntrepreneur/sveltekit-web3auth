export {
  default as Web3Auth,
  // @ts-ignore
  isLoading,
  // @ts-ignore
  isAuthenticated,
  // @ts-ignore
  accessToken,
  // @ts-ignore
  idToken,
  // @ts-ignore
  refreshToken,
  // @ts-ignore
  userInfo,
  // @ts-ignore
  authError,
} from "./_web3Auth/Web3Auth.svelte";
export { default as LoginButton } from "./_web3Auth/LoginButton.svelte"
export { default as LogoutButton } from "./_web3Auth/LogoutButton.svelte";
export { default as ProtectedRoute } from "./_web3Auth/ProtectedRoute.svelte";
export {
  web3AuthBaseUrl,
  clientId,
  isTokenExpired,
  initiateBackChannelWeb3Auth,
  initiateBackChannelWeb3AuthLogout,
  renewWeb3AuthToken,
  introspectWeb3AuthToken,
  populateRequestLocals,
  populateResponseHeaders,
  injectCookies,
  parseUser,
  userDetailsGenerator,
  getUserSession,
} from "./_web3Auth/utils";

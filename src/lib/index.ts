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
} from "./web3auth/Web3Auth.svelte";
export { default as LoginButton } from "./web3auth/LoginButton.svelte";
export { default as LogoutButton } from "./web3auth/LogoutButton.svelte";
export { default as RefreshTokenButton } from "./web3auth/RefreshTokenButton.svelte";
export { default as ProtectedRoute } from "./web3auth/ProtectedRoute.svelte";
export {
  renewWeb3AuthToken,
  createAuthSession,
  endAuthSession,
  getUsers,
  registerUser,
} from "./web3auth/auth-api";
export { userDetailsGenerator, getUserSession } from "./web3auth/hooks";
export { parseCookie } from "./web3auth/cookie";
export { getServerOnlyEnvVar } from "./getServerOnlyEnvVar";
export { post as getUsersPostHandler } from "./web3auth/routes/auth/users/index";
export { post as registerUserPostHandler } from "./web3auth/routes/auth/users/register";
export { post as loginPostHandler } from "./web3auth/routes/auth/login";
export { post as logoutPostHandler } from "./web3auth/routes/auth/logout";
export { post as refreshTokenPostHandler } from "./web3auth/routes/auth/refresh-token";

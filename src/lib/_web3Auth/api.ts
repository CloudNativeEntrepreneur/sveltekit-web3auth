import type { Web3AuthFailureResponse, Web3AuthResponse } from "../types";
import { isTokenExpired } from "./jwt";

export const handleAuthenticate =
  (issuer) =>
  ({
    publicAddress,
    signature,
  }: {
    publicAddress: string;
    signature: string;
  }) =>
    fetch(`${issuer}/auth/auth`, {
      body: JSON.stringify({ publicAddress, signature }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    }).then((response) => response.json());

export const handleSignup = (issuer: string) => (publicAddress: string) =>
  fetch(`${issuer}/auth/users`, {
    body: JSON.stringify({ publicAddress }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  }).then((response) => response.json());

export async function renewWeb3AuthToken(
  refreshToken: string,
  web3AuthBaseUrl: string,
  clientId: string,
  clientSecret: string
): Promise<Web3AuthResponse> {
  if (!refreshToken) {
    const error_data: Web3AuthResponse = {
      error: "invalid_grant",
      error_description: "Invalid tokens",
      accessToken: null,
      refreshToken: null,
      idToken: null,
    };
    return error_data;
  }

  const data: Web3AuthResponse = {
    accessToken: refreshToken,
    refreshToken: refreshToken,
    idToken: refreshToken,
    error: null,
    error_description: null,
  };

  return data;

  // const res = await fetch(`${web3AuthBaseUrl}/token`, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     refreshToken: refreshToken
  //   }),
  // });

  // if (res.ok) {
  //   const newToken = await res.json();
  //   const data: Web3AuthResponse = {
  //     ...newToken,
  //     refreshToken: isTokenExpired(refreshToken)
  //       ? newToken.refreshToken
  //       : refreshToken,
  //   };
  //   return data;
  // } else {
  //   const data: Web3AuthResponse = await res.json();
  //   console.log("renew response not ok");
  //   console.log(data);
  //   return data;
  // }
}

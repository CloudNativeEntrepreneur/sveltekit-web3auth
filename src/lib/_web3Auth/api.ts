import type { Web3AuthFailureResponse, Web3AuthResponse } from "../types";
import { isTokenExpired } from "./jwt";

// TODO: Basic auth with clientId/secret
export const handleAuthenticate =
  (clientId) =>
  ({
    publicAddress,
    signature,
  }: {
    publicAddress: string;
    signature: string;
  }) =>
    fetch(`/auth/login`, {
      body: JSON.stringify({ clientId, publicAddress, signature }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    }).then((response) => response.json());

// TODO: Basic auth with clientId/secret
export const handleSignup = (clientId: string) => (publicAddress: string) =>
  fetch(`/auth/users/register`, {
    body: JSON.stringify({ publicAddress, clientId }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  }).then((response) => response.json());

export async function renewWeb3AuthToken(
  refreshToken: string,
  issuer: string,
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

  const Authorization = `Basic ${btoa(`${clientId}:${clientSecret}`)}`
  const res = await fetch(`${issuer}/api/auth/token`, {
    method: "POST",
    headers: {
      Authorization,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (res.ok) {
    const newTokens = await res.json();
    const data: Web3AuthResponse = {
      ...newTokens,
    };
    return data;
  } else {
    const data: Web3AuthResponse = await res.json();
    console.log("renew response not ok");
    console.log(data);
    return data;
  }
}

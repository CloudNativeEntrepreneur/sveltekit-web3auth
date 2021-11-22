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
  issuer: string,
  clientId: string,
  clientSecret: string
): Promise<Web3AuthResponse> {

  console.log('web3Auth:api:renewWeb3AuthToken')

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

  // const data: Web3AuthResponse = {
  //   accessToken: refreshToken,
  //   refreshToken: refreshToken,
  //   idToken: refreshToken,
  //   error: null,
  //   error_description: null,
  // };

  // return data;

  const res = await fetch(`${issuer}/auth/auth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  console.log('web3Auth:api:renewWeb3AuthToken - res', res)

  if (res.ok) {
    const newTokens = await res.json();
    console.log(newTokens)
    const data: Web3AuthResponse = {
      ...newTokens
    };
    return data;
  } else {
    const data: Web3AuthResponse = await res.json();
    console.log("renew response not ok");
    console.log(data);
    return data;
  }
}

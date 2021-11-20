import type { Web3AuthFailureResponse, Web3AuthResponse } from "../types";

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
  refresh_token: string,
  web3AuthBaseUrl: string,
  clientId: string,
  clientSecret: string
): Promise<Web3AuthResponse> {
  // let formBody = [
  //   "refresh_token=" + refresh_token,
  //   "client_id=" + clientId,
  //   "client_secret=" + clientSecret,
  //   "grant_type=refresh_token",
  // ];

  if (!refresh_token) {
    const error_data: Web3AuthResponse = {
      error: "invalid_grant",
      error_description: "Invalid tokens",
      access_token: null,
      refresh_token: null,
      id_token: null,
    };
    return error_data;
  }

  const data: Web3AuthResponse = {
    access_token: refresh_token,
    refresh_token: refresh_token,
    id_token: refresh_token,
    error: null,
    error_description: null,
  };

  return data;

  // const res = await fetch(`${web3AuthBaseUrl}/token`, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/x-www-form-urlencoded",
  //   },
  //   body: formBody.join("&"),
  // });

  // if (res.ok) {
  //   const newToken = await res.json();
  //   const data: Web3AuthResponse = {
  //     ...newToken,
  //     refresh_token: isTokenExpired(refresh_token)
  //       ? newToken.refresh_token
  //       : refresh_token,
  //   };
  //   return data;
  // } else {
  //   const data: Web3AuthResponse = await res.json();
  //   console.log("renew response not ok");
  //   console.log(data);
  //   return data;
  // }
}

export async function introspectWeb3AuthToken(
  access_token: string,
  web3AuthBaseUrl: string,
  clientId: string,
  clientSecret: string,
  username: string
): Promise<any> {
  let formBody = [
    "token=" + access_token,
    "client_id=" + clientId,
    "client_secret=" + clientSecret,
    "username=" + username,
  ];

  if (!access_token) {
    const error_data: Web3AuthResponse = {
      error: "invalid_grant",
      error_description: "Invalid tokens",
      access_token: null,
      refresh_token: null,
      id_token: null,
    };
    return error_data;
  }

  const res = await fetch(`${web3AuthBaseUrl}/token/introspect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody.join("&"),
  });

  if (res.ok) {
    const tokenIntrospect = await res.json();
    return tokenIntrospect;
  } else {
    const data: Web3AuthResponse = await res.json();
    console.log("introspect response not ok");
    console.log(data);
    return data;
  }
}

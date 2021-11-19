import type { Web3AuthFailureResponse, Web3AuthResponse } from "../types";
import { isTokenExpired } from "./jwt";

export async function initiateBackChannelWeb3Auth(
  authCode: string,
  clientId: string,
  clientSecret: string,
  web3AuthBaseUrl: string,
  appRedirectUrl: string
): Promise<Web3AuthResponse> {
  let formBody = [
    "code=" + authCode,
    "client_id=" + clientId,
    "client_secret=" + clientSecret,
    "grant_type=authorization_code",
    "redirect_uri=" + encodeURIComponent(appRedirectUrl),
  ];

  if (!authCode) {
    const error_data: Web3AuthResponse = {
      error: "invalid_code",
      error_description: "Invalid code",
      access_token: null,
      refresh_token: null,
      id_token: null,
    };
    return error_data;
  }

  const res = await fetch(`${web3AuthBaseUrl}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody.join("&"),
  });

  if (res.ok) {
    const data: Web3AuthResponse = await res.json();
    return data;
  } else {
    const data: Web3AuthResponse = await res.json();
    console.log("response not ok");
    console.log(data);
    console.log(formBody.join("&"));
    return data;
  }
}

export async function initiateBackChannelWeb3AuthLogout(
  access_token: string,
  clientId: string,
  clientSecret: string,
  web3AuthBaseUrl: string,
  refresh_token: string
): Promise<Web3AuthFailureResponse> {
  let formBody = [
    "client_id=" + clientId,
    "client_secret=" + clientSecret,
    "refresh_token=" + refresh_token,
  ];

  if (!access_token || !refresh_token) {
    const error_data = {
      error: "invalid_grant",
      error_description: "Invalid tokens",
    };
    return error_data;
  }

  const res = await fetch(`${web3AuthBaseUrl}/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${access_token}`,
    },
    body: formBody.join("&"),
  });

  if (res.ok) {
    return {
      error: null,
      error_description: null,
    };
  } else {
    const error_data: Web3AuthResponse = await res.json();
    console.log("logout response not ok");
    console.log(error_data);
    console.log(formBody.join("&"));
    return error_data;
  }
}

export const handleAuthenticate =
(issuer) =>
({
  publicAddress,
  signature,
}: {
  publicAddress: string;
  signature: string;
}) =>
  fetch(`${issuer}/api/auth`, {
    body: JSON.stringify({ publicAddress, signature }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  }).then((response) => response.json());

export const handleSignup = (issuer: string) => (publicAddress: string) =>
    fetch(`${issuer}/api/users`, {
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
  let formBody = [
    "refresh_token=" + refresh_token,
    "client_id=" + clientId,
    "client_secret=" + clientSecret,
    "grant_type=refresh_token",
  ];

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

  const res = await fetch(`${web3AuthBaseUrl}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody.join("&"),
  });

  if (res.ok) {
    const newToken = await res.json();
    const data: Web3AuthResponse = {
      ...newToken,
      refresh_token: isTokenExpired(refresh_token)
        ? newToken.refresh_token
        : refresh_token,
    };
    return data;
  } else {
    const data: Web3AuthResponse = await res.json();
    console.log("renew response not ok");
    console.log(data);
    return data;
  }
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

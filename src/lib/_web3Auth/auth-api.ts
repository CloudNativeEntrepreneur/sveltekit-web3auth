import type { Web3AuthResponse } from "../types";

// Auth Server API Calls

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

  const Authorization = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
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
    console.error("renew response not ok", data);
    return data;
  }
}

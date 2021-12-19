import type { Web3AuthResponse } from "../types";
import debug from 'debug'

const log = debug('sveltekit-web3auth:lib/web3auth/auth-api')

// Auth Server API Calls

export async function createAuthSession(
  issuer: string,
  clientId: string,
  clientSecret: string,
  address: string,
  signature: string
): Promise<Web3AuthResponse> {
  let auth;
  const Authorization = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
  const createAuthSessionFetch = await fetch(`${issuer}/api/auth`, {
    body: JSON.stringify({ address, signature }),
    headers: {
      Authorization,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (createAuthSessionFetch.ok) {
    auth = await createAuthSessionFetch.json();
    const data: Web3AuthResponse = {
      ...auth,
    };
    return data;
  }
}

export async function endAuthSession(options: {
  issuer: string;
  clientId: string;
  clientSecret: string;
  address: string;
}): Promise<Web3AuthResponse> {
  const { issuer, clientId, clientSecret, address } = options;

  let auth;
  const Authorization = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;

  const logoutRequest = await fetch(`${issuer}/api/auth/logout`, {
    body: JSON.stringify({ address }),
    headers: {
      Authorization,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (logoutRequest.ok) {
    auth = await logoutRequest.json();
    const data = {
      ...auth,
    };
    return data;
  }
}

export async function getUsers(
  issuer: string,
  clientId: string,
  clientSecret: string,
  address: string
): Promise<any> {
  const Authorization = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;

  const fetchResult = await fetch(`${issuer}/api/users?address=${address}`, {
    headers: {
      Authorization,
    },
    method: "GET",
  });

  if (fetchResult.ok) {
    const users = await fetchResult.json();
    return users;
  }
}

export async function registerUser(
  issuer: string,
  clientId: string,
  clientSecret: string,
  address: string
): Promise<any> {
  const Authorization = `Basic ${btoa(`${clientId}:${clientSecret}`)}`;

  const fetchResult = await fetch(`${issuer}/api/users`, {
    body: JSON.stringify({ address }),
    headers: {
      Authorization,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (fetchResult.ok) {
    const user = await fetchResult.json();
    return user;
  }
}

export async function renewWeb3AuthToken(
  refreshToken: string,
  issuer: string,
  clientId: string,
  clientSecret: string
): Promise<Web3AuthResponse> {
  log("renewing tokens");
  if (!refreshToken) {
    const error_data: Web3AuthResponse = {
      error: "invalid_grant",
      errorDescription: "Invalid tokens",
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

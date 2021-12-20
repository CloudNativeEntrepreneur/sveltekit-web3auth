import type { ServerRequest, ServerResponse } from "@sveltejs/kit/types/hooks";

export type AuthError = {
  error: string;
  errorDescription: string;
};
export interface Locals {
  userid: string;
  accessToken: string;
  refreshToken: string;
  idToken: string;
  authError?: AuthError;
  user?: any;
  retries?: number;
  cookieAttributes?: string;
}

export type Web3AuthContextClientFn = (
  request_path?: string,
  request_params?: Record<string, string>
) => {
  session: any;
  issuer: string;
  page: Page;
  clientId: string;
};

export type Web3AuthContextClientPromise = Promise<Web3AuthContextClientFn>;

export interface Web3AuthSuccessResponse {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

export type Web3AuthFailureResponse = AuthError;

export type Web3AuthResponse = Web3AuthSuccessResponse &
  Web3AuthFailureResponse;

export interface UserDetailsGeneratorFn {
  (request: ServerRequest<Locals>): AsyncGenerator<
    ServerResponse,
    ServerResponse,
    ServerRequest<Locals>
  >;
}
export interface UserSession {
  user: any;
  accessToken: string;
  refreshToken: string;
  userid: string;
  error?: AuthError | undefined;
  authServerOnline: boolean;
}
export interface GetUserSessionFn {
  (
    request: ServerRequest<Locals>,
    issuer: string,
    clientId: string,
    clientSecret: string,
    refreshTokenMaxRetries: number
  ): Promise<UserSession>;
}

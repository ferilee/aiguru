import { randomUUID } from "crypto";

export const GOOGLE_STATE_COOKIE = "ai_guru_google_state";

type GoogleTokenResponse = {
  access_token: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
};

export type GoogleUserInfo = {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
};

export function isGoogleOAuthEnabled(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env variable: ${name}`);
  }
  return value;
}

function normalizeOrigin(url: string): string {
  return url.replace(/\/+$/, "");
}

function isLocalHost(hostname: string): boolean {
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  );
}

function resolveRedirectUri(origin?: string): string {
  const envRedirect = process.env.GOOGLE_REDIRECT_URI?.trim();
  const normalizedOrigin = origin ? normalizeOrigin(origin) : "";

  if (envRedirect) {
    try {
      const envUrl = new URL(envRedirect);
      if (normalizedOrigin) {
        const originUrl = new URL(normalizedOrigin);
        if (isLocalHost(envUrl.hostname) && !isLocalHost(originUrl.hostname)) {
          return `${normalizedOrigin}/api/auth/google/callback`;
        }
      }
    } catch {
      // Fallback to raw env value for backward compatibility.
    }
    return envRedirect;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const baseUrl =
    (appUrl && normalizeOrigin(appUrl)) ||
    normalizedOrigin ||
    "http://localhost:3005";
  return `${baseUrl}/api/auth/google/callback`;
}

export function getGoogleOAuthConfig(origin?: string): {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
} {
  const clientId = requireEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_CLIENT_SECRET");
  const redirectUri = resolveRedirectUri(origin);
  return { clientId, clientSecret, redirectUri };
}

export function buildGoogleState(): string {
  return `${Date.now()}-${randomUUID()}`;
}

export function buildGoogleAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const query = new URLSearchParams({
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: params.state,
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${query.toString()}`;
}

export async function exchangeCodeForToken(input: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<GoogleTokenResponse> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: input.clientId,
      client_secret: input.clientSecret,
      redirect_uri: input.redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google token exchange failed: ${text}`);
  }
  return (await response.json()) as GoogleTokenResponse;
}

export async function fetchGoogleUserInfo(
  accessToken: string,
): Promise<GoogleUserInfo> {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google userinfo request failed: ${text}`);
  }
  return (await response.json()) as GoogleUserInfo;
}

import { SignJWT, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "ai_guru_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-only-change-this-secret",
);

export type SessionPayload = {
  userId: number;
  role: "participant" | "admin";
  email: string;
};

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function readSession(
  request: NextRequest,
): Promise<SessionPayload | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function attachSessionCookie(
  response: NextResponse,
  payload: SessionPayload,
): Promise<void> {
  const token = await signSession(payload);
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;

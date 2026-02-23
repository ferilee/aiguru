import { NextRequest, NextResponse } from "next/server";
import {
  buildGoogleAuthUrl,
  buildGoogleState,
  getGoogleOAuthConfig,
  isGoogleOAuthEnabled,
  GOOGLE_STATE_COOKIE,
} from "@/lib/google-auth";

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!isGoogleOAuthEnabled()) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "Login Google belum diaktifkan.");
    return NextResponse.redirect(url);
  }

  try {
    const { clientId, redirectUri } = getGoogleOAuthConfig(
      request.nextUrl.origin,
    );
    const state = buildGoogleState();
    const authUrl = buildGoogleAuthUrl({ clientId, redirectUri, state });
    const isDebugMode = request.nextUrl.searchParams.get("debug") === "1";

    if (isDebugMode) {
      return NextResponse.json({
        enabled: true,
        redirectUri,
        authUrl,
      });
    }

    const response = NextResponse.redirect(authUrl);
    response.cookies.set(GOOGLE_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });
    return response;
  } catch (error) {
    const url = new URL("/login", request.url);
    url.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Google auth unavailable",
    );
    return NextResponse.redirect(url);
  }
}

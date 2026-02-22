import { NextRequest, NextResponse } from "next/server";
import {
  buildGoogleAuthUrl,
  buildGoogleState,
  getGoogleOAuthConfig,
  GOOGLE_STATE_COOKIE
} from "@/lib/google-auth";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { clientId, redirectUri } = getGoogleOAuthConfig(request.nextUrl.origin);
    const state = buildGoogleState();
    const authUrl = buildGoogleAuthUrl({ clientId, redirectUri, state });

    const response = NextResponse.redirect(authUrl);
    response.cookies.set(GOOGLE_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Google auth unavailable" },
      { status: 500 }
    );
  }
}

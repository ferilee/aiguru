import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { attachSessionCookie } from "@/lib/auth";
import {
  exchangeCodeForToken,
  fetchGoogleUserInfo,
  getGoogleOAuthConfig,
  GOOGLE_STATE_COOKIE,
} from "@/lib/google-auth";

function redirectWithError(
  request: NextRequest,
  message: string,
): NextResponse {
  const url = new URL("/login", request.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const cookieState = request.cookies.get(GOOGLE_STATE_COOKIE)?.value;

  if (!code || !state || !cookieState || state !== cookieState) {
    return redirectWithError(
      request,
      "OAuth state tidak valid. Silakan coba lagi.",
    );
  }

  try {
    const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig(
      request.nextUrl.origin,
    );
    const token = await exchangeCodeForToken({
      code,
      clientId,
      clientSecret,
      redirectUri,
    });
    const googleUser = await fetchGoogleUserInfo(token.access_token);
    if (!googleUser.email || !googleUser.sub || !googleUser.email_verified) {
      return redirectWithError(
        request,
        "Email Google belum terverifikasi. Gunakan akun Google terverifikasi.",
      );
    }

    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.googleId, googleUser.sub))
      .limit(1);

    if (!user) {
      const [existingEmailUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, googleUser.email))
        .limit(1);

      if (existingEmailUser) {
        if (
          existingEmailUser.googleId &&
          existingEmailUser.googleId !== googleUser.sub
        ) {
          return redirectWithError(
            request,
            "Email ini sudah terhubung ke akun Google lain.",
          );
        }

        [user] = await db
          .update(users)
          .set({
            googleId: googleUser.sub,
          })
          .where(eq(users.id, existingEmailUser.id))
          .returning();
      } else {
        [user] = await db
          .insert(users)
          .values({
            name: googleUser.name || googleUser.email.split("@")[0],
            email: googleUser.email,
            passwordHash: "",
            authProvider: "google",
            googleId: googleUser.sub,
            role: "participant",
          })
          .returning();
      }
    }

    const redirectTo = user.role === "admin" ? "/admin" : "/dashboard";
    const response = NextResponse.redirect(new URL(redirectTo, request.url));
    response.cookies.set(GOOGLE_STATE_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    await attachSessionCookie(response, {
      userId: user.id,
      role: user.role,
      email: user.email,
    });
    return response;
  } catch (error) {
    return redirectWithError(
      request,
      error instanceof Error ? error.message : "Google login gagal.",
    );
  }
}

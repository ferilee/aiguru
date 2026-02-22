import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

const participantRoutes = ["/dashboard", "/classroom", "/profile"];
const adminRoutes = ["/admin"];
const guestOnlyRoutes = ["/login", "/register"];

function startsWithAny(pathname: string, routes: string[]): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/certificates") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (startsWithAny(pathname, guestOnlyRoutes) && session) {
    const target = session.role === "admin" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (startsWithAny(pathname, participantRoutes) && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (startsWithAny(pathname, adminRoutes)) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (session.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};

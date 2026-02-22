import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json({ message: "Logout successful" });
  clearSessionCookie(response);
  return response;
}

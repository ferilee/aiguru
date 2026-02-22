import { NextRequest, NextResponse } from "next/server";
import { readSession, SessionPayload } from "./auth";

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function requireSession(request: NextRequest): Promise<{
  session: SessionPayload | null;
  error?: NextResponse;
}> {
  const session = await readSession(request);
  if (!session) {
    return { session: null, error: jsonError("Unauthorized", 401) };
  }
  return { session };
}

export async function requireAdmin(request: NextRequest): Promise<{
  session: SessionPayload | null;
  error?: NextResponse;
}> {
  const { session, error } = await requireSession(request);
  if (error) return { session: null, error };
  if (session?.role !== "admin") {
    return { session, error: jsonError("Forbidden. Admin only.", 403) };
  }
  return { session };
}

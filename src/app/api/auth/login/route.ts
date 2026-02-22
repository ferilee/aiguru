import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { attachSessionCookie } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { jsonError } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid payload", 422);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  if (!user) {
    return jsonError("Invalid credentials", 401);
  }
  if (user.authProvider === "google" && !user.passwordHash) {
    return jsonError(
      "Akun ini terdaftar via Google. Gunakan Login dengan Google.",
      401,
    );
  }

  const match = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!match) {
    return jsonError("Invalid credentials", 401);
  }

  const response = NextResponse.json({
    message: "Login successful",
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
  await attachSessionCookie(response, {
    userId: user.id,
    role: user.role,
    email: user.email,
  });
  return response;
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { attachSessionCookie } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { jsonError } from "@/lib/api";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid payload", 422);
  }

  const { name, email, password } = parsed.data;
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    return jsonError("Email already registered", 409);
  }

  const passwordHash = await hashPassword(password);
  const [created] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash,
      authProvider: "local",
      googleId: "",
      role: "participant",
    })
    .returning();

  const response = NextResponse.json({
    message: "Registration successful",
    user: {
      id: created.id,
      name: created.name,
      email: created.email,
      role: created.role,
    },
  });
  await attachSessionCookie(response, {
    userId: created.id,
    role: created.role,
    email: created.email,
  });
  return response;
}

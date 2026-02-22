import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const updateMeSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  avatarUrl: z.union([z.string().url(), z.literal("")]).optional(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session!.userId))
    .limit(1);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
  });
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = updateMeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }

  const [updated] = await db
    .update(users)
    .set(parsed.data)
    .where(eq(users.id, session!.userId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      avatarUrl: updated.avatarUrl,
    },
  });
}

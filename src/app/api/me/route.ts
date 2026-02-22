import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const [user] = await db.select().from(users).where(eq(users.id, session!.userId)).limit(1);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
}

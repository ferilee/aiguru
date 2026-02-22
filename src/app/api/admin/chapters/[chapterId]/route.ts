import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { chapters } from "@/lib/db/schema";
import { jsonError, requireAdmin } from "@/lib/api";

const updateChapterSchema = z.object({
  title: z.string().min(2).optional(),
  orderIndex: z.number().int().min(0).optional()
});

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ chapterId: string }> }
): Promise<NextResponse> {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const params = await context.params;
  const chapterId = parseId(params.chapterId);
  if (!chapterId) return jsonError("Invalid chapter id", 422);

  const body = await request.json().catch(() => null);
  const parsed = updateChapterSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid payload", 422);

  const [chapter] = await db
    .update(chapters)
    .set(parsed.data)
    .where(eq(chapters.id, chapterId))
    .returning();
  if (!chapter) return jsonError("Chapter not found", 404);

  return NextResponse.json({ chapter });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ chapterId: string }> }
): Promise<NextResponse> {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const params = await context.params;
  const chapterId = parseId(params.chapterId);
  if (!chapterId) return jsonError("Invalid chapter id", 422);

  const [deleted] = await db.delete(chapters).where(eq(chapters.id, chapterId)).returning();
  if (!deleted) return jsonError("Chapter not found", 404);

  return NextResponse.json({ message: "Chapter deleted" });
}

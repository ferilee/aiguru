import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { chapters, materials } from "@/lib/db/schema";
import { jsonError, requireAdmin } from "@/lib/api";

const materialSchema = z.object({
  title: z.string().min(2),
  type: z.enum(["video", "text", "pdf", "quiz", "assignment"]),
  body: z.string().default(""),
  videoUrl: z.string().url().optional().default(""),
  assetUrl: z.string().url().optional().default(""),
  orderIndex: z.number().int().min(0).default(0)
});

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ chapterId: string }> }
): Promise<NextResponse> {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const params = await context.params;
  const chapterId = parseId(params.chapterId);
  if (!chapterId) return jsonError("Invalid chapter id", 422);

  const rows = await db
    .select()
    .from(materials)
    .where(eq(materials.chapterId, chapterId))
    .orderBy(asc(materials.orderIndex));
  return NextResponse.json({ materials: rows });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ chapterId: string }> }
): Promise<NextResponse> {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const params = await context.params;
  const chapterId = parseId(params.chapterId);
  if (!chapterId) return jsonError("Invalid chapter id", 422);

  const [chapter] = await db.select().from(chapters).where(eq(chapters.id, chapterId)).limit(1);
  if (!chapter) return jsonError("Chapter not found", 404);

  const body = await request.json().catch(() => null);
  const parsed = materialSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid payload", 422);

  const [material] = await db
    .insert(materials)
    .values({
      chapterId,
      ...parsed.data
    })
    .returning();

  return NextResponse.json({ material }, { status: 201 });
}

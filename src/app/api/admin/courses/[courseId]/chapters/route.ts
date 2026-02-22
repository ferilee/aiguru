import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { chapters, courses } from "@/lib/db/schema";
import { jsonError, requireAdmin } from "@/lib/api";

const chapterSchema = z.object({
  title: z.string().min(2),
  orderIndex: z.number().int().min(0).default(0)
});

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
): Promise<NextResponse> {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const params = await context.params;
  const courseId = parseId(params.courseId);
  if (!courseId) return jsonError("Invalid course id", 422);

  const rows = await db
    .select()
    .from(chapters)
    .where(eq(chapters.courseId, courseId))
    .orderBy(asc(chapters.orderIndex));
  return NextResponse.json({ chapters: rows });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
): Promise<NextResponse> {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const params = await context.params;
  const courseId = parseId(params.courseId);
  if (!courseId) return jsonError("Invalid course id", 422);

  const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
  if (!course) return jsonError("Course not found", 404);

  const body = await request.json().catch(() => null);
  const parsed = chapterSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid payload", 422);

  const [chapter] = await db
    .insert(chapters)
    .values({
      courseId,
      title: parsed.data.title,
      orderIndex: parsed.data.orderIndex
    })
    .returning();

  return NextResponse.json({ chapter }, { status: 201 });
}

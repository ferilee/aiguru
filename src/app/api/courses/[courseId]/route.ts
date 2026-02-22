import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { chapters, courses, materials } from "@/lib/db/schema";
import { jsonError, requireAdmin } from "@/lib/api";

const updateCourseSchema = z.object({
  title: z.string().min(3).optional(),
  slug: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  thumbnailUrl: z.string().url().optional(),
  previewVideoUrl: z.string().url().optional(),
  price: z.number().min(0).optional(),
  status: z.enum(["draft", "published"]).optional(),
});

function parseCourseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ courseId: string }> },
): Promise<NextResponse> {
  const params = await context.params;
  const courseId = parseCourseId(params.courseId);
  if (!courseId) return jsonError("Invalid course id", 422);

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);
  if (!course) return jsonError("Course not found", 404);

  const chapterRows = await db
    .select()
    .from(chapters)
    .where(eq(chapters.courseId, courseId))
    .orderBy(asc(chapters.orderIndex));

  const chapterIds = chapterRows.map((ch) => ch.id);
  const materialRows = chapterIds.length
    ? await db
        .select()
        .from(materials)
        .where(inArray(materials.chapterId, chapterIds))
        .orderBy(asc(materials.orderIndex))
    : [];

  const chapterMap = chapterRows.map((chapter) => ({
    ...chapter,
    materials: materialRows.filter((m) => m.chapterId === chapter.id),
  }));

  return NextResponse.json({ course: { ...course, chapters: chapterMap } });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> },
): Promise<NextResponse> {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const params = await context.params;
  const courseId = parseCourseId(params.courseId);
  if (!courseId) return jsonError("Invalid course id", 422);

  const body = await request.json().catch(() => null);
  const parsed = updateCourseSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid payload", 422);

  const [updated] = await db
    .update(courses)
    .set(parsed.data)
    .where(eq(courses.id, courseId))
    .returning();

  if (!updated) return jsonError("Course not found", 404);
  return NextResponse.json({ course: updated });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> },
): Promise<NextResponse> {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const params = await context.params;
  const courseId = parseCourseId(params.courseId);
  if (!courseId) return jsonError("Invalid course id", 422);

  const [deleted] = await db
    .delete(courses)
    .where(eq(courses.id, courseId))
    .returning();
  if (!deleted) return jsonError("Course not found", 404);

  return NextResponse.json({ message: "Course deleted" });
}

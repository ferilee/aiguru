import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses, enrollments } from "@/lib/db/schema";
import { jsonError, requireSession } from "@/lib/api";

function parseCourseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
): Promise<NextResponse> {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const params = await context.params;
  const courseId = parseCourseId(params.courseId);
  if (!courseId) return jsonError("Invalid course id", 422);

  const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
  if (!course || course.status !== "published") {
    return jsonError("Course not available", 404);
  }

  const [existing] = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.userId, session!.userId), eq(enrollments.courseId, courseId)))
    .limit(1);

  if (!existing) {
    await db.insert(enrollments).values({ userId: session!.userId, courseId });
  }

  return NextResponse.json({ message: "Enrolled successfully" });
}

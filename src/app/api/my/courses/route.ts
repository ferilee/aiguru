import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  chapters,
  courses,
  enrollments,
  materialCompletions,
  materials
} from "@/lib/db/schema";
import { requireSession } from "@/lib/api";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const enrollmentRows = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.userId, session!.userId));
  const courseIds = enrollmentRows.map((row) => row.courseId);

  const courseRows = courseIds.length
    ? await db.select().from(courses).where(inArray(courses.id, courseIds))
    : [];
  const chapterRows = courseIds.length
    ? await db.select().from(chapters).where(inArray(chapters.courseId, courseIds))
    : [];
  const chapterIds = chapterRows.map((chapter) => chapter.id);
  const materialRows = chapterIds.length
    ? await db.select().from(materials).where(inArray(materials.chapterId, chapterIds))
    : [];

  const payload = await Promise.all(
    courseRows.map(async (course) => {
      const chapterIdsForCourse = chapterRows
        .filter((chapter) => chapter.courseId === course.id)
        .map((chapter) => chapter.id);
      const materialIds = materialRows
        .filter((material) => chapterIdsForCourse.includes(material.chapterId))
        .map((material) => material.id);
      const completionRows = materialIds.length
        ? await db
            .select()
            .from(materialCompletions)
            .where(
              and(
                eq(materialCompletions.userId, session!.userId),
                inArray(materialCompletions.materialId, materialIds)
              )
            )
        : [];

      const progress = materialIds.length
        ? Math.round((completionRows.length / materialIds.length) * 100)
        : 0;
      return { ...course, progress };
    })
  );

  return NextResponse.json({ courses: payload });
}

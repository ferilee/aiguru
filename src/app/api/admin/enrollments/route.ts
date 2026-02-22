import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  chapters,
  courses,
  enrollments,
  materialCompletions,
  materials,
  users
} from "@/lib/db/schema";
import { requireAdmin } from "@/lib/api";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const enrollmentRows = await db.select().from(enrollments);
  const courseRows = await db.select().from(courses);
  const userRows = await db.select().from(users);
  const chapterRows = await db.select().from(chapters);
  const materialRows = await db.select().from(materials);

  const payload = await Promise.all(
    enrollmentRows.map(async (enrollment) => {
      const course = courseRows.find((item) => item.id === enrollment.courseId);
      const user = userRows.find((item) => item.id === enrollment.userId);

      const chapterIds = chapterRows
        .filter((chapter) => chapter.courseId === enrollment.courseId)
        .map((chapter) => chapter.id);
      const materialIds = materialRows
        .filter((material) => chapterIds.includes(material.chapterId))
        .map((material) => material.id);

      const completionRows = materialIds.length
        ? await db
            .select()
            .from(materialCompletions)
            .where(
              and(
                eq(materialCompletions.userId, enrollment.userId),
                inArray(materialCompletions.materialId, materialIds)
              )
            )
        : [];
      const progress = materialIds.length
        ? Math.round((completionRows.length / materialIds.length) * 100)
        : 0;

      return {
        enrollmentId: enrollment.id,
        enrolledAt: enrollment.enrolledAt,
        user: user
          ? { id: user.id, name: user.name, email: user.email }
          : { id: enrollment.userId, name: "Unknown", email: "-" },
        course: course
          ? { id: course.id, title: course.title, slug: course.slug }
          : { id: enrollment.courseId, title: "Unknown", slug: "-" },
        progress
      };
    })
  );

  return NextResponse.json({ enrollments: payload });
}

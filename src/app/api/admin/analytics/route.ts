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

  const courseRows = await db.select().from(courses);
  const enrollmentRows = await db.select().from(enrollments);
  const participantRows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "participant"));

  const chapterRows = await db.select().from(chapters);
  const materialRows = await db.select().from(materials);

  const progressByCourse = await Promise.all(
    courseRows.map(async (course) => {
      const courseChapterIds = chapterRows
        .filter((chapter) => chapter.courseId === course.id)
        .map((chapter) => chapter.id);
      const courseMaterialIds = materialRows
        .filter((material) => courseChapterIds.includes(material.chapterId))
        .map((material) => material.id);

      const enrolledUsers = enrollmentRows
        .filter((enrollment) => enrollment.courseId === course.id)
        .map((enrollment) => enrollment.userId);

      const completionRows =
        courseMaterialIds.length && enrolledUsers.length
          ? await db
              .select()
              .from(materialCompletions)
              .where(
                and(
                  inArray(materialCompletions.materialId, courseMaterialIds),
                  inArray(materialCompletions.userId, enrolledUsers)
                )
              )
          : [];

      const possibleCompletions = courseMaterialIds.length * enrolledUsers.length;
      const avgProgress = possibleCompletions
        ? Math.round((completionRows.length / possibleCompletions) * 100)
        : 0;

      return {
        courseId: course.id,
        title: course.title,
        enrollments: enrolledUsers.length,
        avgProgress
      };
    })
  );

  return NextResponse.json({
    summary: {
      totalCourses: courseRows.length,
      totalParticipants: participantRows.length,
      totalEnrollments: enrollmentRows.length
    },
    byCourse: progressByCourse
  });
}

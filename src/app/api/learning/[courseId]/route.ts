import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  assignments,
  chapters,
  courses,
  enrollments,
  materialCompletions,
  materials,
  quizOptions,
  quizzes,
} from "@/lib/db/schema";
import { jsonError, requireSession } from "@/lib/api";

function parseCourseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> },
): Promise<NextResponse> {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const params = await context.params;
  const courseId = parseCourseId(params.courseId);
  if (!courseId) return jsonError("Invalid course id", 422);

  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(
      and(
        eq(enrollments.userId, session!.userId),
        eq(enrollments.courseId, courseId),
      ),
    )
    .limit(1);

  if (!enrollment && session!.role !== "admin") {
    return jsonError("Not enrolled", 403);
  }

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
  const chapterIds = chapterRows.map((row) => row.id);

  const materialRows = chapterIds.length
    ? await db
        .select()
        .from(materials)
        .where(inArray(materials.chapterId, chapterIds))
        .orderBy(asc(materials.orderIndex))
    : [];

  const materialIds = materialRows.map((row) => row.id);
  const completionRows = materialIds.length
    ? await db
        .select()
        .from(materialCompletions)
        .where(
          and(
            eq(materialCompletions.userId, session!.userId),
            inArray(materialCompletions.materialId, materialIds),
          ),
        )
    : [];

  const quizRows = materialIds.length
    ? await db
        .select()
        .from(quizzes)
        .where(inArray(quizzes.materialId, materialIds))
    : [];
  const quizIds = quizRows.map((quiz) => quiz.id);
  const optionRows = quizIds.length
    ? await db
        .select()
        .from(quizOptions)
        .where(inArray(quizOptions.quizId, quizIds))
    : [];
  const assignmentRows = materialIds.length
    ? await db
        .select()
        .from(assignments)
        .where(inArray(assignments.materialId, materialIds))
    : [];

  const completedSet = new Set(completionRows.map((row) => row.materialId));
  const totalMaterials = materialRows.length;
  const completedMaterials = completionRows.length;
  const progress = totalMaterials
    ? Math.round((completedMaterials / totalMaterials) * 100)
    : 0;

  const hydratedChapters = chapterRows.map((chapter) => ({
    ...chapter,
    materials: materialRows
      .filter((material) => material.chapterId === chapter.id)
      .map((material) => ({
        ...material,
        completed: completedSet.has(material.id),
        quiz: quizRows
          .filter((quiz) => quiz.materialId === material.id)
          .map((quiz) => ({
            ...quiz,
            options: optionRows.filter((option) => option.quizId === quiz.id),
          }))[0],
        assignment: assignmentRows.filter(
          (assignment) => assignment.materialId === material.id,
        )[0],
      })),
  }));

  return NextResponse.json({
    course,
    chapters: hydratedChapters,
    progress,
    completedMaterials,
    totalMaterials,
  });
}

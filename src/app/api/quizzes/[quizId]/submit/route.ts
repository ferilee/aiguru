import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  chapters,
  enrollments,
  materials,
  quizAttempts,
  quizOptions,
  quizzes
} from "@/lib/db/schema";
import { jsonError, requireSession } from "@/lib/api";

const submitQuizSchema = z.object({
  selectedOptionId: z.number().int().positive()
});

function parseQuizId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ quizId: string }> }
): Promise<NextResponse> {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const params = await context.params;
  const quizId = parseQuizId(params.quizId);
  if (!quizId) return jsonError("Invalid quiz id", 422);

  const body = await request.json().catch(() => null);
  const parsed = submitQuizSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid payload", 422);

  const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);
  if (!quiz) return jsonError("Quiz not found", 404);

  const [material] = await db
    .select()
    .from(materials)
    .where(eq(materials.id, quiz.materialId))
    .limit(1);
  if (!material) return jsonError("Quiz material not found", 404);

  const [chapter] = await db.select().from(chapters).where(eq(chapters.id, material.chapterId)).limit(1);
  if (!chapter) return jsonError("Chapter not found", 404);

  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(
      and(eq(enrollments.userId, session!.userId), eq(enrollments.courseId, chapter.courseId))
    )
    .limit(1);
  if (!enrollment && session!.role !== "admin") return jsonError("Not enrolled", 403);

  const [option] = await db
    .select()
    .from(quizOptions)
    .where(
      and(
        eq(quizOptions.id, parsed.data.selectedOptionId),
        eq(quizOptions.quizId, quiz.id)
      )
    )
    .limit(1);
  if (!option) return jsonError("Invalid option", 404);

  const [attempt] = await db
    .insert(quizAttempts)
    .values({
      quizId: quiz.id,
      userId: session!.userId,
      selectedOptionId: option.id,
      isCorrect: option.isCorrect
    })
    .returning();

  return NextResponse.json({
    message: "Quiz submitted",
    correct: attempt.isCorrect
  });
}

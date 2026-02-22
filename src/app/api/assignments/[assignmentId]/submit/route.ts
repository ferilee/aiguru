import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  assignmentSubmissions,
  assignments,
  chapters,
  enrollments,
  materials
} from "@/lib/db/schema";
import { jsonError, requireSession } from "@/lib/api";

const submitAssignmentSchema = z.object({
  submissionUrl: z.string().url()
});

function parseAssignmentId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ assignmentId: string }> }
): Promise<NextResponse> {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const params = await context.params;
  const assignmentId = parseAssignmentId(params.assignmentId);
  if (!assignmentId) return jsonError("Invalid assignment id", 422);

  const body = await request.json().catch(() => null);
  const parsed = submitAssignmentSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid payload", 422);

  const [assignment] = await db
    .select()
    .from(assignments)
    .where(eq(assignments.id, assignmentId))
    .limit(1);
  if (!assignment) return jsonError("Assignment not found", 404);

  const [material] = await db
    .select()
    .from(materials)
    .where(eq(materials.id, assignment.materialId))
    .limit(1);
  if (!material) return jsonError("Assignment material not found", 404);

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

  const [existing] = await db
    .select()
    .from(assignmentSubmissions)
    .where(
      and(
        eq(assignmentSubmissions.assignmentId, assignment.id),
        eq(assignmentSubmissions.userId, session!.userId)
      )
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(assignmentSubmissions)
      .set({ submissionUrl: parsed.data.submissionUrl })
      .where(eq(assignmentSubmissions.id, existing.id))
      .returning();

    return NextResponse.json({ message: "Assignment updated", submission: updated });
  }

  const [created] = await db
    .insert(assignmentSubmissions)
    .values({
      assignmentId: assignment.id,
      userId: session!.userId,
      submissionUrl: parsed.data.submissionUrl
    })
    .returning();

  return NextResponse.json({ message: "Assignment submitted", submission: created });
}

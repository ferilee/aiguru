import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  certificates,
  chapters,
  courses,
  enrollments,
  materialCompletions,
  materials
} from "@/lib/db/schema";
import { jsonError, requireSession } from "@/lib/api";
import { generateCertificateFile } from "@/lib/certificates";

function parseMaterialId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ materialId: string }> }
): Promise<NextResponse> {
  const { session, error } = await requireSession(request);
  if (error) return error;

  const params = await context.params;
  const materialId = parseMaterialId(params.materialId);
  if (!materialId) return jsonError("Invalid material id", 422);

  const [material] = await db.select().from(materials).where(eq(materials.id, materialId)).limit(1);
  if (!material) return jsonError("Material not found", 404);

  const [chapter] = await db.select().from(chapters).where(eq(chapters.id, material.chapterId)).limit(1);
  if (!chapter) return jsonError("Chapter not found", 404);

  const [course] = await db.select().from(courses).where(eq(courses.id, chapter.courseId)).limit(1);
  if (!course) return jsonError("Course not found", 404);

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
    .from(materialCompletions)
    .where(
      and(
        eq(materialCompletions.userId, session!.userId),
        eq(materialCompletions.materialId, materialId)
      )
    )
    .limit(1);

  if (!existing) {
    await db.insert(materialCompletions).values({
      userId: session!.userId,
      materialId
    });
  }

  const courseChapterRows = await db
    .select({ id: chapters.id })
    .from(chapters)
    .where(eq(chapters.courseId, chapter.courseId));
  const courseChapterIds = courseChapterRows.map((row) => row.id);
  const courseMaterialRows = courseChapterIds.length
    ? await db
        .select({ id: materials.id })
        .from(materials)
        .where(inArray(materials.chapterId, courseChapterIds))
    : [];
  const courseMaterialIds = courseMaterialRows.map((row) => row.id);
  const completionRows = courseMaterialIds.length
    ? await db
        .select()
        .from(materialCompletions)
        .where(
          and(
            eq(materialCompletions.userId, session!.userId),
            inArray(materialCompletions.materialId, courseMaterialIds)
          )
        )
    : [];

  const total = courseMaterialRows.length;
  const completed = completionRows.length;
  const progress = total ? Math.round((completed / total) * 100) : 0;

  let certificateUrl: string | null = null;
  if (progress === 100 && total > 0) {
    const [existingCertificate] = await db
      .select()
      .from(certificates)
      .where(
        and(
          eq(certificates.userId, session!.userId),
          eq(certificates.courseId, chapter.courseId)
        )
      )
      .limit(1);

    if (existingCertificate) {
      certificateUrl = existingCertificate.fileUrl;
    } else {
      const fileUrl = await generateCertificateFile(session!.userId, chapter.courseId);
      const [createdCertificate] = await db
        .insert(certificates)
        .values({
          userId: session!.userId,
          courseId: chapter.courseId,
          fileUrl
        })
        .returning();
      certificateUrl = createdCertificate.fileUrl;
    }
  }

  return NextResponse.json({
    message: "Marked as complete",
    progress,
    completedMaterials: completed,
    totalMaterials: total,
    certificateUrl
  });
}

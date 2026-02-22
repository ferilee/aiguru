import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  certificates,
  chapters,
  materialCompletions,
  materials,
} from "@/lib/db/schema";
import { jsonError, requireSession } from "@/lib/api";
import { generateCertificateFile } from "@/lib/certificates";

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

  const [existing] = await db
    .select()
    .from(certificates)
    .where(
      and(
        eq(certificates.userId, session!.userId),
        eq(certificates.courseId, courseId),
      ),
    )
    .limit(1);
  if (existing) {
    if (request.nextUrl.searchParams.get("download") === "1") {
      return NextResponse.redirect(new URL(existing.fileUrl, request.url));
    }
    return NextResponse.json({ certificate: existing });
  }

  const chapterRows = await db
    .select({ id: chapters.id })
    .from(chapters)
    .where(eq(chapters.courseId, courseId));
  const chapterIds = chapterRows.map((row) => row.id);
  const materialRows = chapterIds.length
    ? await db
        .select({ id: materials.id })
        .from(materials)
        .where(inArray(materials.chapterId, chapterIds))
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

  if (
    materialRows.length === 0 ||
    completionRows.length < materialRows.length
  ) {
    return jsonError("Course not completed yet", 422);
  }

  const fileUrl = await generateCertificateFile(session!.userId, courseId);
  const [created] = await db
    .insert(certificates)
    .values({
      userId: session!.userId,
      courseId,
      fileUrl,
    })
    .returning();

  if (request.nextUrl.searchParams.get("download") === "1") {
    return NextResponse.redirect(new URL(created.fileUrl, request.url));
  }

  return NextResponse.json({ certificate: created });
}

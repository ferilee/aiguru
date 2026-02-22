import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { materials, quizOptions, quizzes } from "@/lib/db/schema";
import { jsonError, requireAdmin } from "@/lib/api";

const quizSchema = z.object({
  question: z.string().min(5),
  options: z
    .array(
      z.object({
        optionText: z.string().min(1),
        isCorrect: z.boolean().default(false)
      })
    )
    .min(2)
});

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ materialId: string }> }
): Promise<NextResponse> {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const params = await context.params;
  const materialId = parseId(params.materialId);
  if (!materialId) return jsonError("Invalid material id", 422);

  const [material] = await db.select().from(materials).where(eq(materials.id, materialId)).limit(1);
  if (!material) return jsonError("Material not found", 404);

  const body = await request.json().catch(() => null);
  const parsed = quizSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid payload", 422);
  if (!parsed.data.options.some((option) => option.isCorrect)) {
    return jsonError("At least one option must be marked as correct", 422);
  }

  const [quiz] = await db
    .insert(quizzes)
    .values({ materialId, question: parsed.data.question })
    .returning();

  const options = await db
    .insert(quizOptions)
    .values(
      parsed.data.options.map((option) => ({
        quizId: quiz.id,
        optionText: option.optionText,
        isCorrect: option.isCorrect
      }))
    )
    .returning();

  return NextResponse.json({ quiz, options }, { status: 201 });
}

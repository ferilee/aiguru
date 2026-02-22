import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { assignments, materials } from "@/lib/db/schema";
import { jsonError, requireAdmin } from "@/lib/api";

const assignmentSchema = z.object({
  instruction: z.string().min(10)
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
  const parsed = assignmentSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid payload", 422);

  const [assignment] = await db
    .insert(assignments)
    .values({
      materialId,
      instruction: parsed.data.instruction
    })
    .returning();

  return NextResponse.json({ assignment }, { status: 201 });
}

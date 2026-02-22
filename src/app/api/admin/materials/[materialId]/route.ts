import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { materials } from "@/lib/db/schema";
import { jsonError, requireAdmin } from "@/lib/api";

const updateMaterialSchema = z.object({
  title: z.string().min(2).optional(),
  type: z.enum(["video", "text", "pdf", "quiz", "assignment"]).optional(),
  body: z.string().optional(),
  videoUrl: z.string().url().optional(),
  assetUrl: z.string().url().optional(),
  orderIndex: z.number().int().min(0).optional()
});

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ materialId: string }> }
): Promise<NextResponse> {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const params = await context.params;
  const materialId = parseId(params.materialId);
  if (!materialId) return jsonError("Invalid material id", 422);

  const body = await request.json().catch(() => null);
  const parsed = updateMaterialSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid payload", 422);

  const [material] = await db
    .update(materials)
    .set(parsed.data)
    .where(eq(materials.id, materialId))
    .returning();
  if (!material) return jsonError("Material not found", 404);

  return NextResponse.json({ material });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ materialId: string }> }
): Promise<NextResponse> {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const params = await context.params;
  const materialId = parseId(params.materialId);
  if (!materialId) return jsonError("Invalid material id", 422);

  const [deleted] = await db.delete(materials).where(eq(materials.id, materialId)).returning();
  if (!deleted) return jsonError("Material not found", 404);

  return NextResponse.json({ message: "Material deleted" });
}

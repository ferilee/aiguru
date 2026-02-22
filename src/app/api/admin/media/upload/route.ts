import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { mediaAssets } from "@/lib/db/schema";
import { requireAdmin, jsonError } from "@/lib/api";
import { uploadToMinio } from "@/lib/minio";

const mediaSchema = z.object({
  kind: z.enum(["video", "thumbnail", "pdf", "template"]),
  bucket: z.string().min(2).default("ai-guru"),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { session, error } = await requireAdmin(request);
  if (error) return error;

  const formData = await request.formData();
  const parsed = mediaSchema.safeParse({
    kind: formData.get("kind"),
    bucket: formData.get("bucket"),
  });
  if (!parsed.success) return jsonError("Invalid payload", 422);

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return jsonError("File is required", 422);
  }
  if (file.size === 0) {
    return jsonError("File is empty", 422);
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const objectName = `${parsed.data.kind}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileUrl = await uploadToMinio({
    bucket: parsed.data.bucket,
    objectName,
    body: buffer,
    contentType: file.type || "application/octet-stream",
  });

  const [asset] = await db
    .insert(mediaAssets)
    .values({
      kind: parsed.data.kind,
      fileName: file.name,
      fileUrl,
      createdBy: session!.userId,
    })
    .returning();

  return NextResponse.json({ asset }, { status: 201 });
}

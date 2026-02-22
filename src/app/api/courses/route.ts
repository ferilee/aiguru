import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { jsonError, requireAdmin, requireSession } from "@/lib/api";

const createCourseSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  description: z.string().min(10),
  thumbnailUrl: z.string().url().optional().default(""),
  price: z.number().min(0).default(0),
  status: z.enum(["draft", "published"]).default("draft"),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const role = request.nextUrl.searchParams.get("role");
  const auth = await requireSession(request);

  const whereClause =
    role === "admin" && auth.session?.role === "admin"
      ? undefined
      : eq(courses.status, "published");

  const rows = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      description: courses.description,
      thumbnailUrl: courses.thumbnailUrl,
      price: courses.price,
      status: courses.status,
    })
    .from(courses)
    .where(whereClause)
    .orderBy(asc(courses.createdAt));

  return NextResponse.json({ courses: rows });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { session, error } = await requireAdmin(request);
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = createCourseSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid payload", 422);

  const [created] = await db
    .insert(courses)
    .values({
      ...parsed.data,
      createdBy: session!.userId,
    })
    .returning();

  return NextResponse.json({ course: created }, { status: 201 });
}

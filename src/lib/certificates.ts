import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses, users } from "@/lib/db/schema";

export async function generateCertificateFile(
  userId: number,
  courseId: number,
): Promise<string> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .limit(1);

  if (!user || !course) {
    throw new Error(
      "Unable to generate certificate. User or course not found.",
    );
  }

  const safeName = user.name.replace(/\s+/g, "-").toLowerCase();
  const safeCourse = course.slug.replace(/\s+/g, "-").toLowerCase();
  const fileName = `certificate-${safeName}-${safeCourse}.pdf`;

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]);
  const titleFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);

  page.drawRectangle({
    x: 18,
    y: 18,
    width: 806,
    height: 559,
    borderWidth: 2,
    borderColor: rgb(0.06, 0.33, 0.2),
  });
  page.drawText("SERTIFIKAT KELULUSAN", {
    x: 230,
    y: 500,
    size: 30,
    font: titleFont,
    color: rgb(0.08, 0.26, 0.18),
  });
  page.drawText("AIGURU", {
    x: 365,
    y: 468,
    size: 14,
    font: bodyFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  page.drawText("Diberikan kepada:", {
    x: 360,
    y: 390,
    size: 14,
    font: bodyFont,
    color: rgb(0.25, 0.25, 0.25),
  });
  page.drawText(user.name, {
    x: 230,
    y: 350,
    size: 36,
    font: titleFont,
    color: rgb(0.06, 0.33, 0.2),
  });
  page.drawText("Telah menyelesaikan program:", {
    x: 305,
    y: 305,
    size: 14,
    font: bodyFont,
    color: rgb(0.25, 0.25, 0.25),
  });
  page.drawText(course.title, {
    x: 130,
    y: 270,
    size: 22,
    font: titleFont,
    color: rgb(0.12, 0.12, 0.12),
  });
  page.drawText(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`, {
    x: 340,
    y: 210,
    size: 12,
    font: bodyFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  const bytes = await pdf.save();
  const certificateDir = path.join(process.cwd(), "public", "certificates");
  await mkdir(certificateDir, { recursive: true });
  await writeFile(path.join(certificateDir, fileName), bytes);

  return `/certificates/${fileName}`;
}

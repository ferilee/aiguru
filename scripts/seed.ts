import { and, eq } from "drizzle-orm";
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/password";
import {
  assignments,
  chapters,
  courses,
  materials,
  quizOptions,
  quizzes,
  users,
} from "../src/lib/db/schema";

async function main(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@aiguru.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin12345";
  const adminName = process.env.ADMIN_NAME ?? "Admin AI Guru";

  let [admin] = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);
  if (!admin) {
    const passwordHash = await hashPassword(adminPassword);
    [admin] = await db
      .insert(users)
      .values({
        name: adminName,
        email: adminEmail,
        passwordHash,
        role: "admin",
      })
      .returning();
  }

  let [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.slug, "lkpd-interaktif"))
    .limit(1);
  if (!course) {
    [course] = await db
      .insert(courses)
      .values({
        title: "Membuat LKPD Interaktif",
        slug: "lkpd-interaktif",
        description:
          "Pelatihan merancang LKPD interaktif berbasis website sederhana untuk pembelajaran aktif.",
        thumbnailUrl: "http://localhost:9000/ai-guru/lkpd-thumb.jpg",
        price: 0,
        status: "published",
        createdBy: admin.id,
      })
      .returning();
  }

  let [chapter] = await db
    .select()
    .from(chapters)
    .where(
      and(
        eq(chapters.courseId, course.id),
        eq(chapters.title, "Chapter 1 - Fondasi LKPD Digital"),
      ),
    )
    .limit(1);
  if (!chapter) {
    [chapter] = await db
      .insert(chapters)
      .values({
        courseId: course.id,
        title: "Chapter 1 - Fondasi LKPD Digital",
        orderIndex: 1,
      })
      .returning();
  }

  let [videoMaterial] = await db
    .select()
    .from(materials)
    .where(
      and(
        eq(materials.chapterId, chapter.id),
        eq(materials.title, "Pengantar Kelas"),
      ),
    )
    .limit(1);
  if (!videoMaterial) {
    [videoMaterial] = await db
      .insert(materials)
      .values({
        chapterId: chapter.id,
        title: "Pengantar Kelas",
        type: "video",
        videoUrl: "http://localhost:9000/ai-guru/pengantar.mp4",
        orderIndex: 1,
      })
      .returning();
  }

  let [quizMaterial] = await db
    .select()
    .from(materials)
    .where(
      and(
        eq(materials.chapterId, chapter.id),
        eq(materials.title, "Quiz Pemahaman Dasar"),
      ),
    )
    .limit(1);
  if (!quizMaterial) {
    [quizMaterial] = await db
      .insert(materials)
      .values({
        chapterId: chapter.id,
        title: "Quiz Pemahaman Dasar",
        type: "quiz",
        body: "Kerjakan quiz untuk melanjutkan ke tugas.",
        orderIndex: 2,
      })
      .returning();
  }

  let [assignmentMaterial] = await db
    .select()
    .from(materials)
    .where(
      and(
        eq(materials.chapterId, chapter.id),
        eq(materials.title, "Tugas Proyek"),
      ),
    )
    .limit(1);
  if (!assignmentMaterial) {
    [assignmentMaterial] = await db
      .insert(materials)
      .values({
        chapterId: chapter.id,
        title: "Tugas Proyek",
        type: "assignment",
        body: "Kirim link proyek media pembelajaran Anda.",
        orderIndex: 3,
      })
      .returning();
  }

  let [quiz] = await db
    .select()
    .from(quizzes)
    .where(eq(quizzes.materialId, quizMaterial.id))
    .limit(1);
  if (!quiz) {
    [quiz] = await db
      .insert(quizzes)
      .values({
        materialId: quizMaterial.id,
        question: "Apa tujuan utama LKPD interaktif?",
      })
      .returning();
  }

  const options = await db
    .select()
    .from(quizOptions)
    .where(eq(quizOptions.quizId, quiz.id));
  if (options.length === 0) {
    await db.insert(quizOptions).values([
      {
        quizId: quiz.id,
        optionText: "Meningkatkan interaksi siswa",
        isCorrect: true,
      },
      {
        quizId: quiz.id,
        optionText: "Mengurangi aktivitas belajar siswa",
        isCorrect: false,
      },
    ]);
  }

  const [assignment] = await db
    .select()
    .from(assignments)
    .where(eq(assignments.materialId, assignmentMaterial.id))
    .limit(1);
  if (!assignment) {
    await db.insert(assignments).values({
      materialId: assignmentMaterial.id,
      instruction:
        "Buat 1 media pembelajaran berbasis web sederhana, lalu kirim link publikasinya.",
    });
  }

  console.log("Seed completed");
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

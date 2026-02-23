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

const courseSeeds = [
  {
    title: "Membuat LKPD Interaktif",
    slug: "lkpd-interaktif",
    description:
      "Pelatihan merancang LKPD interaktif berbasis website sederhana untuk pembelajaran aktif.",
    thumbnailUrl: "/course-thumbs/lkpd-interaktif.svg",
    previewVideoUrl: "/placeholders/preview.mp4",
    price: 0,
    status: "published" as const,
  },
  {
    title: "Canva untuk Media Ajar Kreatif",
    slug: "canva-media-ajar-kreatif",
    description:
      "Belajar membuat materi visual pembelajaran yang menarik dengan alur desain praktis.",
    thumbnailUrl: "/course-thumbs/canva-media-ajar-kreatif.svg",
    previewVideoUrl: "/placeholders/preview.mp4",
    price: 0,
    status: "published" as const,
  },
  {
    title: "Google Classroom dari Nol",
    slug: "google-classroom-dari-nol",
    description:
      "Panduan langkah demi langkah mengelola kelas digital, tugas, dan penilaian.",
    thumbnailUrl: "/course-thumbs/google-classroom-dari-nol.svg",
    previewVideoUrl: "/placeholders/preview.mp4",
    price: 0,
    status: "published" as const,
  },
  {
    title: "Asesmen Formatif Berbasis AI",
    slug: "asesmen-formatif-berbasis-ai",
    description:
      "Rancang asesmen cepat dengan bantuan AI untuk memetakan pemahaman siswa.",
    thumbnailUrl: "/course-thumbs/asesmen-formatif-berbasis-ai.svg",
    previewVideoUrl: "/placeholders/preview.mp4",
    price: 149000,
    status: "published" as const,
  },
  {
    title: "Project Based Learning untuk SMP/SMA",
    slug: "project-based-learning-smp-sma",
    description:
      "Strategi implementasi PjBL lengkap dengan contoh rubrik dan rencana aksi kelas.",
    thumbnailUrl: "/course-thumbs/project-based-learning-smp-sma.svg",
    previewVideoUrl: "/placeholders/preview.mp4",
    price: 199000,
    status: "published" as const,
  },
];

async function main(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@aiguru.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin12345";
  const adminName = process.env.ADMIN_NAME ?? "Admin AI Guru";
  const passwordHash = await hashPassword(adminPassword);

  let [admin] = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);
  if (!admin) {
    [admin] = await db
      .insert(users)
      .values({
        name: adminName,
        email: adminEmail,
        passwordHash,
        authProvider: "local",
        googleId: "",
        role: "admin",
      })
      .returning();
  } else {
    [admin] = await db
      .update(users)
      .set({
        name: adminName,
        passwordHash,
        authProvider: "local",
        googleId: "",
        role: "admin",
      })
      .where(eq(users.id, admin.id))
      .returning();
  }

  for (const seed of courseSeeds) {
    const existing = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.slug, seed.slug))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(courses).values({
        title: seed.title,
        slug: seed.slug,
        description: seed.description,
        thumbnailUrl: seed.thumbnailUrl,
        previewVideoUrl: seed.previewVideoUrl,
        price: seed.price,
        status: seed.status,
        createdBy: admin.id,
      });
    } else {
      await db
        .update(courses)
        .set({
          title: seed.title,
          description: seed.description,
          thumbnailUrl: seed.thumbnailUrl,
          previewVideoUrl: seed.previewVideoUrl,
          price: seed.price,
          status: seed.status,
        })
        .where(eq(courses.slug, seed.slug));
    }
  }

  let [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.slug, "lkpd-interaktif"))
    .limit(1);
  if (!course) {
    throw new Error("Seed course 'lkpd-interaktif' gagal dibuat.");
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
  console.log(`Total seeded courses target: ${courseSeeds.length}`);
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";

export default async function HomePage() {
  const publishedCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.status, "published"))
    .orderBy(asc(courses.createdAt));

  return (
    <main>
      <header className="container topbar">
        <Link href="/" className="brand">
          Akademi Inovasi Guru
        </Link>
        <nav className="nav">
          <Link href="/login" className="btn">
            Login
          </Link>
          <Link href="/register" className="btn primary">
            Daftar
          </Link>
        </nav>
      </header>

      <section className="container hero">
        <h1>
          Belajar membuat media pembelajaran modern, dari guru untuk guru.
        </h1>
        <p>
          Platform AI Guru menyediakan kelas terstruktur: video, modul, quiz,
          tugas proyek, tracking progres, dan sertifikat otomatis.
        </p>
      </section>

      <section className="container">
        <h2>Katalog Kelas</h2>
        <div className="course-grid">
          {publishedCourses.length === 0 ? (
            <article className="card">
              <h3>Belum ada kelas dipublikasikan</h3>
              <p>
                Admin dapat membuat course dari dashboard admin lalu ubah status
                ke Published.
              </p>
            </article>
          ) : (
            publishedCourses.map((course) => (
              <article key={course.id} className="card">
                <span className="pill">
                  {course.price > 0 ? `Rp${course.price}` : "Gratis"}
                </span>
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <Link href="/login" className="btn primary">
                  Enroll in Course
                </Link>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

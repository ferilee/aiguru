import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const publishedCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.status, "published"))
    .orderBy(asc(courses.createdAt));
  const featuredCourse = publishedCourses[0];
  const freeCourses = publishedCourses.filter((course) => course.price === 0);
  const premiumCourses = publishedCourses.filter((course) => course.price > 0);
  const newReleaseCourses = [...publishedCourses].reverse().slice(0, 8);

  function renderRail(
    title: string,
    courseItems: typeof publishedCourses,
    badge: "free" | "premium" | "new" = "free",
  ) {
    return (
      <section className="container rail-section">
        <h2>{title}</h2>
        <div className="rail">
          {courseItems.length === 0 ? (
            <article className="card rail-card">
              <p>Belum ada kelas pada kategori ini.</p>
            </article>
          ) : (
            courseItems.map((course, index) => (
              <article
                key={course.id}
                className="card rail-card stagger"
                style={{ ["--delay" as string]: `${index * 70}ms` }}
              >
                <div className="rail-media">
                  {course.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={course.thumbnailUrl} alt={course.title} />
                  ) : null}
                  {course.previewVideoUrl ? (
                    <video
                      className="preview-video"
                      src={course.previewVideoUrl}
                      muted
                      loop
                      playsInline
                      autoPlay
                    />
                  ) : null}
                </div>
                <span className="pill">
                  {badge === "new"
                    ? "NEW"
                    : course.price > 0
                      ? `Rp${course.price}`
                      : "Gratis"}
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
    );
  }

  return (
    <main>
      <header className="container topbar">
        <Link href="/" className="brand">
          AIGURU
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

      <section
        className="container hero featured"
        style={
          featuredCourse?.thumbnailUrl
            ? {
                backgroundImage: `linear-gradient(90deg, #000000d4 20%, #00000057 60%, #00000016 100%), url(${featuredCourse.thumbnailUrl})`,
              }
            : undefined
        }
      >
        <span className="pill">Featured Class</span>
        <h1>{featuredCourse?.title ?? "AIGURU"}</h1>
        <p>
          {featuredCourse?.description ??
            "Belajar membuat media pembelajaran modern, dari guru untuk guru."}
        </p>
        <div className="stack-buttons">
          <Link href="/login" className="btn primary">
            Mulai Belajar
          </Link>
          <Link href="/register" className="btn">
            Lihat Semua Kelas
          </Link>
        </div>
      </section>

      {renderRail("Popular on AIGURU", publishedCourses, "free")}
      {renderRail("Gratis untuk Guru", freeCourses, "free")}
      {renderRail("Premium Masterclass", premiumCourses, "premium")}
      {renderRail("Baru Rilis", newReleaseCourses, "new")}
    </main>
  );
}

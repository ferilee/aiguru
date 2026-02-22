"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TopNav } from "@/components/TopNav";

type User = {
  id: number;
  name: string;
  email: string;
  role: "participant" | "admin";
};

type Course = {
  id: number;
  slug: string;
  title: string;
  description: string;
  price: number;
  thumbnailUrl?: string;
  previewVideoUrl?: string;
  progress?: number;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [catalog, setCatalog] = useState<Course[]>([]);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load(): Promise<void> {
      const me = await fetch("/api/me");
      if (!me.ok) {
        window.location.href = "/login";
        return;
      }
      const mePayload = await me.json();
      setUser(mePayload.user);

      const catalogResponse = await fetch("/api/courses");
      const catalogPayload = await catalogResponse.json();
      setCatalog(catalogPayload.courses ?? []);

      const myResponse = await fetch("/api/my/courses");
      const myPayload = await myResponse.json();
      setMyCourses(myPayload.courses ?? []);
    }
    load().catch(() => setError("Gagal memuat dashboard."));
  }, []);

  async function enroll(courseId: number): Promise<void> {
    const response = await fetch(`/api/courses/${courseId}/enroll`, {
      method: "POST",
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "Enroll gagal");
      return;
    }

    const myResponse = await fetch("/api/my/courses");
    const myPayload = await myResponse.json();
    setMyCourses(myPayload.courses ?? []);
  }

  const enrolledSet = new Set(myCourses.map((course) => course.id));
  const featured = myCourses[0] ?? catalog[0];
  const freeCatalog = catalog.filter((course) => course.price === 0);
  const premiumCatalog = catalog.filter((course) => course.price > 0);
  const newReleaseCatalog = [...catalog].reverse().slice(0, 8);

  return (
    <main>
      <TopNav role={user?.role} />
      <section
        className="container hero featured"
        style={
          featured?.thumbnailUrl
            ? {
                backgroundImage: `linear-gradient(90deg, #000000d4 20%, #00000057 60%, #00000016 100%), url(${featured.thumbnailUrl})`,
              }
            : undefined
        }
      >
        <span className="pill">Continue Learning</span>
        <h1>{featured?.title ?? "Dashboard Peserta"}</h1>
        <p>
          Halo {user?.name ?? "Guru"},{" "}
          {featured?.description ?? "lanjutkan pembelajaran Anda."}
        </p>
        <div className="stack-buttons">
          {featured ? (
            <Link href={`/classroom/${featured.id}`} className="btn primary">
              Lanjutkan Sekarang
            </Link>
          ) : (
            <Link href="/dashboard" className="btn primary">
              Buka Dashboard
            </Link>
          )}
        </div>
        {error ? <p style={{ color: "#8f1d1d" }}>{error}</p> : null}
      </section>

      <section className="container rail-section" style={{ paddingBottom: 20 }}>
        <h2>Kelas Saya</h2>
        <div className="rail">
          {myCourses.length === 0 ? (
            <article className="card">
              <p>Anda belum enroll ke kelas mana pun.</p>
            </article>
          ) : (
            myCourses.map((course, index) => (
              <article
                key={course.id}
                className="card rail-card stagger"
                style={{ ["--delay" as string]: `${index * 80}ms` }}
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
                <span className="pill">Progress {course.progress ?? 0}%</span>
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <Link href={`/classroom/${course.id}`} className="btn primary">
                  Masuk Kelas
                </Link>
                {(course.progress ?? 0) === 100 ? (
                  <Link
                    href={`/api/certificates/${course.id}?download=1`}
                    className="btn"
                    target="_blank"
                  >
                    Download Sertifikat
                  </Link>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>

      <section className="container rail-section" style={{ paddingBottom: 50 }}>
        <h2>Trending Katalog</h2>
        <div className="rail">
          {newReleaseCatalog.map((course, index) => (
            <article
              key={course.id}
              className="card rail-card stagger"
              style={{ ["--delay" as string]: `${index * 80}ms` }}
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
              <span className="pill">NEW</span>
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              {enrolledSet.has(course.id) ? (
                <Link href={`/classroom/${course.id}`} className="btn">
                  Lanjut Belajar
                </Link>
              ) : (
                <button
                  className="btn primary"
                  onClick={() => enroll(course.id)}
                  type="button"
                >
                  Enroll in Course
                </button>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="container rail-section" style={{ paddingBottom: 50 }}>
        <h2>Kelas Gratis</h2>
        <div className="rail">
          {freeCatalog.map((course, index) => (
            <article
              key={course.id}
              className="card rail-card stagger"
              style={{ ["--delay" as string]: `${index * 80}ms` }}
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
              <span className="pill">Gratis</span>
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              {enrolledSet.has(course.id) ? (
                <Link href={`/classroom/${course.id}`} className="btn">
                  Lanjut Belajar
                </Link>
              ) : (
                <button
                  className="btn primary"
                  onClick={() => enroll(course.id)}
                  type="button"
                >
                  Enroll in Course
                </button>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="container rail-section" style={{ paddingBottom: 50 }}>
        <h2>Kelas Premium</h2>
        <div className="rail">
          {premiumCatalog.map((course, index) => (
            <article
              key={course.id}
              className="card rail-card stagger"
              style={{ ["--delay" as string]: `${index * 80}ms` }}
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
              <span className="pill">Rp{course.price}</span>
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              {enrolledSet.has(course.id) ? (
                <Link href={`/classroom/${course.id}`} className="btn">
                  Lanjut Belajar
                </Link>
              ) : (
                <button
                  className="btn primary"
                  onClick={() => enroll(course.id)}
                  type="button"
                >
                  Enroll in Course
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

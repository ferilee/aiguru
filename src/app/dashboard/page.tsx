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

  return (
    <main>
      <TopNav role={user?.role} />
      <section className="container">
        <h1>Dashboard Peserta</h1>
        <p>Halo {user?.name ?? "Guru"}, lanjutkan pembelajaran Anda.</p>
        {error ? <p style={{ color: "#8f1d1d" }}>{error}</p> : null}
      </section>

      <section className="container" style={{ paddingBottom: 20 }}>
        <h2>Kelas Saya</h2>
        <div className="course-grid">
          {myCourses.length === 0 ? (
            <article className="card">
              <p>Anda belum enroll ke kelas mana pun.</p>
            </article>
          ) : (
            myCourses.map((course) => (
              <article key={course.id} className="card">
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

      <section className="container" style={{ paddingBottom: 50 }}>
        <h2>Katalog</h2>
        <div className="course-grid">
          {catalog.map((course) => (
            <article key={course.id} className="card">
              <span className="pill">
                {course.price > 0 ? `Rp${course.price}` : "Gratis"}
              </span>
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

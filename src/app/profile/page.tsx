"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
};

type Course = {
  id: number;
  title: string;
  progress?: number;
  thumbnailUrl?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load(): Promise<void> {
      const meRes = await fetch("/api/me", { cache: "no-store" });
      if (!meRes.ok) {
        window.location.href = "/login";
        return;
      }
      const mePayload = await meRes.json();
      setUser(mePayload.user);

      const myRes = await fetch("/api/my/courses", { cache: "no-store" });
      if (myRes.ok) {
        const myPayload = await myRes.json();
        setCourses(myPayload.courses ?? []);
      }
    }

    load().catch(() => setError("Gagal memuat profil."));
  }, []);

  async function handleLogout(): Promise<void> {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  }

  async function updateProfile(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData(event.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? ""),
      avatarUrl: String(fd.get("avatarUrl") ?? ""),
    };
    const response = await fetch("/api/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setError(result?.error ?? "Gagal menyimpan profil.");
      setSaving(false);
      return;
    }
    setUser(result.user ?? null);
    setSaving(false);
  }

  const initials = useMemo(() => {
    const raw = user?.name?.trim() ?? "";
    if (!raw) return "AI";
    const parts = raw.split(/\s+/).slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "AI";
  }, [user?.name]);

  return (
    <main className="profile-page">
      <section className="profile-shell">
        <aside className="profile-main-card">
          <div className="profile-head">
            <button
              className="profile-icon-btn"
              onClick={() => router.back()}
              type="button"
            >
              ←
            </button>
            <span className="profile-head-label">Profile</span>
          </div>

          <div className="profile-avatar-wrap">
            <div className="profile-avatar-ring">
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="profile-avatar-image"
                  src={user.avatarUrl}
                  alt={user.name ?? "Avatar"}
                />
              ) : (
                <div className="profile-avatar">{initials}</div>
              )}
            </div>
          </div>

          <h1 className="profile-name">{user?.name ?? "AIGURU User"}</h1>
          <p className="profile-email">{user?.email ?? ""}</p>

          <div className="profile-actions">
            <button
              className="profile-logout-btn"
              onClick={handleLogout}
              type="button"
            >
              Log Out
            </button>
            <Link
              href="/dashboard"
              className="profile-mini-link"
              title="Dashboard"
            >
              ↗
            </Link>
          </div>
        </aside>

        <section className="profile-side-panel">
          <article className="profile-edit-card">
            <h2>Edit Profile</h2>
            <form className="form" onSubmit={updateProfile}>
              <input
                className="input"
                name="name"
                defaultValue={user?.name ?? ""}
                placeholder="Nama lengkap"
                required
              />
              <input
                className="input"
                name="avatarUrl"
                defaultValue={user?.avatarUrl ?? ""}
                placeholder="URL avatar (https://...)"
              />
              <button className="btn primary" type="submit" disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Profil"}
              </button>
            </form>
            {error ? <p className="profile-error">{error}</p> : null}
          </article>

          <article className="profile-course-panel">
            <div className="profile-section-head">
              <h2>Ongoing Classes</h2>
              <Link href="/dashboard">See All</Link>
            </div>
            <div className="profile-course-list">
              {courses.length === 0 ? (
                <article className="profile-course-card">
                  <p>Belum ada kelas berjalan.</p>
                </article>
              ) : (
                courses.slice(0, 6).map((course) => (
                  <article className="profile-course-card" key={course.id}>
                    <div className="profile-course-cover">
                      {course.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={course.thumbnailUrl} alt={course.title} />
                      ) : (
                        <span>Course</span>
                      )}
                    </div>
                    <div className="profile-course-meta">
                      <p className="profile-course-title">{course.title}</p>
                      <div className="profile-progress-row">
                        <div className="profile-progress-track">
                          <div
                            className="profile-progress-fill"
                            style={{ width: `${course.progress ?? 0}%` }}
                          />
                        </div>
                        <span>{course.progress ?? 0}%</span>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import { TopNav } from "@/components/TopNav";

type Course = {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string;
  previewVideoUrl: string;
  price: number;
  status: "draft" | "published";
};

type AnalyticsItem = {
  courseId: number;
  title: string;
  enrollments: number;
  avgProgress: number;
};

export default function AdminPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsItem[]>([]);
  const [enrollments, setEnrollments] = useState<
    Array<{
      enrollmentId: number;
      user: { name: string };
      course: { title: string };
      progress: number;
    }>
  >([]);
  const [message, setMessage] = useState("");

  async function load(): Promise<void> {
    const me = await fetch("/api/me");
    if (!me.ok) {
      window.location.href = "/login";
      return;
    }
    const mePayload = await me.json();
    if (mePayload?.user?.role !== "admin") {
      window.location.href = "/dashboard";
      return;
    }

    const courseRes = await fetch("/api/courses?role=admin");
    const coursePayload = await courseRes.json();
    setCourses(coursePayload.courses ?? []);

    const analyticRes = await fetch("/api/admin/analytics");
    if (analyticRes.ok) {
      const analyticPayload = await analyticRes.json();
      setAnalytics(analyticPayload.byCourse ?? []);
    }

    const enrollmentRes = await fetch("/api/admin/enrollments");
    if (enrollmentRes.ok) {
      const enrollmentPayload = await enrollmentRes.json();
      setEnrollments(enrollmentPayload.enrollments ?? []);
    }
  }

  useEffect(() => {
    load().catch(() => setMessage("Gagal memuat admin dashboard."));
  }, []);

  async function createCourse(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const payload = {
      title: String(fd.get("title") ?? ""),
      slug: String(fd.get("slug") ?? ""),
      description: String(fd.get("description") ?? ""),
      thumbnailUrl: String(fd.get("thumbnailUrl") ?? ""),
      previewVideoUrl: String(fd.get("previewVideoUrl") ?? ""),
      price: Number(fd.get("price") ?? 0),
      status: String(fd.get("status") ?? "draft"),
    };

    const response = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(result?.error ?? "Gagal buat course.");
      return;
    }
    setMessage("Course berhasil dibuat.");
    event.currentTarget.reset();
    await load();
  }

  async function createChapter(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const courseId = Number(fd.get("courseId"));
    const payload = {
      title: String(fd.get("title") ?? ""),
      orderIndex: Number(fd.get("orderIndex") ?? 0),
    };
    const response = await fetch(`/api/admin/courses/${courseId}/chapters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => null);
    setMessage(
      response.ok
        ? "Chapter berhasil dibuat."
        : (result?.error ?? "Gagal buat chapter."),
    );
  }

  async function updateCourse(
    event: FormEvent<HTMLFormElement>,
    courseId: number,
  ): Promise<void> {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const payload = {
      title: String(fd.get("title") ?? ""),
      slug: String(fd.get("slug") ?? ""),
      description: String(fd.get("description") ?? ""),
      thumbnailUrl: String(fd.get("thumbnailUrl") ?? ""),
      previewVideoUrl: String(fd.get("previewVideoUrl") ?? ""),
      price: Number(fd.get("price") ?? 0),
      status: String(fd.get("status") ?? "draft"),
    };

    const response = await fetch(`/api/courses/${courseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => null);
    setMessage(
      response.ok
        ? "Course berhasil diperbarui."
        : (result?.error ?? "Gagal update course."),
    );
    if (response.ok) await load();
  }

  async function createMaterial(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const chapterId = Number(fd.get("chapterId"));
    const payload = {
      title: String(fd.get("title") ?? ""),
      type: String(fd.get("type") ?? "text"),
      body: String(fd.get("body") ?? ""),
      videoUrl: String(fd.get("videoUrl") ?? ""),
      assetUrl: String(fd.get("assetUrl") ?? ""),
      orderIndex: Number(fd.get("orderIndex") ?? 0),
    };
    const response = await fetch(`/api/admin/chapters/${chapterId}/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => null);
    setMessage(
      response.ok
        ? "Material berhasil dibuat."
        : (result?.error ?? "Gagal buat material."),
    );
  }

  async function uploadMedia(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/media/upload", {
      method: "POST",
      body: fd,
    });
    const result = await response.json().catch(() => null);
    setMessage(
      response.ok
        ? `Media URL: ${result?.asset?.fileUrl ?? "-"}`
        : (result?.error ?? "Gagal simpan media."),
    );
  }

  return (
    <main>
      <TopNav role="admin" />
      <section className="container">
        <h1>Admin Dashboard (CMS)</h1>
        <p>Kelola course, syllabus, media, dan monitoring progres peserta.</p>
        {message ? <p style={{ color: "#0a6f4e" }}>{message}</p> : null}
      </section>

      <section
        className="container course-grid"
        style={{ alignItems: "start", paddingBottom: 50 }}
      >
        <article className="card">
          <h2>Buat Course</h2>
          <form className="form" onSubmit={createCourse}>
            <input
              className="input"
              name="title"
              placeholder="Judul course"
              required
            />
            <input
              className="input"
              name="slug"
              placeholder="Slug, contoh: lkpd-interaktif"
              required
            />
            <textarea
              className="textarea"
              name="description"
              placeholder="Deskripsi singkat"
              required
            />
            <input
              className="input"
              name="thumbnailUrl"
              placeholder="https://minio/thumbnail.jpg"
            />
            <input
              className="input"
              name="previewVideoUrl"
              placeholder="https://minio/preview.mp4"
            />
            <input
              className="input"
              name="price"
              type="number"
              min={0}
              defaultValue={0}
            />
            <select className="select" name="status" defaultValue="draft">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <button className="btn primary" type="submit">
              Simpan Course
            </button>
          </form>
        </article>

        <article className="card">
          <h2>Tambah Chapter</h2>
          <form className="form" onSubmit={createChapter}>
            <input
              className="input"
              name="courseId"
              type="number"
              placeholder="Course ID"
              required
            />
            <input
              className="input"
              name="title"
              placeholder="Judul chapter"
              required
            />
            <input
              className="input"
              name="orderIndex"
              type="number"
              min={0}
              defaultValue={0}
            />
            <button className="btn" type="submit">
              Simpan Chapter
            </button>
          </form>
        </article>

        <article className="card">
          <h2>Tambah Material</h2>
          <form className="form" onSubmit={createMaterial}>
            <input
              className="input"
              name="chapterId"
              type="number"
              placeholder="Chapter ID"
              required
            />
            <input
              className="input"
              name="title"
              placeholder="Judul material"
              required
            />
            <select className="select" name="type" defaultValue="text">
              <option value="text">Text</option>
              <option value="video">Video</option>
              <option value="pdf">PDF</option>
              <option value="quiz">Quiz</option>
              <option value="assignment">Assignment</option>
            </select>
            <textarea
              className="textarea"
              name="body"
              placeholder="Konten teks/instruksi"
            />
            <input
              className="input"
              name="videoUrl"
              placeholder="URL video MinIO"
            />
            <input
              className="input"
              name="assetUrl"
              placeholder="URL PDF/asset MinIO"
            />
            <input
              className="input"
              name="orderIndex"
              type="number"
              min={0}
              defaultValue={0}
            />
            <button className="btn" type="submit">
              Simpan Material
            </button>
          </form>
        </article>

        <article className="card">
          <h2>Upload Media (Metadata)</h2>
          <form
            className="form"
            onSubmit={uploadMedia}
            encType="multipart/form-data"
          >
            <select className="select" name="kind" defaultValue="video">
              <option value="video">Video</option>
              <option value="thumbnail">Thumbnail</option>
              <option value="pdf">PDF</option>
              <option value="template">Template</option>
            </select>
            <input className="input" name="bucket" defaultValue="ai-guru" />
            <input className="input" name="file" type="file" required />
            <button className="btn" type="submit">
              Upload ke MinIO
            </button>
          </form>
        </article>
      </section>

      <section className="container" style={{ paddingBottom: 20 }}>
        <h2>Daftar Course</h2>
        <div className="course-grid">
          {courses.map((course) => (
            <article className="card" key={course.id}>
              <span className="pill">ID {course.id}</span>
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              <p>Status: {course.status}</p>
              <form
                className="form"
                onSubmit={(event) => updateCourse(event, course.id)}
              >
                <input
                  className="input"
                  name="title"
                  defaultValue={course.title}
                  placeholder="Judul course"
                  required
                />
                <input
                  className="input"
                  name="slug"
                  defaultValue={course.slug}
                  placeholder="Slug course"
                  required
                />
                <textarea
                  className="textarea"
                  name="description"
                  defaultValue={course.description}
                  placeholder="Deskripsi course"
                  required
                />
                <input
                  className="input"
                  name="thumbnailUrl"
                  defaultValue={course.thumbnailUrl}
                  placeholder="URL/path thumbnail"
                />
                <input
                  className="input"
                  name="previewVideoUrl"
                  defaultValue={course.previewVideoUrl}
                  placeholder="URL/path preview video"
                />
                <input
                  className="input"
                  name="price"
                  type="number"
                  min={0}
                  defaultValue={course.price}
                />
                <select
                  className="select"
                  name="status"
                  defaultValue={course.status}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
                <button className="btn" type="submit">
                  Update Course
                </button>
              </form>
            </article>
          ))}
        </div>
      </section>

      <section className="container course-grid" style={{ paddingBottom: 50 }}>
        <article className="card">
          <h2>Analytics per Course</h2>
          {analytics.map((item) => (
            <p key={item.courseId}>
              <strong>{item.title}</strong> | Enroll: {item.enrollments} | Avg
              Progress: {item.avgProgress}%
            </p>
          ))}
        </article>
        <article className="card">
          <h2>Enrollment Tracking</h2>
          {enrollments.map((item) => (
            <p key={item.enrollmentId}>
              {item.user.name} - {item.course.title} ({item.progress}%)
            </p>
          ))}
        </article>
      </section>
    </main>
  );
}

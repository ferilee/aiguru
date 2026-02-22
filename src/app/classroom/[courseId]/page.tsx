"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { TopNav } from "@/components/TopNav";

type Option = {
  id: number;
  optionText: string;
};

type Quiz = {
  id: number;
  question: string;
  options: Option[];
};

type Assignment = {
  id: number;
  instruction: string;
};

type Material = {
  id: number;
  title: string;
  type: "video" | "text" | "pdf" | "quiz" | "assignment";
  body: string;
  videoUrl: string;
  assetUrl: string;
  completed: boolean;
  quiz?: Quiz;
  assignment?: Assignment;
};

type Chapter = {
  id: number;
  title: string;
  materials: Material[];
};

type LearningPayload = {
  course: { id: number; title: string; description: string };
  chapters: Chapter[];
  progress: number;
};

export default function ClassroomPage() {
  const params = useParams<{ courseId: string }>();
  const [courseId, setCourseId] = useState<number>(0);
  const [data, setData] = useState<LearningPayload | null>(null);
  const [activeMaterialId, setActiveMaterialId] = useState<number | null>(null);
  const [assignmentUrl, setAssignmentUrl] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (params?.courseId) setCourseId(Number(params.courseId));
  }, [params]);

  async function load(): Promise<void> {
    if (!courseId) return;
    const response = await fetch(`/api/learning/${courseId}`);
    if (!response.ok) {
      window.location.href = "/dashboard";
      return;
    }
    const payload = await response.json();
    setData(payload);

    const firstMaterial = payload.chapters?.flatMap(
      (ch: Chapter) => ch.materials,
    )?.[0];
    if (firstMaterial && !activeMaterialId)
      setActiveMaterialId(firstMaterial.id);
  }

  useEffect(() => {
    load().catch(() => setMessage("Gagal memuat kelas."));
  }, [courseId]);

  const activeMaterial = useMemo(() => {
    if (!data || !activeMaterialId) return null;
    for (const chapter of data.chapters) {
      const found = chapter.materials.find(
        (material) => material.id === activeMaterialId,
      );
      if (found) return found;
    }
    return null;
  }, [data, activeMaterialId]);

  async function markComplete(): Promise<void> {
    if (!activeMaterial) return;
    const response = await fetch(
      `/api/materials/${activeMaterial.id}/complete`,
      {
        method: "POST",
      },
    );
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(payload?.error ?? "Gagal menyimpan progres.");
      return;
    }
    setMessage(
      payload?.certificateUrl
        ? `Progress ${payload.progress}%. Sertifikat siap: ${payload.certificateUrl}`
        : `Progress ${payload.progress}% berhasil disimpan.`,
    );
    await load();
  }

  async function submitQuiz(
    quizId: number,
    selectedOptionId: number,
  ): Promise<void> {
    const response = await fetch(`/api/quizzes/${quizId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedOptionId }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(payload?.error ?? "Quiz gagal dikirim.");
      return;
    }
    setMessage(payload?.correct ? "Jawaban benar." : "Jawaban belum tepat.");
  }

  async function submitAssignment(assignmentId: number): Promise<void> {
    const response = await fetch(`/api/assignments/${assignmentId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionUrl: assignmentUrl }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(payload?.error ?? "Tugas gagal dikirim.");
      return;
    }
    setMessage("Link tugas berhasil dikirim.");
  }

  return (
    <main>
      <TopNav />
      <section className="container">
        <h1>{data?.course.title ?? "Classroom"}</h1>
        <p>{data?.course.description ?? "Memuat data..."}</p>
        <div className="progress-wrap">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>Progress Belajar</strong>
            <span>{data?.progress ?? 0}%</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-bar"
              style={{ width: `${data?.progress ?? 0}%` }}
            />
          </div>
        </div>
      </section>

      <section className="container layout-main" style={{ paddingBottom: 40 }}>
        <aside className="sidebar card">
          <h3>Materi</h3>
          {data?.chapters.map((chapter) => (
            <div key={chapter.id}>
              <p className="mono">{chapter.title}</p>
              {chapter.materials.map((material) => (
                <button
                  key={material.id}
                  type="button"
                  className={`material-item ${activeMaterialId === material.id ? "active" : ""}`}
                  onClick={() => setActiveMaterialId(material.id)}
                >
                  {material.title} {material.completed ? "✓" : ""}
                </button>
              ))}
            </div>
          ))}
        </aside>

        <article className="card">
          {!activeMaterial ? (
            <p>Pilih materi dari sisi kiri.</p>
          ) : (
            <>
              <h2>{activeMaterial.title}</h2>
              {activeMaterial.type === "video" && activeMaterial.videoUrl ? (
                <video
                  controls
                  playsInline
                  src={activeMaterial.videoUrl}
                  style={{ width: "100%", borderRadius: 12 }}
                />
              ) : null}
              {activeMaterial.type === "text" ? (
                <p>{activeMaterial.body}</p>
              ) : null}
              {activeMaterial.type === "pdf" && activeMaterial.assetUrl ? (
                <iframe
                  src={activeMaterial.assetUrl}
                  style={{
                    width: "100%",
                    height: 520,
                    border: "1px solid var(--line)",
                  }}
                  title="PDF Material"
                />
              ) : null}

              {activeMaterial.type === "quiz" && activeMaterial.quiz ? (
                <div>
                  <p>{activeMaterial.quiz.question}</p>
                  {activeMaterial.quiz.options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className="material-item"
                      onClick={() =>
                        submitQuiz(activeMaterial.quiz!.id, option.id)
                      }
                    >
                      {option.optionText}
                    </button>
                  ))}
                </div>
              ) : null}

              {activeMaterial.type === "assignment" &&
              activeMaterial.assignment ? (
                <div className="form">
                  <p>{activeMaterial.assignment.instruction}</p>
                  <input
                    className="input"
                    placeholder="Tempel link project Anda (Google Drive/Figma/dll)"
                    value={assignmentUrl}
                    onChange={(event) => setAssignmentUrl(event.target.value)}
                  />
                  <button
                    type="button"
                    className="btn"
                    onClick={() =>
                      submitAssignment(activeMaterial.assignment!.id)
                    }
                  >
                    Kirim Tugas
                  </button>
                </div>
              ) : null}

              <button
                className="btn primary"
                style={{ marginTop: 14 }}
                onClick={markComplete}
              >
                Mark as Complete
              </button>
            </>
          )}
          {message ? <p style={{ color: "#0a6f4e" }}>{message}</p> : null}
        </article>
      </section>
    </main>
  );
}

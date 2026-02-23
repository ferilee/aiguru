"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const isGoogleAuthEnabled =
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED !== "false";
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "Registrasi gagal");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <div className="card" style={{ maxWidth: 460, margin: "0 auto" }}>
        <h1>Daftar Akun Guru</h1>
        <p>Buat akun peserta untuk mengakses kelas AIGURU.</p>
        <form className="form" onSubmit={handleSubmit}>
          <input
            className="input"
            type="text"
            name="name"
            placeholder="Nama lengkap"
            required
          />
          <input
            className="input"
            type="email"
            name="email"
            placeholder="Email aktif"
            required
          />
          <input
            className="input"
            type="password"
            name="password"
            minLength={8}
            placeholder="Password minimal 8 karakter"
            required
          />
          {error ? <p style={{ color: "#8f1d1d" }}>{error}</p> : null}
          <button className="btn primary" disabled={loading} type="submit">
            {loading ? "Memproses..." : "Daftar"}
          </button>
          {isGoogleAuthEnabled ? (
            <a href="/api/auth/google/start" className="btn">
              Daftar dengan Google
            </a>
          ) : null}
        </form>
        <p>
          Sudah punya akun? <Link href="/login">Login</Link>
        </p>
      </div>
    </main>
  );
}

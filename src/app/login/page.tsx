"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [oauthError, setOauthError] = useState("");

  useEffect(() => {
    const message = new URLSearchParams(window.location.search).get("error");
    if (message) setOauthError(message);
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "Login gagal");
      setLoading(false);
      return;
    }

    const payload = await response.json();
    router.push(payload?.user?.role === "admin" ? "/admin" : "/dashboard");
    router.refresh();
  }

  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <div className="card" style={{ maxWidth: 440, margin: "0 auto" }}>
        <h1>Login</h1>
        <p>Masuk untuk melanjutkan pembelajaran.</p>
        <form className="form" onSubmit={handleSubmit}>
          <input
            className="input"
            type="email"
            name="email"
            placeholder="Email"
            required
          />
          <input
            className="input"
            type="password"
            name="password"
            placeholder="Password"
            minLength={8}
            required
          />
          {error ? <p style={{ color: "#8f1d1d" }}>{error}</p> : null}
          <button className="btn primary" disabled={loading} type="submit">
            {loading ? "Memproses..." : "Login"}
          </button>
          <a href="/api/auth/google/start" className="btn">
            Login dengan Google
          </a>
        </form>
        <p>
          Belum punya akun? <Link href="/register">Daftar</Link>
        </p>
        {oauthError ? <p style={{ color: "#8f1d1d" }}>{oauthError}</p> : null}
      </div>
    </main>
  );
}

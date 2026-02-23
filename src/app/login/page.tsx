"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

export default function LoginPage() {
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
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "Login gagal");
      setLoading(false);
      return;
    }

    const payload = await response.json().catch(() => null);
    const target = payload?.user?.role === "admin" ? "/admin" : "/dashboard";

    // Gunakan full-page navigation agar cookie sesi pasti terbaca saat buka halaman tujuan.
    window.location.assign(target);
  }

  return (
    <main className="login-page">
      <header className="login-top-bar">
        <div className="container login-brand-wrap">
          <img
            className="login-brand-image"
            src="/logo.png"
            alt="AIGURU"
            width={340}
            height={88}
          />
        </div>
      </header>
      <section className="container login-content">
        <div className="login-form-wrap">
          <h1 className="login-title">Enter your info to sign in</h1>
          <p className="login-subtitle">Or get started with a new account.</p>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <input
                className="login-input"
                id="login-email"
                type="email"
                name="email"
                placeholder=" "
                autoComplete="email"
                required
              />
              <label className="login-label" htmlFor="login-email">
                Email or mobile number
              </label>
            </div>
            <div className="login-field">
              <input
                className="login-input"
                id="login-password"
                type="password"
                name="password"
                placeholder=" "
                autoComplete="current-password"
                minLength={8}
                required
              />
              <label className="login-label" htmlFor="login-password">
                Password
              </label>
            </div>
            {error ? <p className="login-error">{error}</p> : null}
            <button className="login-submit" disabled={loading} type="submit">
              {loading ? "Memproses..." : "Continue"}
            </button>
          </form>
          <a
            href="/api/auth/google/start"
            className="login-google-btn"
            aria-label="Login dengan Google"
            title="Login dengan Google"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="login-google-icon"
            >
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.2-1.9 2.9v2.4h3.1c1.8-1.6 2.8-4 2.8-6.8 0-.7-.1-1.3-.2-1.9H12z"
              />
              <path
                fill="#34A853"
                d="M12 22c2.5 0 4.6-.8 6.1-2.2l-3.1-2.4c-.9.6-2 .9-3 .9-2.3 0-4.2-1.5-4.9-3.6H3.9v2.5C5.4 20 8.4 22 12 22z"
              />
              <path
                fill="#4A90E2"
                d="M7.1 14.7c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V8.4H3.9C3.3 9.6 3 11 3 12.8s.3 3.2.9 4.4l3.2-2.5z"
              />
              <path
                fill="#FBBC05"
                d="M12 7.3c1.3 0 2.5.4 3.4 1.3l2.6-2.6C16.6 4.7 14.5 4 12 4 8.4 4 5.4 6 3.9 8.4l3.2 2.5c.7-2.1 2.6-3.6 4.9-3.6z"
              />
            </svg>
            <span>Login dengan Google</span>
          </a>
          <p className="login-register">
            Belum punya akun? <Link href="/register">Daftar</Link>
          </p>
          {oauthError ? <p className="login-error">{oauthError}</p> : null}
        </div>
      </section>
      <footer className="login-footer">
        <div className="container">
          Hubungi pengembang untuk kendala teknis login
        </div>
      </footer>
    </main>
  );
}

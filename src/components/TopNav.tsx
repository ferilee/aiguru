"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type TopNavProps = {
  role?: "participant" | "admin";
};

export function TopNav({ role }: TopNavProps) {
  const router = useRouter();

  async function handleLogout(): Promise<void> {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="container topbar">
      <Link href="/" className="brand">
        AIGURU
      </Link>
      <nav className="nav">
        <Link href="/dashboard" className="btn">
          Dashboard
        </Link>
        <Link href="/profile" className="btn">
          Profile
        </Link>
        {role === "admin" ? (
          <Link href="/admin" className="btn">
            Admin CMS
          </Link>
        ) : null}
        <button onClick={handleLogout} className="btn warn" type="button">
          Logout
        </button>
      </nav>
    </header>
  );
}

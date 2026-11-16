"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/admin/login/login.module.css";

export default function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: data.get("username"), password: data.get("password") }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "შესვლა ვერ მოხერხდა.");
      router.replace("/admin"); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "შესვლა ვერ მოხერხდა."); }
    finally { setLoading(false); }
  }

  return (
    <form className={styles.form} onSubmit={submit} aria-busy={loading}>
      <label htmlFor="admin-username">მომხმარებელი</label>
      <input id="admin-username" name="username" autoComplete="username" required />

      <label htmlFor="admin-password">პაროლი</label>
      <div className={styles.passwordRow}>
        <input id="admin-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required />
        <button type="button" className={styles.reveal} aria-label="პაროლის ჩვენება" aria-pressed={showPassword} onClick={() => setShowPassword((show) => !show)}>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
            <circle cx="12" cy="12" r="2.5" />
            {showPassword && <path d="m4 4 16 16" />}
          </svg>
        </button>
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button type="submit" className={styles.submit} disabled={loading}>
        {loading ? "მოწმდება…" : "შესვლა"}
        {loading ? <span className={styles.spinner} aria-hidden="true" /> : <span aria-hidden="true">↗</span>}
      </button>
    </form>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError("");
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
    <form onSubmit={submit}>
      <label className="field"><span>მომხმარებელი</span><input name="username" autoComplete="username" required /></label>
      <label className="field"><span>პაროლი</span><input name="password" type="password" autoComplete="current-password" required /></label>
      {error && <div className="form-error">{error}</div>}
      <button className="button button-primary submit-button" disabled={loading}>{loading ? "მოწმდება..." : "შესვლა"}</button>
    </form>
  );
}

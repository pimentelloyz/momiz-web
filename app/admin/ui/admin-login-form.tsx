"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./admin.module.css";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/admin/api/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    const result = await response.json().catch(() => ({})) as { message?: string };
    setLoading(false);
    if (!response.ok) return setError(result.message || "Não foi possível entrar.");
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <label>E-mail<input name="email" type="email" autoComplete="username" required /></label>
      <label>Senha<input name="password" type="password" autoComplete="current-password" required /></label>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button className={styles.primaryButton} disabled={loading}>{loading ? "Validando…" : "Entrar"}</button>
    </form>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { getApps, initializeApp } from "@firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from "@firebase/auth";
import { useRouter } from "next/navigation";
import styles from "./admin.module.css";

type FirebaseClientConfig = {
  apiKey: string;
  projectId: string;
  authDomain: string;
};

type Props = {
  firebaseConfig: FirebaseClientConfig | null;
};

type LoginMethod = "password" | "google";

const firebaseAppName = "momiz-admin";

function socialLoginError(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";
  if (code === "auth/popup-closed-by-user") return "Login com Google cancelado.";
  if (code === "auth/popup-blocked") return "Permita pop-ups para entrar com Google.";
  if (code === "auth/unauthorized-domain") {
    return "Este domínio ainda não está autorizado no Firebase Authentication.";
  }
  return "Não foi possível entrar com Google.";
}

export function AdminLoginForm({ firebaseConfig }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<LoginMethod | null>(null);

  async function createSession(payload: { email: FormDataEntryValue | null; password: FormDataEntryValue | null } | { idToken: string }) {
    const response = await fetch("/admin/api/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({})) as { message?: string };
    if (!response.ok) throw new Error(result.message || "Não foi possível entrar.");
    router.replace("/admin");
    router.refresh();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading("password");
    const form = new FormData(event.currentTarget);
    try {
      await createSession({
        email: form.get("email"),
        password: form.get("password"),
      });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Não foi possível entrar.");
    } finally {
      setLoading(null);
    }
  }

  async function signInWithGoogle() {
    setError("");
    if (!firebaseConfig) {
      setError("Login com Google não configurado neste ambiente.");
      return;
    }
    setLoading("google");
    try {
      const existingApp = getApps().find((app) => app.name === firebaseAppName);
      const app = existingApp ?? initializeApp(firebaseConfig, firebaseAppName);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(getAuth(app), provider);
      await createSession({ idToken: await credential.user.getIdToken() });
    } catch (loginError) {
      setError(
        loginError instanceof Error && !loginError.message.startsWith("Firebase:")
          ? loginError.message
          : socialLoginError(loginError),
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <button
        className={styles.googleButton}
        disabled={loading !== null || !firebaseConfig}
        onClick={signInWithGoogle}
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path fill="#4285f4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.3Z" />
          <path fill="#34a853" d="M12 22c2.7 0 5-.9 6.6-2.5L15.4 17c-.9.6-2 1-3.4 1a5.8 5.8 0 0 1-5.5-4H3.2v2.6A10 10 0 0 0 12 22Z" />
          <path fill="#fbbc05" d="M6.5 14a6 6 0 0 1 0-3.9V7.5H3.2a10 10 0 0 0 0 9.1L6.5 14Z" />
          <path fill="#ea4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 3.2 7.5l3.3 2.6A5.8 5.8 0 0 1 12 6.1Z" />
        </svg>
        {loading === "google" ? "Conectando…" : "Entrar com Google"}
      </button>
      <div className={styles.loginDivider}><span>ou use e-mail e senha</span></div>
      <label>E-mail<input name="email" type="email" autoComplete="username" required /></label>
      <label>Senha<input name="password" type="password" autoComplete="current-password" required /></label>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button className={styles.primaryButton} disabled={loading !== null}>{loading === "password" ? "Validando…" : "Entrar"}</button>
    </form>
  );
}

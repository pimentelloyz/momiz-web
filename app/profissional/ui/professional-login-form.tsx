"use client";

import { FormEvent, useState } from "react";
import { getApps, initializeApp } from "@firebase/app";
import {
  Auth,
  getAuth,
  getMultiFactorResolver,
  GoogleAuthProvider,
  MultiFactorError,
  MultiFactorResolver,
  signInWithEmailAndPassword,
  signInWithPopup,
  TotpMultiFactorGenerator,
} from "@firebase/auth";
import { useRouter } from "next/navigation";
import styles from "./professional.module.css";

type FirebaseClientConfig = { apiKey: string; projectId: string; authDomain: string };
type Props = { firebaseConfig: FirebaseClientConfig | null };
type LoginMethod = "password" | "google";

const firebaseAppName = "momiz-professional";

function firebaseErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : "";
}

function socialLoginError(error: unknown) {
  const code = firebaseErrorCode(error);
  if (code === "auth/popup-closed-by-user") return "Login com Google cancelado.";
  if (code === "auth/popup-blocked") return "Permita pop-ups para entrar com Google.";
  if (code === "auth/unauthorized-domain") return "Este domínio ainda não está autorizado no Firebase.";
  return "Não foi possível entrar com Google.";
}

export function ProfessionalLoginForm({ firebaseConfig }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<LoginMethod | null>(null);
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);

  function clientAuth(): Auth {
    if (!firebaseConfig) throw new Error("Autenticação profissional não configurada neste ambiente.");
    const existingApp = getApps().find((app) => app.name === firebaseAppName);
    return getAuth(existingApp ?? initializeApp(firebaseConfig, firebaseAppName));
  }

  function captureMfaChallenge(auth: Auth, loginError: unknown) {
    if (firebaseErrorCode(loginError) !== "auth/multi-factor-auth-required") return false;
    const resolver = getMultiFactorResolver(auth, loginError as MultiFactorError);
    if (!resolver.hints.some((hint) => hint.factorId === TotpMultiFactorGenerator.FACTOR_ID)) {
      setError("O segundo fator cadastrado não é compatível com este portal.");
      return true;
    }
    setMfaResolver(resolver);
    setError("");
    return true;
  }

  async function createSession(idToken: string) {
    const response = await fetch("/profissional/api/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    const result = await response.json().catch(() => ({})) as { message?: string };
    if (!response.ok) throw new Error(result.message || "Não foi possível entrar.");
    router.replace("/profissional");
    router.refresh();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading("password");
    const form = new FormData(event.currentTarget);
    try {
      const auth = clientAuth();
      const credential = await signInWithEmailAndPassword(
        auth,
        String(form.get("email") || "").trim(),
        String(form.get("password") || ""),
      );
      await createSession(await credential.user.getIdToken());
    } catch (loginError) {
      const auth = firebaseConfig ? clientAuth() : null;
      if (auth && captureMfaChallenge(auth, loginError)) return;
      setError(
        firebaseErrorCode(loginError).startsWith("auth/")
          ? "E-mail ou senha inválidos."
          : loginError instanceof Error ? loginError.message : "Não foi possível entrar.",
      );
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
      const auth = clientAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(auth, provider);
      await createSession(await credential.user.getIdToken());
    } catch (loginError) {
      const auth = clientAuth();
      if (captureMfaChallenge(auth, loginError)) return;
      setError(
        loginError instanceof Error && !loginError.message.startsWith("Firebase:")
          ? loginError.message
          : socialLoginError(loginError),
      );
    } finally {
      setLoading(null);
    }
  }

  async function confirmMfa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mfaResolver) return;
    setError("");
    setLoading("password");
    const code = String(new FormData(event.currentTarget).get("mfaCode") || "").replace(/\D/g, "");
    const hint = mfaResolver.hints.find((item) => item.factorId === TotpMultiFactorGenerator.FACTOR_ID);
    try {
      if (!hint || code.length !== 6) throw new Error("Informe o código de 6 dígitos do autenticador.");
      const assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, code);
      const credential = await mfaResolver.resolveSignIn(assertion);
      await createSession(await credential.user.getIdToken());
    } catch (mfaError) {
      setError(
        firebaseErrorCode(mfaError).startsWith("auth/")
          ? "Código inválido ou expirado. Gere um novo código e tente novamente."
          : mfaError instanceof Error ? mfaError.message : "Não foi possível confirmar o segundo fator.",
      );
    } finally {
      setLoading(null);
    }
  }

  if (mfaResolver) {
    return (
      <form className={styles.form} onSubmit={confirmMfa}>
        <div className={styles.securityNotice} role="status">
          <strong>Confirme sua identidade</strong>
          <span>Abra o aplicativo autenticador e informe o código temporário.</span>
        </div>
        <label>
          Código de segurança
          <input autoComplete="one-time-code" autoFocus inputMode="numeric" maxLength={6} name="mfaCode" pattern="[0-9]{6}" required />
        </label>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button className={styles.primaryButton} disabled={loading !== null}>
          {loading ? "Confirmando…" : "Confirmar e entrar"}
        </button>
        <button className={styles.secondaryButton} disabled={loading !== null} onClick={() => setMfaResolver(null)} type="button">
          Voltar
        </button>
      </form>
    );
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <button className={styles.googleButton} disabled={loading !== null || !firebaseConfig} onClick={signInWithGoogle} type="button">
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
      <button className={styles.primaryButton} disabled={loading !== null || !firebaseConfig}>
        {loading === "password" ? "Validando…" : "Entrar"}
      </button>
    </form>
  );
}

import Image from "next/image";
import { redirect } from "next/navigation";
import { hasProfessionalSession } from "../../../lib/professional/professional-session";
import { ProfessionalLoginForm } from "../ui/professional-login-form";
import styles from "../ui/professional.module.css";

function safeReturnTo(value?: string | string[]) {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate && /^\/profissional(?:\?clinicInvite=[A-Za-z0-9_%=-]{32,180})?$/.test(candidate)
    ? candidate
    : "/profissional";
}

export default async function ProfessionalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const returnTo = safeReturnTo((await searchParams).returnTo);
  if (await hasProfessionalSession()) redirect(returnTo);
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const firebaseConfig = apiKey && projectId
    ? {
        apiKey,
        projectId,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
      }
    : null;

  return (
    <div className={styles.loginPage}>
      <section className={styles.loginCard}>
        <Image
          className={styles.loginLogo}
          src="/brand/momiz-logo-horizontal.png"
          alt="Momiz"
          width={1600}
          height={533}
          priority
        />
        <span className={styles.kicker}>Portal de cuidado</span>
        <h1>Acesso profissional</h1>
        <p>Consulte pacientes e compromissos autorizados por cada paciente.</p>
        <ProfessionalLoginForm firebaseConfig={firebaseConfig} returnTo={returnTo} />
      </section>
    </div>
  );
}

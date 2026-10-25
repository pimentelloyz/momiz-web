import Image from "next/image";
import { redirect } from "next/navigation";
import { hasProfessionalSession } from "../../../lib/professional/professional-session";
import { ProfessionalLoginForm } from "../ui/professional-login-form";
import styles from "../ui/professional.module.css";

export default async function ProfessionalLoginPage() {
  if (await hasProfessionalSession()) redirect("/profissional");
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
        <ProfessionalLoginForm firebaseConfig={firebaseConfig} />
      </section>
    </div>
  );
}

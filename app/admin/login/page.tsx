import { redirect } from "next/navigation";
import { hasAdminSession } from "../../../lib/admin/admin-session";
import { AdminLoginForm } from "../ui/admin-login-form";
import styles from "../ui/admin.module.css";

export default async function AdminLoginPage() {
  if (await hasAdminSession()) redirect("/admin");
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const firebaseConfig = apiKey && projectId
    ? {
        apiKey,
        projectId,
        authDomain:
          process.env.FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
      }
    : null;
  return (
    <div className={styles.loginPage}>
      <section className={styles.loginCard}>
        <span className={styles.kicker}>Momiz operacional</span>
        <h1>Acesso administrativo</h1>
        <p>Entre com uma conta Firebase autorizada na allowlist da API.</p>
        <AdminLoginForm firebaseConfig={firebaseConfig} />
      </section>
    </div>
  );
}

import { redirect } from "next/navigation";
import { hasAdminSession } from "../../../lib/admin/admin-session";
import { AdminLoginForm } from "../ui/admin-login-form";
import styles from "../ui/admin.module.css";

export default async function AdminLoginPage() {
  if (await hasAdminSession()) redirect("/admin");
  return (
    <div className={styles.loginPage}>
      <section className={styles.loginCard}>
        <span className={styles.kicker}>Momiz operacional</span>
        <h1>Acesso administrativo</h1>
        <p>Entre com uma conta Firebase autorizada na allowlist da API.</p>
        <AdminLoginForm />
      </section>
    </div>
  );
}

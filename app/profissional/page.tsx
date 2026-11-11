import { redirect } from "next/navigation";
import { hasProfessionalSession } from "../../lib/professional/professional-session";
import { professionalPortalMode, resolveProfessionalFeatureFlags } from "../../lib/professional/professional-feature-flags";
import { ProfessionalDashboard } from "./ui/professional-dashboard";
import { Mt01ProfessionalPortal } from "./ui/mt01-professional-portal";
import styles from "./ui/professional.module.css";

export default async function ProfessionalPage({
  searchParams,
}: {
  searchParams: Promise<{ clinicInvite?: string | string[] }>;
}) {
  if (!(await hasProfessionalSession())) {
    const rawToken = (await searchParams).clinicInvite;
    const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;
    const returnTo = token && /^[A-Za-z0-9_-]{32,128}$/.test(token)
      ? `/profissional?clinicInvite=${encodeURIComponent(token)}`
      : "/profissional";
    redirect(`/profissional/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
  const configuration = resolveProfessionalFeatureFlags();
  if (configuration.issues.length > 0) {
    return (
      <main className={styles.portalPage}>
        <section className={styles.contextCard} role="alert" aria-labelledby="professional-config-title">
          <span className={styles.kicker}>Configuração do portal</span>
          <h1 id="professional-config-title">Portal temporariamente indisponível</h1>
          <p>A combinação de módulos profissionais deste ambiente é inválida.</p>
          <ul>
            {configuration.issues.map((issue) => <li key={`${issue.flag}:${issue.dependency || issue.code}`}>{issue.message}</li>)}
          </ul>
          <p>Nenhum valor de configuração ou dado de usuário foi exibido.</p>
        </section>
      </main>
    );
  }

  const { flags } = configuration;
  return professionalPortalMode(flags) === "contextual"
    ? <Mt01ProfessionalPortal
        enablePatientReader={flags.patientReader}
        enableRelationships={flags.relationships}
        enableDocuments={flags.documents}
        enableAppointments={flags.appointments}
        enableChat={flags.chat}
        enableNotifications={flags.notifications}
        enableNotificationPreferences={flags.notificationPreferences}
        enableLaborEvents={flags.laborEvents}
        enableEntitlements={flags.entitlements}
        enableChatSponsorship={flags.chatSponsorship}
      />
    : <ProfessionalDashboard />;
}

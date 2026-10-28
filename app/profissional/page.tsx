import { redirect } from "next/navigation";
import { hasProfessionalSession } from "../../lib/professional/professional-session";
import { ProfessionalDashboard } from "./ui/professional-dashboard";
import { Mt01ProfessionalPortal } from "./ui/mt01-professional-portal";

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
  return process.env.NEXT_PUBLIC_ENABLE_MT01_CARE_CONTEXTS === "true"
    ? <Mt01ProfessionalPortal
        enablePatientReader={process.env.NEXT_PUBLIC_ENABLE_MT03_PROFESSIONAL_PATIENTS === "true"}
        enableRelationships={process.env.NEXT_PUBLIC_ENABLE_MT02_CARE_RELATIONSHIPS === "true"}
        enableDocuments={process.env.NEXT_PUBLIC_ENABLE_MT04_DOCUMENT_SHARES === "true"}
        enableAppointments={process.env.NEXT_PUBLIC_ENABLE_MT05_APPOINTMENTS === "true"}
        enableChat={process.env.NEXT_PUBLIC_ENABLE_MT06_CARE_CHAT === "true"}
      />
    : <ProfessionalDashboard />;
}

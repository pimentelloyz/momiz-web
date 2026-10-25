import { redirect } from "next/navigation";
import { hasProfessionalSession } from "../../lib/professional/professional-session";
import { ProfessionalDashboard } from "./ui/professional-dashboard";

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
  return <ProfessionalDashboard />;
}

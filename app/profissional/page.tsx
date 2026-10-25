import { redirect } from "next/navigation";
import { hasProfessionalSession } from "../../lib/professional/professional-session";
import { ProfessionalDashboard } from "./ui/professional-dashboard";

export default async function ProfessionalPage() {
  if (!(await hasProfessionalSession())) redirect("/profissional/login");
  return <ProfessionalDashboard />;
}

import type { Metadata } from "next";
import HealthProfessionalTermsPage from "../../../health-professional-terms/page";
import { HEALTH_PROFESSIONAL_TERMS } from "../../../../lib/legal-documents";

export const metadata: Metadata = {
  title: `Termos para profissionais de saúde — versão ${HEALTH_PROFESSIONAL_TERMS.version}`,
  description: "Arquivo auditável dos termos de uso para profissionais de saúde do Momiz.",
  alternates: { canonical: HEALTH_PROFESSIONAL_TERMS.archiveUrl },
  robots: { index: false, follow: true },
};

export default function ArchivedHealthProfessionalTermsPage() {
  return <HealthProfessionalTermsPage />;
}

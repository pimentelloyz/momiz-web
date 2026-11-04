export const HEALTH_PROFESSIONAL_TERMS = {
  id: "health-professional-terms",
  acceptanceId: "professional-terms-v1",
  version: "1.0",
  effectiveDate: "2026-11-04",
  effectiveDateLabel: "4 de novembro de 2026",
  path: "/health-professional-terms",
  canonicalUrl: "https://momiz.com.br/health-professional-terms",
  archivePath: "/legal/health-professional-terms/1.0",
  archiveUrl: "https://momiz.com.br/legal/health-professional-terms/1.0",
  approvalStatus: "PENDING_LEGAL_REVIEW",
} as const;

export const LEGAL_DOCUMENT_HISTORY = [HEALTH_PROFESSIONAL_TERMS] as const;

export const LEGAL_MANIFEST_VERSION = "1" as const;

export function legalDocumentsManifest() {
  return {
    schemaVersion: LEGAL_MANIFEST_VERSION,
    documents: [{
      id: HEALTH_PROFESSIONAL_TERMS.id,
      acceptanceId: HEALTH_PROFESSIONAL_TERMS.acceptanceId,
      documentVersion: HEALTH_PROFESSIONAL_TERMS.version,
      currentVersion: HEALTH_PROFESSIONAL_TERMS.version,
      canonicalUrl: HEALTH_PROFESSIONAL_TERMS.canonicalUrl,
      approvalStatus: HEALTH_PROFESSIONAL_TERMS.approvalStatus,
      versions: LEGAL_DOCUMENT_HISTORY.map((document) => ({
        version: document.version,
        effectiveDate: document.effectiveDate,
        archiveUrl: document.archiveUrl,
      })),
    }],
  };
}

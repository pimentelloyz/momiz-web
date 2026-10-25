"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminApi, jsonRequest } from "./admin-api-client";
import styles from "./admin.module.css";

type VerificationStatus =
  | "DRAFT"
  | "PENDING_VERIFICATION"
  | "NEEDS_CORRECTION"
  | "VERIFIED"
  | "REJECTED"
  | "SUSPENDED"
  | "EXPIRED";

type Credential = {
  id: string;
  type: string;
  registrationNumber: string | null;
  jurisdiction: string | null;
  specialty: string | null;
  issuer: string | null;
  expiresAt: string | null;
  status: string;
  reviewReason: string | null;
  documentFileName: string | null;
  renewalOfCredentialId: string | null;
};

type ProfessionalProfile = {
  id: string;
  primaryProfession: string;
  displayName: string;
  bio: string | null;
  city: string | null;
  state: string | null;
  verificationStatus: VerificationStatus;
  submittedAt: string | null;
  verifiedAt: string | null;
  user: { id: string; name: string; email: string; photoUrl: string | null };
  credentials: Credential[];
  reviewLogs: Array<{
    id: string;
    action: string;
    previousStatus: string | null;
    resultingStatus: string | null;
    reason: string | null;
    createdAt: string;
    actor: { id: string; name: string | null; email: string | null } | null;
  }>;
};

type CommunicationReportStatus = "OPEN" | "RESOLVED" | "DISMISSED";

type CommunicationReport = {
  id: string;
  category: string;
  details: string | null;
  status: CommunicationReportStatus;
  createdAt: string;
  resolvedAt: string | null;
  resolutionNote: string | null;
  patient: { id: string; name: string; email: string | null };
  reporter: { id: string; name: string; email: string | null };
  resolvedBy: { id: string; name: string; email: string | null } | null;
  message: {
    id: string;
    content: string;
    authorUserId: string;
    createdAt: string;
  } | null;
  relationship: {
    id: string;
    status: string;
    communicationBlockedAt: string | null;
    professionalProfile: {
      id: string;
      displayName: string;
      primaryProfession: string;
      user: { id: string; name: string; email: string | null };
    };
  };
};

type PilotGateStatus = "PENDING" | "APPROVED" | "BLOCKED";
type PilotGate = {
  key: string;
  label: string;
  description: string;
  status: PilotGateStatus;
  reason: string | null;
  evidenceReference: string | null;
  decidedAt: string | null;
  decidedBy: { id: string; name: string | null; email: string | null } | null;
  auditLogs: Array<{
    id: string;
    previousStatus: PilotGateStatus;
    resultingStatus: PilotGateStatus;
    reason: string;
    evidenceReference: string | null;
    createdAt: string;
    actor: { id: string; name: string | null; email: string | null } | null;
  }>;
};

type PilotReadiness = {
  ready: boolean;
  advisoryOnly: true;
  rolloutAutomaticallyEnabled: false;
  approvedCount: number;
  requiredCount: number;
  gates: PilotGate[];
};

const statusLabels: Record<VerificationStatus, string> = {
  DRAFT: "Rascunho",
  PENDING_VERIFICATION: "Aguardando análise",
  NEEDS_CORRECTION: "Correção solicitada",
  VERIFIED: "Verificado",
  REJECTED: "Rejeitado",
  SUSPENDED: "Suspenso",
  EXPIRED: "Expirado",
};

const professionLabels: Record<string, string> = {
  OBSTETRICIAN: "Médica obstetra",
  DOULA: "Doula",
  OBSTETRIC_NURSE: "Enfermeira obstetra",
  PELVIC_PHYSIOTHERAPIST: "Fisioterapeuta pélvica",
};

const reportCategoryLabels: Record<string, string> = {
  HARASSMENT: "Assédio ou intimidação",
  INAPPROPRIATE_CONTENT: "Conteúdo inadequado",
  PRIVACY_CONCERN: "Privacidade ou uso indevido de dados",
  PROFESSIONAL_CONDUCT: "Conduta profissional",
  SPAM: "Spam ou abordagem comercial",
  OTHER: "Outro motivo",
};

function formatDate(value: string | null) {
  if (!value) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ProfessionalCareReviewPanel({
  onMessage,
  onSessionExpired,
}: {
  onMessage: (message: string) => void;
  onSessionExpired: () => void;
}) {
  const [status, setStatus] = useState<VerificationStatus>("PENDING_VERIFICATION");
  const [profiles, setProfiles] = useState<ProfessionalProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [openingCredential, setOpeningCredential] = useState<string | null>(null);
  const [operations, setOperations] = useState({
    active: 0,
    paused: 0,
    expiring: 0,
    blocked: 0,
    auditEvents: 0,
    deniedAuditEvents: 0,
    openReports: 0,
    pendingProfiles: 0,
    expiringCredentials: 0,
    expiredProfiles: 0,
  });
  const [reportStatus, setReportStatus] = useState<CommunicationReportStatus>("OPEN");
  const [reports, setReports] = useState<CommunicationReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolvingReport, setResolvingReport] = useState(false);
  const [pilotReadiness, setPilotReadiness] = useState<PilotReadiness | null>(null);
  const [pilotDrafts, setPilotDrafts] = useState<Record<string, {
    status: PilotGateStatus;
    reason: string;
    evidenceReference: string;
  }>>({});
  const [savingPilotGate, setSavingPilotGate] = useState<string | null>(null);

  const selected = useMemo(
    () => profiles.find((profile) => profile.id === selectedId) ?? profiles[0] ?? null,
    [profiles, selectedId],
  );
  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? reports[0] ?? null,
    [reports, selectedReportId],
  );
  const pendingRenewals = useMemo(
    () => selected?.credentials.filter(
      (credential) => credential.status === "PENDING" && Boolean(credential.renewalOfCredentialId),
    ) ?? [],
    [selected],
  );
  const isRenewalReview = selected?.verificationStatus === "VERIFIED" && pendingRenewals.length > 0;

  function applyProfiles(nextProfiles: ProfessionalProfile[]) {
    setProfiles(nextProfiles);
    setSelectedId((current) =>
      nextProfiles.some((profile) => profile.id === current)
        ? current
        : nextProfiles[0]?.id ?? null,
    );
  }

  async function load() {
    try {
      const data = (await adminApi(`care/profiles?status=${status}`)) as {
        profiles: ProfessionalProfile[];
      };
      applyProfiles(data.profiles);
    } catch (error) {
      if (error instanceof Error && error.message === "SESSION_EXPIRED") {
        onSessionExpired();
      } else {
        onMessage(error instanceof Error ? error.message : "Não foi possível carregar os cadastros.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    adminApi(`care/profiles?status=${status}`)
      .then((data) => {
        if (!active) return;
        const nextProfiles = (data as { profiles: ProfessionalProfile[] }).profiles;
        setProfiles(nextProfiles);
        setSelectedId((current) =>
          nextProfiles.some((profile) => profile.id === current)
            ? current
            : nextProfiles[0]?.id ?? null,
        );
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof Error && error.message === "SESSION_EXPIRED") {
          onSessionExpired();
        } else {
          onMessage(error instanceof Error ? error.message : "Não foi possível carregar os cadastros.");
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [onMessage, onSessionExpired, status]);

  useEffect(() => {
    let active = true;
    adminApi("care/metrics").then((data) => {
      if (!active) return;
      const metrics = (data as { metrics: {
        activeRelationships: number;
        pausedRelationships: number;
        expiringRelationships: number;
        blockedCommunications: number;
        openReports: number;
        pendingProfiles: number;
        expiringCredentials: number;
        expiredProfiles: number;
        auditEventsLast24h: number;
        deniedAuditEventsLast24h: number;
      } }).metrics;
      setOperations({
        active: metrics.activeRelationships,
        paused: metrics.pausedRelationships,
        expiring: metrics.expiringRelationships,
        blocked: metrics.blockedCommunications,
        auditEvents: metrics.auditEventsLast24h,
        deniedAuditEvents: metrics.deniedAuditEventsLast24h,
        openReports: metrics.openReports,
        pendingProfiles: metrics.pendingProfiles,
        expiringCredentials: metrics.expiringCredentials,
        expiredProfiles: metrics.expiredProfiles,
      });
    }).catch((error: unknown) => {
      if (active && error instanceof Error && error.message === "SESSION_EXPIRED") onSessionExpired();
    });
    return () => { active = false; };
  }, [onSessionExpired]);

  const applyPilotReadiness = useCallback((readiness: PilotReadiness) => {
    setPilotReadiness(readiness);
    setPilotDrafts(Object.fromEntries(readiness.gates.map((gate) => [
      gate.key,
      {
        status: gate.status,
        reason: gate.reason ?? "",
        evidenceReference: gate.evidenceReference ?? "",
      },
    ])));
  }, []);

  useEffect(() => {
    let active = true;
    adminApi("care/pilot-readiness")
      .then((data) => {
        if (active) applyPilotReadiness((data as { readiness: PilotReadiness }).readiness);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof Error && error.message === "SESSION_EXPIRED") onSessionExpired();
        else onMessage(error instanceof Error ? error.message : "Não foi possível carregar os gates do piloto.");
      });
    return () => { active = false; };
  }, [applyPilotReadiness, onMessage, onSessionExpired]);

  function updatePilotDraft(
    gate: string,
    field: "status" | "reason" | "evidenceReference",
    value: string,
  ) {
    setPilotDrafts((current) => ({
      ...current,
      [gate]: {
        ...(current[gate] ?? { status: "PENDING", reason: "", evidenceReference: "" }),
        [field]: value,
      },
    }));
  }

  async function savePilotGate(gate: PilotGate) {
    const draft = pilotDrafts[gate.key];
    if (!draft || draft.reason.trim().length < 10) {
      onMessage("Registre uma justificativa com pelo menos 10 caracteres.");
      return;
    }
    if (draft.status === "APPROVED" && !draft.evidenceReference.trim()) {
      onMessage("Informe a referência da evidência antes de aprovar o gate.");
      return;
    }
    setSavingPilotGate(gate.key);
    try {
      const data = (await adminApi(
        `care/pilot-readiness/${gate.key}`,
        jsonRequest("PATCH", {
          status: draft.status,
          reason: draft.reason.trim(),
          evidenceReference: draft.evidenceReference.trim() || null,
        }),
      )) as { readiness: PilotReadiness };
      applyPilotReadiness(data.readiness);
      onMessage("Gate registrado com trilha de auditoria. Nenhum rollout foi ativado.");
    } catch (error) {
      if (error instanceof Error && error.message === "SESSION_EXPIRED") onSessionExpired();
      else onMessage(error instanceof Error ? error.message : "Não foi possível registrar o gate.");
    } finally {
      setSavingPilotGate(null);
    }
  }

  const loadReports = useCallback(async () => {
    try {
      const data = (await adminApi(
        `care/communication-reports?status=${reportStatus}`,
      )) as { reports: CommunicationReport[] };
      setReports(data.reports);
      setSelectedReportId((current) =>
        data.reports.some((report) => report.id === current)
          ? current
          : data.reports[0]?.id ?? null,
      );
    } catch (error) {
      if (error instanceof Error && error.message === "SESSION_EXPIRED") {
        onSessionExpired();
      } else {
        onMessage(error instanceof Error ? error.message : "Não foi possível carregar as denúncias.");
      }
    }
  }, [onMessage, onSessionExpired, reportStatus]);

  useEffect(() => {
    let active = true;
    adminApi(`care/communication-reports?status=${reportStatus}`)
      .then((data) => {
        if (!active) return;
        const nextReports = (data as { reports: CommunicationReport[] }).reports;
        setReports(nextReports);
        setSelectedReportId((current) =>
          nextReports.some((report) => report.id === current)
            ? current
            : nextReports[0]?.id ?? null,
        );
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof Error && error.message === "SESSION_EXPIRED") {
          onSessionExpired();
        } else {
          onMessage(error instanceof Error ? error.message : "Não foi possível carregar as denúncias.");
        }
      });
    return () => { active = false; };
  }, [onMessage, onSessionExpired, reportStatus]);

  async function resolveReport(decision: "resolve" | "dismiss") {
    if (!selectedReport) return;
    if (!resolutionNote.trim()) {
      onMessage("Registre a análise e as medidas tomadas antes de encerrar a denúncia.");
      return;
    }
    setResolvingReport(true);
    try {
      await adminApi(
        `care/communication-reports/${selectedReport.id}`,
        jsonRequest("PATCH", { decision, resolutionNote: resolutionNote.trim() }),
      );
      onMessage(decision === "resolve" ? "Denúncia resolvida e auditada." : "Denúncia descartada com justificativa.");
      setResolutionNote("");
      await loadReports();
      setOperations((current) => ({
        ...current,
        openReports: Math.max(0, current.openReports - 1),
      }));
    } catch (error) {
      if (error instanceof Error && error.message === "SESSION_EXPIRED") onSessionExpired();
      else onMessage(error instanceof Error ? error.message : "Não foi possível encerrar a denúncia.");
    } finally {
      setResolvingReport(false);
    }
  }

  async function review(decision: "verify" | "request_correction" | "reject" | "suspend") {
    if (!selected) return;
    if (decision !== "verify" && !reason.trim()) {
      onMessage("Informe o motivo antes de solicitar correção, rejeitar ou suspender.");
      return;
    }
    setReviewing(true);
    try {
      await adminApi(
        `care/profiles/${selected.id}/review`,
        jsonRequest("POST", { decision, reason: reason.trim() || null }),
      );
      onMessage(
        decision === "verify"
          ? isRenewalReview
            ? "Renovação aprovada. A nova credencial assumiu a vigência sem interromper os vínculos."
            : "Perfil verificado e vínculos pendentes ativados."
          : decision === "request_correction"
            ? isRenewalReview
              ? "Correção solicitada. A credencial vigente e os vínculos permanecem ativos."
              : "Correção solicitada ao profissional."
            : decision === "suspend"
              ? "Perfil suspenso e vínculos ativos pausados."
              : "Cadastro profissional rejeitado.",
      );
      setReason("");
      await load();
    } catch (error) {
      if (error instanceof Error && error.message === "SESSION_EXPIRED") {
        onSessionExpired();
      } else {
        onMessage(error instanceof Error ? error.message : "Não foi possível concluir a análise.");
      }
    } finally {
      setReviewing(false);
    }
  }

  async function openCredential(credential: Credential) {
    if (!selected || !credential.documentFileName) return;
    const popup = window.open("", "_blank", "noopener,noreferrer");
    setOpeningCredential(credential.id);
    try {
      const result = (await adminApi(
        `care/profiles/${selected.id}/credentials/${credential.id}/download-url`,
      )) as { downloadUrl: string };
      if (popup) popup.location.href = result.downloadUrl;
      else window.location.assign(result.downloadUrl);
    } catch (error) {
      popup?.close();
      onMessage(error instanceof Error ? error.message : "Não foi possível abrir o comprovante.");
    } finally {
      setOpeningCredential(null);
    }
  }

  return (
    <div className={styles.careReviewPanel}>
      <section className={styles.sectionCard}>
        <div className={styles.sectionTitle}>
          <div>
            <span className={styles.kicker}>Gate operacional</span>
            <h2>Prontidão do piloto profissional</h2>
            <p>Registre decisões e evidências externas antes de iniciar o piloto controlado.</p>
          </div>
          {pilotReadiness && (
            <span className={pilotReadiness.ready ? styles.readinessReady : styles.readinessBlocked}>
              {pilotReadiness.ready ? "Pronto para decisão" : `${pilotReadiness.approvedCount}/${pilotReadiness.requiredCount} aprovados`}
            </span>
          )}
        </div>
        <div className={styles.readinessNotice}>
          <strong>{pilotReadiness?.ready ? "Todos os gates foram aprovados" : "O piloto permanece bloqueado"}</strong>
          <span>Este checklist é consultivo: ele não publica, não altera permissões e não ativa rollout automaticamente.</span>
        </div>
        {!pilotReadiness ? <p>Carregando prontidão…</p> : (
          <div className={styles.pilotGateGrid}>
            {pilotReadiness.gates.map((gate) => {
              const draft = pilotDrafts[gate.key] ?? {
                status: gate.status,
                reason: gate.reason ?? "",
                evidenceReference: gate.evidenceReference ?? "",
              };
              return (
                <article key={gate.key} className={styles.pilotGateCard}>
                  <div className={styles.pilotGateHeader}>
                    <div><h3>{gate.label}</h3><p>{gate.description}</p></div>
                    <span data-status={gate.status}>{gate.status === "APPROVED" ? "Aprovado" : gate.status === "BLOCKED" ? "Bloqueado" : "Pendente"}</span>
                  </div>
                  <label>
                    Decisão
                    <select value={draft.status} onChange={(event) => updatePilotDraft(gate.key, "status", event.target.value)}>
                      <option value="PENDING">Pendente</option>
                      <option value="APPROVED">Aprovado</option>
                      <option value="BLOCKED">Bloqueado</option>
                    </select>
                  </label>
                  <label>
                    Justificativa
                    <textarea rows={3} maxLength={2000} value={draft.reason} onChange={(event) => updatePilotDraft(gate.key, "reason", event.target.value)} placeholder="Decisão, pendência ou risco identificado" />
                  </label>
                  <label>
                    Referência da evidência {draft.status === "APPROVED" ? "(obrigatória)" : "(opcional)"}
                    <input maxLength={1000} value={draft.evidenceReference} onChange={(event) => updatePilotDraft(gate.key, "evidenceReference", event.target.value)} placeholder="Ticket, parecer, relatório ou URL interna" />
                  </label>
                  {gate.decidedAt && <small>Última decisão em {formatDate(gate.decidedAt)} por {gate.decidedBy?.name || gate.decidedBy?.email || "administrador removido"}.</small>}
                  <button className={styles.secondaryButton} disabled={savingPilotGate === gate.key} onClick={() => void savePilotGate(gate)}>
                    {savingPilotGate === gate.key ? "Registrando…" : "Registrar decisão"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <section className={styles.sectionCard}>
        <div className={styles.sectionTitle}>
          <div>
            <span className={styles.kicker}>Credenciais profissionais</span>
            <h2>Verificação da equipe de cuidado</h2>
            <p>Confira profissão e registro antes de liberar qualquer dado de saúde.</p>
          </div>
          <label className={styles.statusFilter}>
            Situação
            <select value={status} onChange={(event) => { setLoading(true); setStatus(event.target.value as VerificationStatus); }}>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>
        <div className={styles.impactGrid}>
          <div><strong>{operations.active}</strong><span>vínculos ativos</span></div>
          <div><strong>{operations.paused}</strong><span>vínculos pausados</span></div>
          <div><strong>{operations.expiring}</strong><span>expiram em até 7 dias</span></div>
          <div><strong>{operations.blocked}</strong><span>comunicações bloqueadas</span></div>
          <div><strong>{operations.pendingProfiles}</strong><span>perfis aguardando análise</span></div>
          <div><strong>{operations.expiringCredentials}</strong><span>credenciais vencem em até 30 dias</span></div>
          <div><strong>{operations.expiredProfiles}</strong><span>perfis expirados</span></div>
          <div><strong>{operations.openReports}</strong><span>denúncias abertas</span></div>
          <div><strong>{operations.auditEvents}</strong><span>acessos auditados em 24h</span></div>
          <div><strong>{operations.deniedAuditEvents}</strong><span>acessos negados em 24h</span></div>
        </div>
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.sectionTitle}>
          <div>
            <span className={styles.kicker}>Segurança da comunicação</span>
            <h2>Denúncias</h2>
            <p>Analise o contexto somente para moderação e registre a decisão tomada.</p>
          </div>
          <label className={styles.statusFilter}>
            Situação
            <select value={reportStatus} onChange={(event) => setReportStatus(event.target.value as CommunicationReportStatus)}>
              <option value="OPEN">Abertas</option>
              <option value="RESOLVED">Resolvidas</option>
              <option value="DISMISSED">Descartadas</option>
            </select>
          </label>
        </div>
        {reports.length === 0 ? (
          <div className={styles.empty}><h3>Nenhuma denúncia nesta situação</h3><p>A fila está atualizada.</p></div>
        ) : (
          <div className={styles.careReviewGrid}>
            <div className={styles.reviewList}>
              {reports.map((report) => (
                <button
                  key={report.id}
                  className={selectedReport?.id === report.id ? styles.reviewSelected : styles.reviewItem}
                  onClick={() => { setSelectedReportId(report.id); setResolutionNote(""); }}
                >
                  <strong>{reportCategoryLabels[report.category] ?? report.category}</strong>
                  <span>{report.patient.name} · {report.relationship.professionalProfile.displayName}</span>
                  <small>{formatDate(report.createdAt)}</small>
                </button>
              ))}
            </div>
            {selectedReport && (
              <div className={styles.reviewDetail}>
                <div className={styles.reviewIdentity}>
                  <div>
                    <span className={styles.kicker}>{reportCategoryLabels[selectedReport.category] ?? selectedReport.category}</span>
                    <h3>Relato de {selectedReport.reporter.name}</h3>
                    <p>Paciente: {selectedReport.patient.name} · Profissional: {selectedReport.relationship.professionalProfile.displayName}</p>
                  </div>
                  <span className={styles.planBadge}>{selectedReport.status}</span>
                </div>
                <div className={styles.reviewBio}>
                  <strong>Descrição</strong>
                  <p>{selectedReport.details || "Nenhum detalhe adicional informado."}</p>
                </div>
                {selectedReport.message && (
                  <div className={styles.reviewBio}>
                    <strong>Mensagem denunciada · {formatDate(selectedReport.message.createdAt)}</strong>
                    <p>{selectedReport.message.content}</p>
                  </div>
                )}
                {selectedReport.status === "OPEN" ? (
                  <div className={styles.reviewActions}>
                    <label>
                      Análise e medidas tomadas
                      <textarea value={resolutionNote} onChange={(event) => setResolutionNote(event.target.value)} rows={4} maxLength={2000} />
                    </label>
                    <div className={styles.actions}>
                      <button disabled={resolvingReport} className={styles.secondaryButton} onClick={() => void resolveReport("dismiss")}>Descartar com justificativa</button>
                      <button disabled={resolvingReport} className={styles.primaryButton} onClick={() => void resolveReport("resolve")}>{resolvingReport ? "Salvando…" : "Marcar como resolvida"}</button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.reviewBio}>
                    <strong>Resolução · {formatDate(selectedReport.resolvedAt)}</strong>
                    <p>{selectedReport.resolutionNote}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      <div className={styles.careReviewGrid}>
        <aside className={styles.sectionCard}>
          <h3>Cadastros</h3>
          <div className={styles.reviewList}>
            {loading ? <p>Carregando cadastros…</p> : profiles.length === 0 ? (
              <p>Nenhum cadastro nesta situação.</p>
            ) : profiles.map((profile) => (
              <button
                key={profile.id}
                className={selected?.id === profile.id ? styles.reviewSelected : styles.reviewItem}
                onClick={() => { setSelectedId(profile.id); setReason(""); }}
              >
                <strong>{profile.displayName}</strong>
                <span>{professionLabels[profile.primaryProfession] ?? profile.primaryProfession}</span>
                <small>{profile.user.email}</small>
              </button>
            ))}
          </div>
        </aside>

        <main className={styles.sectionCard}>
          {!selected ? (
            <div className={styles.empty}><h3>Selecione um cadastro</h3><p>Os detalhes e registros aparecem aqui.</p></div>
          ) : (
            <div className={styles.reviewDetail}>
              <div className={styles.reviewIdentity}>
                <div>
                  <span className={styles.kicker}>{professionLabels[selected.primaryProfession] ?? selected.primaryProfession}</span>
                  <h2>{selected.displayName}</h2>
                  <p>{selected.user.name} · {selected.user.email}</p>
                </div>
                <span className={styles.planBadge}>{statusLabels[selected.verificationStatus]}</span>
              </div>
              <dl className={styles.profileFacts}>
                <div><dt>Enviado em</dt><dd>{formatDate(selected.submittedAt)}</dd></div>
                <div><dt>Localidade</dt><dd>{[selected.city, selected.state].filter(Boolean).join(" / ") || "Não informada"}</dd></div>
                <div><dt>Verificado em</dt><dd>{formatDate(selected.verifiedAt)}</dd></div>
              </dl>
              {selected.bio && <div className={styles.reviewBio}><strong>Apresentação</strong><p>{selected.bio}</p></div>}
              <div>
                <h3>Credenciais declaradas</h3>
                <div className={styles.credentialList}>
                  {selected.credentials.length === 0 ? <p>Nenhuma credencial informada.</p> : selected.credentials.map((credential) => (
                    <article key={credential.id}>
                      <div>
                        <strong>{credential.type}</strong>
                        <span>{credential.renewalOfCredentialId ? `RENOVAÇÃO · ${credential.status}` : credential.status}</span>
                      </div>
                      <p>{credential.registrationNumber || "Sem número"}{credential.jurisdiction ? ` · ${credential.jurisdiction}` : ""}</p>
                      <small>{credential.specialty || credential.issuer || "Sem especialidade informada"}</small>
                      {credential.documentFileName && (
                        <button
                          className={styles.secondaryButton}
                          disabled={openingCredential === credential.id}
                          onClick={() => void openCredential(credential)}
                        >
                          {openingCredential === credential.id ? "Abrindo…" : "Ver comprovante"}
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              </div>
              <div>
                <h3>Histórico de auditoria</h3>
                <div className={styles.credentialList}>
                  {(selected.reviewLogs ?? []).length === 0 ? <p>Nenhuma decisão registrada.</p> : selected.reviewLogs.map((log) => (
                    <article key={log.id}>
                      <div><strong>{log.action.replaceAll("_", " ")}</strong><span>{formatDate(log.createdAt)}</span></div>
                      <p>{[log.previousStatus, log.resultingStatus].filter(Boolean).join(" → ") || "Acesso administrativo"}</p>
                      <small>{log.reason || "Sem observação"} · {log.actor?.name || log.actor?.email || "Administrador removido"}</small>
                    </article>
                  ))}
                </div>
              </div>
              {(selected.verificationStatus === "PENDING_VERIFICATION" || isRenewalReview) && (
                <div className={styles.reviewActions}>
                  {isRenewalReview && (
                    <div className={styles.reviewBio}>
                      <strong>Renovação sem interrupção</strong>
                      <p>A credencial atual permanece válida até a aprovação da nova versão. Correção ou rejeição não pausa o perfil nem os vínculos.</p>
                    </div>
                  )}
                  <label>
                    Motivo ou orientação ao profissional
                    <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="Obrigatório para correção ou rejeição" />
                  </label>
                  <div className={styles.actions}>
                    <button disabled={reviewing} className={styles.dangerButton} onClick={() => void review("reject")}>Rejeitar</button>
                    <button disabled={reviewing} className={styles.secondaryButton} onClick={() => void review("request_correction")}>Solicitar correção</button>
                    <button disabled={reviewing} className={styles.primaryButton} onClick={() => void review("verify")}>{reviewing ? "Salvando…" : isRenewalReview ? "Aprovar renovação" : "Verificar perfil"}</button>
                  </div>
                </div>
              )}
              {selected.verificationStatus === "VERIFIED" && !isRenewalReview && (
                <div className={styles.reviewActions}>
                  <label>
                    Motivo da suspensão
                    <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="Descreva o motivo operacional ou de segurança" />
                  </label>
                  <div className={styles.actions}>
                    <button disabled={reviewing} className={styles.dangerButton} onClick={() => void review("suspend")}>Suspender perfil e pausar vínculos</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

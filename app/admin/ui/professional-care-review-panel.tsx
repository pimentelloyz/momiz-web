"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [operations, setOperations] = useState({ active: 0, paused: 0, auditEvents: 0 });

  const selected = useMemo(
    () => profiles.find((profile) => profile.id === selectedId) ?? profiles[0] ?? null,
    [profiles, selectedId],
  );

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
    Promise.all([
      adminApi("care/relationships"),
      adminApi("care/audit-logs"),
    ]).then(([relationshipData, auditData]) => {
      if (!active) return;
      const relationships = (relationshipData as { relationships: Array<{ status: string }> }).relationships;
      const auditLogs = (auditData as { auditLogs: unknown[] }).auditLogs;
      setOperations({
        active: relationships.filter((item) => item.status === "ACTIVE" || item.status === "READ_ONLY").length,
        paused: relationships.filter((item) => item.status === "PAUSED").length,
        auditEvents: auditLogs.length,
      });
    }).catch((error: unknown) => {
      if (active && error instanceof Error && error.message === "SESSION_EXPIRED") onSessionExpired();
    });
    return () => { active = false; };
  }, [onSessionExpired]);

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
          ? "Perfil verificado e vínculos pendentes ativados."
          : decision === "request_correction"
            ? "Correção solicitada ao profissional."
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
          <div><strong>{operations.auditEvents}</strong><span>eventos recentes auditados</span></div>
        </div>
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
                      <div><strong>{credential.type}</strong><span>{credential.status}</span></div>
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
              {selected.verificationStatus === "PENDING_VERIFICATION" && (
                <div className={styles.reviewActions}>
                  <label>
                    Motivo ou orientação ao profissional
                    <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="Obrigatório para correção ou rejeição" />
                  </label>
                  <div className={styles.actions}>
                    <button disabled={reviewing} className={styles.dangerButton} onClick={() => void review("reject")}>Rejeitar</button>
                    <button disabled={reviewing} className={styles.secondaryButton} onClick={() => void review("request_correction")}>Solicitar correção</button>
                    <button disabled={reviewing} className={styles.primaryButton} onClick={() => void review("verify")}>{reviewing ? "Salvando…" : "Verificar perfil"}</button>
                  </div>
                </div>
              )}
              {selected.verificationStatus === "VERIFIED" && (
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

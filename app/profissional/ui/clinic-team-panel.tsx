"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import styles from "./professional.module.css";

type Clinic = {
  id: string;
  name: string;
  seatLimit: number;
  memberships?: Array<{ id: string; role: "OWNER" | "ADMIN" | "MEMBER"; status: string }>;
  _count?: { memberships: number; invitations: number };
};

type Member = {
  id: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  status: "ACTIVE" | "SUSPENDED";
  professionalProfile?: {
    id: string;
    displayName?: string | null;
    primaryProfession?: string | null;
    user?: { name?: string | null; photoUrl?: string | null };
  };
};

type Invitation = {
  id: string;
  recipientEmail: string;
  role: "ADMIN" | "MEMBER";
  status: string;
  expiresAt: string;
};

type AuditLog = {
  id: string;
  action: string;
  targetMembershipId?: string | null;
  targetInvitationId?: string | null;
  createdAt: string;
  actor?: { id: string; name?: string | null } | null;
};

type TeamPayload = {
  clinic: Clinic;
  membership: { id: string; role: "OWNER" | "ADMIN" | "MEMBER"; status: string };
  members: Member[];
  invitations: Invitation[];
  auditLogs?: AuditLog[];
};

const professionLabels: Record<string, string> = {
  OBSTETRICIAN: "Médica obstetra",
  DOULA: "Doula",
  OBSTETRIC_NURSE: "Enfermeira obstetra",
  PELVIC_PHYSIOTHERAPIST: "Fisioterapeuta pélvica",
};

const auditActionLabels: Record<string, string> = {
  CLINIC_CREATED: "Criou a clínica",
  INVITATION_CREATED: "Criou um convite",
  INVITATION_ACCEPTED: "Aceitou um convite",
  INVITATION_CANCELED: "Cancelou um convite",
  INVITATION_EXPIRED: "Convite expirou automaticamente",
  MEMBER_SUSPENDED: "Suspendeu um membro",
  MEMBER_REACTIVATED: "Reativou um membro",
};

async function clinicRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/profissional/api/care/professional/clinics${path}`, {
    ...init,
    headers: init.body ? { "content-type": "application/json", ...init.headers } : init.headers,
    cache: "no-store",
  });
  if (response.status === 401) throw new Error("SESSION_EXPIRED");
  const body = await response.json().catch(() => ({})) as T & { message?: string };
  if (!response.ok) throw new Error(body.message || "Não foi possível concluir a operação.");
  return body;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function ClinicTeamPanel({ onSessionExpired }: { onSessionExpired: () => void }) {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [team, setTeam] = useState<TeamPayload | null>(null);
  const [inviteToken, setInviteToken] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const handleError = useCallback((operationError: unknown) => {
    if (operationError instanceof Error && operationError.message === "SESSION_EXPIRED") {
      onSessionExpired();
      return;
    }
    setError(operationError instanceof Error ? operationError.message : "Não foi possível concluir a operação.");
  }, [onSessionExpired]);

  const loadClinics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await clinicRequest<{ clinics: Clinic[] }>("");
      setClinics(result.clinics || []);
      setSelectedId((current) => current || result.clinics?.[0]?.id || "");
    } catch (loadError) {
      handleError(loadError);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const loadTeam = useCallback(async (clinicId: string) => {
    if (!clinicId) {
      setTeam(null);
      return;
    }
    setError("");
    try {
      setTeam(await clinicRequest<TeamPayload>(`/${clinicId}/members`));
    } catch (loadError) {
      handleError(loadError);
    }
  }, [handleError]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const token = new URLSearchParams(window.location.search).get("clinicInvite");
      if (token) setInviteToken(token);
      void loadClinics();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadClinics]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadTeam(selectedId), 0);
    return () => window.clearTimeout(timer);
  }, [loadTeam, selectedId]);

  const occupiedSeats = team?.members.filter((member) => member.status === "ACTIVE").length || 0;
  const reservedSeats = team?.invitations.length || 0;
  const canManage = ["OWNER", "ADMIN"].includes(team?.membership.role || "");
  const availableSeats = Math.max((team?.clinic.seatLimit || 0) - occupiedSeats - reservedSeats, 0);

  async function createClinic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = String(new FormData(form).get("name") || "").trim();
    setBusy("create"); setError(""); setFeedback("");
    try {
      const result = await clinicRequest<{ clinic: Clinic }>("", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      form.reset();
      await loadClinics();
      setSelectedId(result.clinic.id);
      setFeedback("Clínica criada. Agora você pode convidar sua equipe.");
    } catch (operationError) { handleError(operationError); }
    finally { setBusy(""); }
  }

  async function acceptInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = inviteToken.trim();
    setBusy("accept"); setError(""); setFeedback("");
    try {
      const result = await clinicRequest<{ clinic: Clinic }>(`/invitations/${encodeURIComponent(token)}/accept`, { method: "POST" });
      setInviteToken("");
      window.history.replaceState({}, "", "/profissional");
      await loadClinics();
      setSelectedId(result.clinic.id);
      setFeedback(`Você entrou na equipe ${result.clinic.name}.`);
    } catch (operationError) { handleError(operationError); }
    finally { setBusy(""); }
  }

  async function createInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy("invite"); setError(""); setFeedback(""); setGeneratedLink("");
    try {
      const result = await clinicRequest<{ token: string }>(`/${selectedId}/invitations`, {
        method: "POST",
        body: JSON.stringify({
          recipientEmail: String(data.get("recipientEmail") || "").trim(),
          role: String(data.get("role") || "MEMBER"),
        }),
      });
      const link = `${window.location.origin}/profissional?clinicInvite=${encodeURIComponent(result.token)}`;
      setGeneratedLink(link);
      form.reset();
      await Promise.all([loadClinics(), loadTeam(selectedId)]);
      setFeedback("Convite criado. Copie o link e envie apenas à pessoa convidada.");
    } catch (operationError) { handleError(operationError); }
    finally { setBusy(""); }
  }

  async function cancelInvitation(invitationId: string) {
    if (!selectedId) return;
    setBusy(invitationId); setError(""); setFeedback("");
    try {
      await clinicRequest(`/${selectedId}/invitations/${invitationId}`, { method: "DELETE" });
      await Promise.all([loadClinics(), loadTeam(selectedId)]);
      setFeedback("Convite cancelado e vaga liberada.");
    } catch (operationError) { handleError(operationError); }
    finally { setBusy(""); }
  }

  async function updateMember(member: Member) {
    if (!selectedId) return;
    const action = member.status === "ACTIVE" ? "suspend" : "reactivate";
    setBusy(member.id); setError(""); setFeedback("");
    try {
      await clinicRequest(`/${selectedId}/members/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      await Promise.all([loadClinics(), loadTeam(selectedId)]);
      setFeedback(action === "suspend" ? "Acesso do membro suspenso." : "Acesso do membro reativado.");
    } catch (operationError) { handleError(operationError); }
    finally { setBusy(""); }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(generatedLink);
    setFeedback("Link copiado com segurança.");
  }

  const selectedClinic = useMemo(() => clinics.find((clinic) => clinic.id === selectedId), [clinics, selectedId]);

  return (
    <section className={`${styles.panel} ${styles.clinicPanel}`}>
      <div className={styles.sectionHeading}>
        <div><span className={styles.kicker}>Clínicas e equipes</span><h2>Gestão de profissionais</h2></div>
        <span>{clinics.length}</span>
      </div>
      <p className={styles.sectionDescription}>Organize sua equipe sem compartilhar automaticamente nenhuma paciente ou dado clínico.</p>

      {error && <div className={styles.error} role="alert">{error}</div>}
      {feedback && <div className={styles.feedback} role="status">{feedback}</div>}

      <div className={styles.clinicActions}>
        <form className={styles.inlineForm} onSubmit={createClinic}>
          <label>Nova clínica<input name="name" minLength={2} maxLength={160} placeholder="Ex.: Clínica Aurora" required /></label>
          <button className={styles.primaryButton} disabled={busy === "create"}>{busy === "create" ? "Criando…" : "Criar clínica"}</button>
        </form>
        <form className={styles.inlineForm} onSubmit={acceptInvitation}>
          <label>Entrar com convite<input value={inviteToken} onChange={(event) => setInviteToken(event.target.value)} minLength={32} placeholder="Cole o código recebido" required /></label>
          <button className={styles.secondaryButton} disabled={busy === "accept"}>{busy === "accept" ? "Validando…" : "Aceitar convite"}</button>
        </form>
      </div>

      {loading ? <div className={styles.inlineLoading}>Carregando equipes…</div> : clinics.length === 0 ? (
        <div className={styles.emptyState}><strong>Nenhuma clínica criada</strong><p>Crie uma organização ou aceite um convite para começar.</p></div>
      ) : (
        <div className={styles.clinicWorkspace}>
          <nav className={styles.clinicTabs} aria-label="Clínicas">
            {clinics.map((clinic) => (
              <button className={clinic.id === selectedId ? styles.clinicTabActive : styles.clinicTab} key={clinic.id} onClick={() => setSelectedId(clinic.id)} type="button">
                <strong>{clinic.name}</strong>
                <span>{clinic._count?.memberships || 0} membro(s)</span>
              </button>
            ))}
          </nav>

          {team && selectedClinic && (
            <div className={styles.teamContent}>
              <div className={styles.seatSummary}>
                <div><span>Vagas ativas</span><strong>{occupiedSeats}/{team.clinic.seatLimit}</strong></div>
                <div><span>Reservadas</span><strong>{reservedSeats}</strong></div>
                <div><span>Disponíveis</span><strong>{availableSeats}</strong></div>
                <div><span>Seu papel</span><strong>{team.membership.role === "OWNER" ? "Proprietário" : team.membership.role === "ADMIN" ? "Administrador" : "Membro"}</strong></div>
              </div>

              {canManage && (
                <form className={styles.inviteForm} onSubmit={createInvitation}>
                  <label>E-mail profissional<input name="recipientEmail" type="email" placeholder="profissional@exemplo.com" required /></label>
                  <label>Papel<select name="role" defaultValue="MEMBER"><option value="MEMBER">Membro</option><option value="ADMIN">Administrador</option></select></label>
                  <button className={styles.primaryButton} disabled={busy === "invite" || availableSeats === 0}>{busy === "invite" ? "Criando…" : availableSeats === 0 ? "Sem vagas" : "Convidar"}</button>
                </form>
              )}

              {generatedLink && <div className={styles.inviteLink}><span>O token só é exibido agora</span><code>{generatedLink}</code><button className={styles.secondaryButton} onClick={() => void copyLink()} type="button">Copiar link</button></div>}

              <div className={styles.teamColumns}>
                <div><h3>Membros</h3><div className={styles.memberList}>{team.members.map((member) => (
                  <article className={styles.memberCard} key={member.id}>
                    <div><strong>{member.professionalProfile?.displayName || member.professionalProfile?.user?.name || "Profissional"}</strong><span>{professionLabels[member.professionalProfile?.primaryProfession || ""] || "Profissional"} · {member.role}</span></div>
                    <span className={styles.statusBadge}>{member.status === "ACTIVE" ? "Ativo" : "Suspenso"}</span>
                    {canManage && member.role !== "OWNER" && <button className={styles.textButton} disabled={busy === member.id} onClick={() => void updateMember(member)} type="button">{member.status === "ACTIVE" ? "Suspender" : "Reativar"}</button>}
                  </article>
                ))}</div></div>
                <div><h3>Convites pendentes</h3>{team.invitations.length === 0 ? <p className={styles.muted}>Nenhum convite pendente.</p> : <div className={styles.memberList}>{team.invitations.map((invitation) => (
                  <article className={styles.memberCard} key={invitation.id}>
                    <div><strong>{invitation.recipientEmail}</strong><span>{invitation.role} · expira em {formatDate(invitation.expiresAt)}</span></div>
                    {canManage && <button className={styles.textButton} disabled={busy === invitation.id} onClick={() => void cancelInvitation(invitation.id)} type="button">Cancelar</button>}
                  </article>
                ))}</div>}</div>
              </div>

              {canManage && (
                <div className={styles.auditPanel}>
                  <div>
                    <h3>Histórico de segurança</h3>
                    <p className={styles.muted}>Últimas alterações administrativas da equipe.</p>
                  </div>
                  {(team.auditLogs || []).length === 0 ? (
                    <p className={styles.muted}>Nenhuma alteração registrada.</p>
                  ) : (
                    <ol className={styles.auditList}>
                      {(team.auditLogs || []).map((log) => (
                        <li key={log.id}>
                          <span className={styles.auditMarker} aria-hidden="true" />
                          <div>
                            <strong>{auditActionLabels[log.action] || "Alteração administrativa"}</strong>
                            <span>{log.actor?.name || "Sistema"} · {formatDate(log.createdAt)}</span>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

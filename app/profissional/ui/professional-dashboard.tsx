"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  activeAgendaFilterCount,
  AgendaAppointment,
  agendaFilterQuery,
  emptyAgendaFilter,
  filterAgenda,
  ProfessionalAgendaFilter,
} from "../../../lib/professional/agenda";
import styles from "./professional.module.css";
import { ClinicTeamPanel } from "./clinic-team-panel";

type Profile = {
  displayName?: string | null;
  primaryProfession?: string | null;
  verificationStatus?: string | null;
  credentials?: Array<{ id: string; type?: string; status?: string; expiresAt?: string | null }>;
};

type Relationship = {
  id: string;
  status?: string | null;
  profession?: string | null;
  scopes?: Array<{ capability?: string } | string>;
  patient?: { id?: string; name?: string | null; email?: string | null; photoUrl?: string | null } | null;
};

const professionLabels: Record<string, string> = {
  OBSTETRICIAN: "Médica obstetra",
  DOULA: "Doula",
  OBSTETRIC_NURSE: "Enfermeira obstetra",
  PELVIC_PHYSIOTHERAPIST: "Fisioterapeuta pélvica",
};
const appointmentTypeLabels: Record<string, string> = {
  CONSULTATION: "Consulta",
  EXAM: "Exame",
  VACCINE: "Vacina",
  PHYSIOTHERAPY: "Fisioterapia",
  DOULA_MEETING: "Encontro com doula",
  OTHER: "Outro",
};
const statusLabels: Record<string, string> = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
  ACTIVE: "Ativo",
  READ_ONLY: "Somente leitura",
  PAUSED: "Pausado",
  PENDING_VERIFICATION: "Aguardando verificação",
};
const verificationLabels: Record<string, string> = {
  DRAFT: "Cadastro em edição",
  PENDING_VERIFICATION: "Em análise",
  NEEDS_CORRECTION: "Correções necessárias",
  REJECTED: "Cadastro não aprovado",
  EXPIRED: "Credencial expirada",
};

async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (response.status === 401) throw new Error("SESSION_EXPIRED");
  const body = await response.json().catch(() => ({})) as T & { message?: string };
  if (!response.ok) throw new Error(body.message || "Não foi possível carregar os dados.");
  return body;
}

function initials(name?: string | null) {
  return (name || "P")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDateTime(value?: string | null) {
  if (!value) return "Horário não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horário não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function fileNameFromDisposition(disposition: string | null) {
  return disposition?.match(/filename="?([^";]+)"?/i)?.[1] || "agenda-profissional-momiz.ics";
}

export function ProfessionalDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [patients, setPatients] = useState<Relationship[]>([]);
  const [appointments, setAppointments] = useState<AgendaAppointment[]>([]);
  const [filter, setFilter] = useState<ProfessionalAgendaFilter>(emptyAgendaFilter);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [loadedAt] = useState(() => Date.now());

  const expireSession = useCallback(() => {
    router.replace("/profissional/login");
    router.refresh();
  }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const profilePayload = await readJson<{ profile: Profile }>("/profissional/api/care/professional/profile");
      setProfile(profilePayload.profile);
      if (profilePayload.profile.verificationStatus !== "VERIFIED") return;
      const [patientPayload, agendaPayload] = await Promise.all([
        readJson<{ relationships: Relationship[] }>("/profissional/api/care/professional/patients"),
        readJson<{ appointments: AgendaAppointment[] }>("/profissional/api/care/professional/agenda"),
      ]);
      setPatients(patientPayload.relationships || []);
      setAppointments(agendaPayload.appointments || []);
    } catch (loadError) {
      if (loadError instanceof Error && loadError.message === "SESSION_EXPIRED") {
        expireSession();
        return;
      }
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar o portal.");
    } finally {
      setLoading(false);
    }
  }, [expireSession]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const visibleAppointments = useMemo(
    () => filterAgenda(appointments, filter),
    [appointments, filter],
  );
  const activePatients = patients.filter((item) => ["ACTIVE", "READ_ONLY"].includes(item.status || ""));
  const upcoming = appointments.filter((item) => {
    const time = item.scheduledAt ? new Date(item.scheduledAt).getTime() : 0;
    return time >= loadedAt && item.status !== "CANCELED";
  });
  const today = upcoming.filter((item) => {
    const date = new Date(item.scheduledAt || "");
    const now = new Date();
    return date.toDateString() === now.toDateString();
  });

  async function logout() {
    await fetch("/profissional/api/session", { method: "DELETE" });
    expireSession();
  }

  async function exportCalendar() {
    setExporting(true);
    setError("");
    try {
      const query = agendaFilterQuery(filter);
      const response = await fetch(`/profissional/api/care/professional/agenda/export.ics${query ? `?${query}` : ""}`);
      if (response.status === 401) return expireSession();
      if (!response.ok) throw new Error("Não foi possível exportar o calendário.");
      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = fileNameFromDisposition(response.headers.get("content-disposition"));
      anchor.click();
      URL.revokeObjectURL(href);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Não foi possível exportar o calendário.");
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return <div className={styles.centerState}><span className={styles.spinner} /><p>Carregando seu espaço profissional…</p></div>;
  }

  if (error && !profile) {
    return (
      <div className={styles.centerState}>
        <strong>Não foi possível abrir o portal</strong><p>{error}</p>
        <button className={styles.primaryButton} onClick={() => void load()}>Tentar novamente</button>
      </div>
    );
  }

  if (profile?.verificationStatus !== "VERIFIED") {
    return (
      <div className={styles.pendingPage}>
        <section className={styles.pendingCard}>
          <span className={styles.kicker}>Portal profissional</span>
          <h1>Olá, {profile?.displayName || "profissional"}</h1>
          <div className={styles.statusBadge}>{verificationLabels[profile?.verificationStatus || ""] || "Cadastro pendente"}</div>
          <p>O acesso a pacientes e à agenda será liberado após a validação do cadastro e das credenciais profissionais.</p>
          <p>Você pode acompanhar ou corrigir seu cadastro pelo aplicativo Momiz.</p>
          <button className={styles.secondaryButton} onClick={() => void logout()}>Sair</button>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.portalPage}>
      <header className={styles.portalHeader}>
        <Image src="/brand/momiz-logo-horizontal.png" alt="Momiz" width={1600} height={533} priority />
        <div className={styles.profileSummary}>
          <div className={styles.avatar}>{initials(profile.displayName)}</div>
          <div><strong>{profile.displayName}</strong><span>{professionLabels[profile.primaryProfession || ""] || "Profissional de saúde"}</span></div>
        </div>
        <button className={styles.headerButton} onClick={() => void logout()}>Sair</button>
      </header>

      <main className={styles.portalMain}>
        <section className={styles.welcome}>
          <div><span className={styles.kicker}>Visão profissional</span><h1>Seu cuidado, organizado em um só lugar</h1><p>Somente dados autorizados pelas pacientes aparecem neste portal.</p></div>
          <button className={styles.secondaryButton} onClick={() => void load()}>Atualizar dados</button>
        </section>

        {error && <div className={styles.feedback} role="alert">{error}</div>}

        <section className={styles.metrics} aria-label="Resumo profissional">
          <article><span>Pacientes ativas</span><strong>{activePatients.length}</strong></article>
          <article><span>Compromissos hoje</span><strong>{today.length}</strong></article>
          <article><span>Próximos compromissos</span><strong>{upcoming.length}</strong></article>
          <article><span>Agenda total</span><strong>{appointments.length}</strong></article>
        </section>

        <div className={styles.contentGrid}>
          <section className={styles.panel}>
            <div className={styles.sectionHeading}><div><span className={styles.kicker}>Pacientes</span><h2>Vínculos de cuidado</h2></div><span>{patients.length}</span></div>
            {patients.length === 0 ? (
              <div className={styles.emptyState}><strong>Nenhuma paciente vinculada</strong><p>Os convites aceitos e autorizados aparecerão aqui.</p></div>
            ) : (
              <div className={styles.patientList}>
                {patients.map((relationship) => (
                  <article className={styles.patientCard} key={relationship.id}>
                    <div className={styles.avatar}>{initials(relationship.patient?.name)}</div>
                    <div className={styles.patientInfo}>
                      <strong>{relationship.patient?.name || "Paciente"}</strong>
                      <span>{relationship.patient?.email || "E-mail protegido"}</span>
                    </div>
                    <span className={styles.statusBadge}>{statusLabels[relationship.status || ""] || relationship.status}</span>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className={`${styles.panel} ${styles.agendaPanel}`}>
            <div className={styles.sectionHeading}>
              <div><span className={styles.kicker}>Agenda</span><h2>Compromissos</h2></div>
              <button className={styles.exportButton} disabled={exporting || visibleAppointments.length === 0} onClick={() => void exportCalendar()}>
                {exporting ? "Exportando…" : "Exportar .ics"}
              </button>
            </div>
            <AgendaFilters filter={filter} patients={patients} onChange={setFilter} />
            <div className={styles.filterSummary}>
              <span>{visibleAppointments.length} resultado(s){activeAgendaFilterCount(filter) ? ` · ${activeAgendaFilterCount(filter)} filtro(s)` : ""}</span>
              {activeAgendaFilterCount(filter) > 0 && <button onClick={() => setFilter(emptyAgendaFilter)}>Limpar filtros</button>}
            </div>
            {visibleAppointments.length === 0 ? (
              <div className={styles.emptyState}><strong>Nenhum compromisso encontrado</strong><p>Ajuste os filtros ou aguarde novos agendamentos.</p></div>
            ) : (
              <div className={styles.appointmentList}>
                {visibleAppointments.map((appointment) => (
                  <article className={styles.appointmentCard} key={appointment.id}>
                    <time>{formatDateTime(appointment.scheduledAt)}</time>
                    <strong>{appointment.title || appointmentTypeLabels[appointment.type || ""] || "Compromisso"}</strong>
                    <span>{appointment.user?.name || "Paciente"} · {appointmentTypeLabels[appointment.type || ""] || appointment.type}</span>
                    <span className={styles.statusBadge}>{statusLabels[appointment.status || ""] || appointment.status}</span>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
        <div className={styles.clinicSection}>
          <ClinicTeamPanel onSessionExpired={expireSession} />
        </div>
      </main>
    </div>
  );
}

function AgendaFilters({ filter, patients, onChange }: {
  filter: ProfessionalAgendaFilter;
  patients: Relationship[];
  onChange: (filter: ProfessionalAgendaFilter) => void;
}) {
  function update(key: keyof ProfessionalAgendaFilter, value: string) {
    onChange({ ...filter, [key]: value });
  }
  return (
    <div className={styles.filters}>
      <label>Paciente<select value={filter.patientUserId} onChange={(event) => update("patientUserId", event.target.value)}><option value="">Todas</option>{patients.map((item) => <option key={item.id} value={item.patient?.id}>{item.patient?.name || "Paciente"}</option>)}</select></label>
      <label>Tipo<select value={filter.type} onChange={(event) => update("type", event.target.value)}><option value="">Todos</option>{Object.entries(appointmentTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Status<select value={filter.status} onChange={(event) => update("status", event.target.value)}><option value="">Todos</option>{["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELED"].map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}</select></label>
      <label>De<input type="date" value={filter.from} max={filter.to || undefined} onChange={(event) => update("from", event.target.value)} /></label>
      <label>Até<input type="date" value={filter.to} min={filter.from || undefined} onChange={(event) => update("to", event.target.value)} /></label>
    </div>
  );
}

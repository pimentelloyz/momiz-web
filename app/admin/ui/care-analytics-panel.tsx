"use client";

import { FormEvent, useState } from "react";
import { adminApi } from "./admin-api-client";
import styles from "./admin.module.css";

type Metric = { value: number | null; suppressed: boolean };
type Group = { key: string; count: Metric };
type Report = {
  generatedAt: string;
  period: { from: string; to: string };
  privacy: {
    method: string;
    minimumCohortSize: number;
    suppressedValue: null;
    containsDirectIdentifiers: false;
  };
  totals: Record<string, Metric>;
  groups: Record<string, Group[]>;
};

const totalLabels: Record<string, string> = {
  professionalProfilesCreated: "Novos perfis profissionais",
  relationshipsCreated: "Novos vínculos de cuidado",
  uniquePatientsWithNewRelationship: "Pacientes com novo vínculo",
  appointmentsInPeriod: "Compromissos no período",
  accessEvents: "Acessos auditados",
  careMessagesCreated: "Mensagens de cuidado",
};

const groupLabels: Record<string, string> = {
  profilesByProfession: "Perfis por profissão",
  profilesByStatus: "Perfis por situação",
  relationshipsByProfession: "Vínculos por profissão",
  relationshipsByStatus: "Vínculos por situação",
  appointmentsByType: "Compromissos por tipo",
  appointmentsByStatus: "Compromissos por situação",
  accessByOutcome: "Acessos por resultado",
  accessByResource: "Acessos por recurso",
};

const valueLabels: Record<string, string> = {
  OBSTETRICIAN: "Médica obstetra",
  DOULA: "Doula",
  OBSTETRIC_NURSE: "Enfermeira obstetra",
  PELVIC_PHYSIOTHERAPIST: "Fisioterapeuta pélvica",
  CONSULTATION: "Consulta",
  EXAM: "Exame",
  VACCINE: "Vacina",
  PHYSIOTHERAPY: "Fisioterapia",
  DOULA_MEETING: "Encontro com doula",
  OTHER: "Outro",
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
  ACTIVE: "Ativo",
  READ_ONLY: "Somente leitura",
  PAUSED: "Pausado",
  REVOKED: "Revogado",
  EXPIRED: "Expirado",
  PENDING_VERIFICATION: "Aguardando verificação",
  VERIFIED: "Verificado",
  DRAFT: "Rascunho",
  NEEDS_CORRECTION: "Correção necessária",
  REJECTED: "Rejeitado",
  SUSPENDED: "Suspenso",
  ALLOWED: "Permitido",
  ALLOWED_SELF: "Permitido para titular",
  DENIED: "Negado",
};

function localDate(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function displayMetric(metric: Metric) {
  return metric.suppressed ? "Suprimido" : String(metric.value ?? 0);
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function CareAnalyticsPanel({
  onMessage,
  onSessionExpired,
}: {
  onMessage: (message: string) => void;
  onSessionExpired: () => void;
}) {
  const [defaultPeriod] = useState(() => {
    const to = new Date();
    const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { from: localDate(from), to: localDate(to) };
  });
  const [from, setFrom] = useState(defaultPeriod.from);
  const [to, setTo] = useState(defaultPeriod.to);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);

  async function load(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    try {
      const fromIso = new Date(`${from}T00:00:00`).toISOString();
      const toIso = new Date(`${to}T23:59:59.999`).toISOString();
      const data = await adminApi(
        `care/analytics?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`,
      ) as { report: Report };
      setReport(data.report);
      onMessage("Relatório anônimo atualizado.");
    } catch (error) {
      if (error instanceof Error && error.message === "SESSION_EXPIRED") onSessionExpired();
      else onMessage(error instanceof Error ? error.message : "Não foi possível gerar o relatório.");
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    if (!report) return;
    const rows: string[][] = [["seção", "indicador", "valor", "suprimido"]];
    for (const [key, metric] of Object.entries(report.totals)) {
      rows.push(["totais", totalLabels[key] || key, metric.suppressed ? "" : String(metric.value), String(metric.suppressed)]);
    }
    for (const [groupKey, groups] of Object.entries(report.groups)) {
      for (const item of groups) {
        rows.push([groupLabels[groupKey] || groupKey, valueLabels[item.key] || item.key, item.count.suppressed ? "" : String(item.count.value), String(item.count.suppressed)]);
      }
    }
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `relatorio-cuidado-anonimo-${from}-${to}.csv`;
    anchor.click();
    URL.revokeObjectURL(href);
  }

  return (
    <div className={styles.analyticsPanel}>
      <section className={styles.sectionCard}>
        <div className={styles.sectionTitle}>
          <div>
            <span className={styles.kicker}>Privacidade por padrão</span>
            <h2>Relatórios agregados e anonimizados</h2>
            <p>Nenhum nome, e-mail, identificador ou conteúdo clínico integra este relatório.</p>
          </div>
          <form className={styles.analyticsFilters} onSubmit={load}>
            <label>De<input type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)} required /></label>
            <label>Até<input type="date" value={to} min={from} onChange={(event) => setTo(event.target.value)} required /></label>
            <button className={styles.primaryButton} disabled={loading}>{loading ? "Gerando…" : "Gerar relatório"}</button>
          </form>
        </div>
        <div className={styles.privacyNotice}>
          <strong>Proteção contra reidentificação</strong>
          <span>Contagens menores que 5 são ocultadas automaticamente. O período máximo é de 366 dias.</span>
        </div>
      </section>

      {!report ? (
        <section className={styles.analyticsEmpty}><h2>Escolha o período</h2><p>Gere um relatório para acompanhar adoção, agenda e segurança sem expor pessoas.</p></section>
      ) : (
        <>
          <section className={styles.sectionCard}>
            <div className={styles.sectionTitle}>
              <div><span className={styles.kicker}>Visão geral</span><h2>Indicadores do período</h2></div>
              <button className={styles.secondaryButton} onClick={exportCsv}>Exportar CSV protegido</button>
            </div>
            <div className={styles.analyticsTotals}>
              {Object.entries(report.totals).map(([key, metric]) => (
                <article className={metric.suppressed ? styles.suppressedMetric : ""} key={key}>
                  <strong>{displayMetric(metric)}</strong><span>{totalLabels[key] || key}</span>
                </article>
              ))}
            </div>
          </section>
          <section className={styles.analyticsGroups}>
            {Object.entries(report.groups).map(([key, groups]) => (
              <article className={styles.sectionCard} key={key}>
                <h3>{groupLabels[key] || key}</h3>
                {groups.length === 0 ? <p>Sem ocorrências no período.</p> : (
                  <ul>{groups.map((item) => <li key={item.key}><span>{valueLabels[item.key] || item.key}</span><strong>{displayMetric(item.count)}</strong></li>)}</ul>
                )}
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  );
}

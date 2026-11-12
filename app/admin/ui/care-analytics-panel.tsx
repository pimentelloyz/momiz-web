"use client";

import { FormEvent, useRef, useState } from "react";
import { adminApi, adminErrorMessage, isAdminSessionExpired } from "./admin-api-client";
import { FeedbackState } from "./admin-primitives";
import { AdminQueryState } from "./admin-query-state";
import {
  AnalyticsMetric,
  CareAnalyticsReport,
  analyticsGroupKeys,
  analyticsTotalKeys,
  isAnalyticsDateRangeValid,
  isCurrentCareAnalyticsRequest,
  readCareAnalyticsReport,
} from "./admin-care-analytics";
import styles from "./admin.module.css";

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

function displayMetric(metric: AnalyticsMetric) {
  return metric.suppressed ? "Suprimido" : String(metric.value);
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
  const [reportState, setReportState] = useState<AdminQueryState<CareAnalyticsReport> | { phase: "idle" }>({ phase: "idle" });
  const requestVersionRef = useRef(0);
  const report = reportState.phase === "ready" || reportState.phase === "empty" ? reportState.data : null;
  const loading = reportState.phase === "loading";

  async function load(event?: FormEvent) {
    event?.preventDefault();
    if (!isAnalyticsDateRangeValid(from, to)) {
      setReportState({ phase: "error", error: new Error("Selecione um período válido de até 366 dias.") });
      return;
    }
    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;
    setReportState({ phase: "loading" });
    try {
      const fromIso = new Date(`${from}T00:00:00`).toISOString();
      const toIso = new Date(`${to}T23:59:59.999`).toISOString();
      const next = readCareAnalyticsReport(await adminApi(
        `care/analytics?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`,
      ));
      if (!isCurrentCareAnalyticsRequest(requestVersion, requestVersionRef.current)) return;
      setReportState({ phase: "ready", data: next });
      onMessage("Relatório anônimo atualizado.");
    } catch (error) {
      if (!isCurrentCareAnalyticsRequest(requestVersion, requestVersionRef.current)) return;
      if (isAdminSessionExpired(error)) onSessionExpired();
      setReportState({ phase: "error", error });
    }
  }

  function exportCsv() {
    if (!report) return;
    const rows: string[][] = [["seção", "indicador", "valor", "suprimido"]];
    for (const key of analyticsTotalKeys) {
      const metric = report.totals[key];
      rows.push(["totais", totalLabels[key], metric.suppressed ? "" : String(metric.value), String(metric.suppressed)]);
    }
    for (const groupKey of analyticsGroupKeys) {
      const groups = report.groups[groupKey];
      for (const item of groups) {
        rows.push([groupLabels[groupKey], valueLabels[item.key] || item.key, String(item.count.value), "false"]);
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

      {reportState.phase === "loading" ? (
        <FeedbackState variant="loading" title="Gerando relatório" description="Aplicando agregação e proteção por coorte ao período selecionado." className={styles.analyticsEmpty} />
      ) : reportState.phase === "error" ? (
        <FeedbackState
          variant="error"
          title="Não foi possível gerar o relatório"
          description={adminErrorMessage(reportState.error, "Não foi possível gerar o relatório.")}
          action={<button type="button" className={styles.secondaryButton} onClick={() => void load()}>Tentar novamente</button>}
          className={styles.analyticsEmpty}
        />
      ) : !report ? (
        <section className={styles.analyticsEmpty}><h2>Escolha o período</h2><p>Gere um relatório para acompanhar adoção, agenda e segurança sem expor pessoas.</p></section>
      ) : (
        <>
          <section className={styles.sectionCard}>
            <div className={styles.sectionTitle}>
              <div><span className={styles.kicker}>Visão geral</span><h2>Indicadores do período</h2></div>
              <button className={styles.secondaryButton} onClick={exportCsv}>Exportar CSV protegido</button>
            </div>
            <div className={styles.analyticsTotals}>
              {analyticsTotalKeys.map((key) => {
                const metric = report.totals[key];
                return (
                <article className={metric.suppressed ? styles.suppressedMetric : ""} key={key}>
                  <strong>{displayMetric(metric)}</strong><span>{totalLabels[key]}</span>
                </article>
                );
              })}
            </div>
          </section>
          <section className={styles.analyticsGroups}>
            {analyticsGroupKeys.map((key) => {
              const groups = report.groups[key];
              return (
              <article className={styles.sectionCard} key={key}>
                <h3>{groupLabels[key]}</h3>
                {groups.length === 0 ? <p>Dados abaixo do limiar foram omitidos; a ausência não revela categorias.</p> : (
                  <ul>{groups.map((item) => <li key={item.key}><span>{valueLabels[item.key] || item.key}</span><strong>{displayMetric(item.count)}</strong></li>)}</ul>
                )}
              </article>
              );
            })}
          </section>
        </>
      )}
    </div>
  );
}

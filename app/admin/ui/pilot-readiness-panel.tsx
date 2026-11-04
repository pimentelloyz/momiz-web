"use client";

import { FeedbackState, FormField } from "./admin-primitives";
import styles from "./admin.module.css";

export type PilotGateStatus = "PENDING" | "APPROVED" | "BLOCKED";
export type PilotGate = {
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

export type PilotReadiness = {
  ready: boolean;
  advisoryOnly: true;
  rolloutAutomaticallyEnabled: false;
  approvedCount: number;
  requiredCount: number;
  gates: PilotGate[];
};

export type PilotDraft = {
  status: PilotGateStatus;
  reason: string;
  evidenceReference: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function PilotReadinessPanel({
  readiness,
  drafts,
  savingGate,
  onDraftChange,
  onSave,
  onExport,
}: {
  readiness: PilotReadiness | null;
  drafts: Record<string, PilotDraft>;
  savingGate: string | null;
  onDraftChange: (gate: string, field: keyof PilotDraft, value: string) => void;
  onSave: (gate: PilotGate) => void;
  onExport: () => void;
}) {
  return (
    <section className={styles.sectionCard} aria-labelledby="pilot-readiness-title" aria-busy={Boolean(savingGate)}>
      <div className={styles.sectionTitle}>
        <div>
          <span className={styles.kicker}>Gate operacional</span>
          <h2 id="pilot-readiness-title">Prontidão do piloto profissional</h2>
          <p>Registre decisões e evidências externas antes de iniciar o piloto controlado.</p>
        </div>
        {readiness && (
          <div className={styles.readinessTools}>
            <span className={readiness.ready ? styles.readinessReady : styles.readinessBlocked} aria-live="polite">
              {readiness.ready ? "Pronto para decisão" : `${readiness.approvedCount}/${readiness.requiredCount} aprovados`}
            </span>
            <button type="button" className={styles.secondaryButton} disabled={!readiness.gates.some((gate) => gate.auditLogs.length > 0)} onClick={onExport}>
              Exportar histórico CSV
            </button>
          </div>
        )}
      </div>

      {!readiness ? (
        <FeedbackState variant="loading" title="Carregando prontidão" description="Consultando gates e histórico auditável." className={styles.readinessNotice} />
      ) : readiness.gates.length === 0 ? (
        <FeedbackState variant="empty" title="Nenhum gate configurado" description="O piloto permanece bloqueado até que os gates sejam publicados." className={styles.readinessNotice} />
      ) : (
        <>
          <FeedbackState
            variant={readiness.ready ? "success" : "empty"}
            title={readiness.ready ? "Todos os gates foram aprovados" : "O piloto permanece bloqueado"}
            description="Este checklist é consultivo: ele não publica, não altera permissões e não ativa rollout automaticamente."
            className={styles.readinessNotice}
          />
          <div className={styles.pilotGateGrid}>
            {readiness.gates.map((gate) => {
              const draft = drafts[gate.key] ?? { status: gate.status, reason: gate.reason ?? "", evidenceReference: gate.evidenceReference ?? "" };
              const reasonError = draft.reason.trim().length < 10
                ? "Use pelo menos 10 caracteres."
                : undefined;
              const evidenceError = draft.status === "APPROVED" && !draft.evidenceReference.trim()
                ? "Informe a referência antes de aprovar."
                : undefined;
              return (
                <article key={gate.key} className={styles.pilotGateCard} aria-labelledby={`pilot-gate-${gate.key}`}>
                  <div className={styles.pilotGateHeader}>
                    <div><h3 id={`pilot-gate-${gate.key}`}>{gate.label}</h3><p>{gate.description}</p></div>
                    <span data-status={gate.status}>{gate.status === "APPROVED" ? "Aprovado" : gate.status === "BLOCKED" ? "Bloqueado" : "Pendente"}</span>
                  </div>
                  <FormField label="Decisão" className={styles.adminFormField}>
                    <select value={draft.status} onChange={(event) => onDraftChange(gate.key, "status", event.target.value)}>
                      <option value="PENDING">Pendente</option><option value="APPROVED">Aprovado</option><option value="BLOCKED">Bloqueado</option>
                    </select>
                  </FormField>
                  <FormField label="Justificativa" description="Registre a decisão, pendência ou risco identificado." error={reasonError} className={styles.adminFormField}>
                    <textarea rows={3} maxLength={2000} value={draft.reason} onChange={(event) => onDraftChange(gate.key, "reason", event.target.value)} />
                  </FormField>
                  <FormField label={`Referência da evidência ${draft.status === "APPROVED" ? "(obrigatória)" : "(opcional)"}`} error={evidenceError} className={styles.adminFormField}>
                    <input maxLength={1000} value={draft.evidenceReference} onChange={(event) => onDraftChange(gate.key, "evidenceReference", event.target.value)} placeholder="Ticket, parecer, relatório ou URL interna" />
                  </FormField>
                  {gate.decidedAt && <small>Última decisão em {formatDate(gate.decidedAt)} por {gate.decidedBy?.name || gate.decidedBy?.email || "administrador removido"}.</small>}
                  <button type="button" className={styles.secondaryButton} disabled={savingGate === gate.key || Boolean(reasonError) || Boolean(evidenceError)} onClick={() => onSave(gate)}>
                    {savingGate === gate.key ? "Registrando…" : "Registrar decisão"}
                  </button>
                  <details className={styles.pilotGateHistory}>
                    <summary>Histórico auditável ({gate.auditLogs.length})</summary>
                    {gate.auditLogs.length === 0 ? <p>Nenhuma decisão registrada para este gate.</p> : (
                      <ol>{gate.auditLogs.map((log) => <li key={log.id}><div><strong>{log.previousStatus} → {log.resultingStatus}</strong><time dateTime={log.createdAt}>{formatDate(log.createdAt)}</time></div><p>{log.reason}</p><small>{log.evidenceReference ? `Evidência: ${log.evidenceReference}` : "Sem referência de evidência"} · {log.actor?.name || log.actor?.email || "Administrador removido"}</small></li>)}</ol>
                    )}
                  </details>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

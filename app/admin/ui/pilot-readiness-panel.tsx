"use client";

import { FeedbackState, FormField, MutationFeedback } from "./admin-primitives";
import type { AdminMutationState } from "./admin-query-state";
import type { PilotGate, PilotGateStatus, PilotReadiness } from "./admin-pilot-readiness";
import styles from "./admin.module.css";

export type { PilotGate, PilotGateStatus, PilotReadiness } from "./admin-pilot-readiness";

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
  loadError,
  drafts,
  mutations,
  onDraftChange,
  onSave,
  onRetry,
}: {
  readiness: PilotReadiness | null;
  loadError?: string;
  drafts: Record<string, PilotDraft>;
  mutations: Record<string, AdminMutationState>;
  onDraftChange: (gate: string, field: keyof PilotDraft, value: string) => void;
  onSave: (gate: PilotGate) => void;
  onRetry: () => void;
}) {
  return (
    <section className={styles.sectionCard} aria-labelledby="pilot-readiness-title" aria-busy={!readiness && !loadError}>
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
          </div>
        )}
      </div>

      {loadError ? (
        <FeedbackState
          variant="error"
          title="Não foi possível carregar a prontidão"
          description={loadError}
          action={<button type="button" className={styles.secondaryButton} onClick={onRetry}>Tentar novamente</button>}
          className={styles.readinessNotice}
        />
      ) : !readiness ? (
        <FeedbackState variant="loading" title="Carregando prontidão" description="Consultando o estado atual dos gates." className={styles.readinessNotice} />
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
              const draft = drafts[gate.key] ?? { status: gate.status, reason: "", evidenceReference: "" };
              const mutation = mutations[gate.key] ?? { phase: "idle" };
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
                  {gate.decidedAt && <small>Última decisão em {formatDate(gate.decidedAt)}.</small>}
                  <MutationFeedback state={mutation} pendingTitle="Registrando gate" errorTitle="Não foi possível registrar o gate" fallbackError="Não foi possível registrar o gate." className={styles.readinessNotice} />
                  <button type="button" className={styles.secondaryButton} disabled={mutation.phase === "pending" || Boolean(reasonError) || Boolean(evidenceError)} onClick={() => onSave(gate)}>
                    {mutation.phase === "pending" ? "Registrando…" : "Registrar decisão"}
                  </button>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

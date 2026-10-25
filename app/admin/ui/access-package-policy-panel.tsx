"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi, jsonRequest } from "./admin-api-client";
import {
  capabilityLabel,
  capabilityMetadata,
  packageLabels,
} from "./access-policy-metadata";
import type {
  AccessPolicy,
  AccessPolicyHistoryItem,
  PackageCode,
  PackageMatrix,
  PolicyChange,
  PolicyImpact,
  PolicyRegistry,
  PolicyValidation,
} from "./access-policy-types";
import styles from "./admin.module.css";

type CurrentPolicyResponse = {
  policy: AccessPolicy;
  drafts: AccessPolicy[];
  registry: PolicyRegistry;
};

type HistoryResponse = {
  items: AccessPolicyHistoryItem[];
  total: number;
};

type Props = {
  onMessage(message: string): void;
  onSessionExpired(): void;
};

function cloneMatrix(matrix: PackageMatrix) {
  return structuredClone(matrix);
}

function displayDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "Não publicada";
}

export function AccessPackagePolicyPanel({ onMessage, onSessionExpired }: Props) {
  const [current, setCurrent] = useState<CurrentPolicyResponse | null>(null);
  const [history, setHistory] = useState<HistoryResponse>({ items: [], total: 0 });
  const [draft, setDraft] = useState<AccessPolicy | null>(null);
  const [matrix, setMatrix] = useState<PackageMatrix | null>(null);
  const [reason, setReason] = useState("Atualização da matriz de planos");
  const [validation, setValidation] = useState<PolicyValidation | null>(null);
  const [changes, setChanges] = useState<PolicyChange[]>([]);
  const [impact, setImpact] = useState<PolicyImpact | null>(null);
  const [historyDiff, setHistoryDiff] = useState<{
    policyId: string;
    changes: PolicyChange[];
  } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const handleError = useCallback(
    (error: unknown) => {
      if (error instanceof Error && error.message === "SESSION_EXPIRED") {
        onSessionExpired();
        return;
      }
      onMessage(error instanceof Error ? error.message : "Erro inesperado.");
    },
    [onMessage, onSessionExpired],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [currentResponse, historyResponse] = await Promise.all([
        adminApi("access/package-policies/current") as Promise<CurrentPolicyResponse>,
        adminApi("access/package-policies/history?pageSize=30") as Promise<HistoryResponse>,
      ]);
      setCurrent(currentResponse);
      setHistory(historyResponse);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    let active = true;
    Promise.all([
      adminApi("access/package-policies/current") as Promise<CurrentPolicyResponse>,
      adminApi("access/package-policies/history?pageSize=30") as Promise<HistoryResponse>,
    ])
      .then(([currentResponse, historyResponse]) => {
        if (!active) return;
        setCurrent(currentResponse);
        setHistory(historyResponse);
      })
      .catch((error: unknown) => {
        if (active) handleError(error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [handleError]);

  async function createDraft(sourceId?: string) {
    setBusy(true);
    setConfirming(false);
    try {
      const created = (await adminApi(
        sourceId
          ? `access/package-policies/${sourceId}/clone`
          : "access/package-policies/drafts",
        jsonRequest("POST", { reason }),
      )) as AccessPolicy;
      setDraft(created);
      setMatrix(cloneMatrix(created.packages));
      setValidation(null);
      setChanges([]);
      setImpact(null);
      onMessage(
        sourceId
          ? `Versão ${created.version} criada para rollback seguro.`
          : `Rascunho ${created.version} criado.`,
      );
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  }

  function resumeDraft(selected: AccessPolicy) {
    setDraft(selected);
    setMatrix(cloneMatrix(selected.packages));
    setReason(selected.reason);
    setValidation(null);
    setChanges([]);
    setImpact(null);
    setConfirming(false);
    onMessage(`Rascunho ${selected.version} retomado.`);
  }

  async function inspectHistory(selected: AccessPolicyHistoryItem) {
    if (historyDiff?.policyId === selected.id) {
      setHistoryDiff(null);
      return;
    }
    setBusy(true);
    try {
      const result = (await adminApi(
        `access/package-policies/${selected.id}/diff`,
      )) as { changes: PolicyChange[] };
      setHistoryDiff({ policyId: selected.id, changes: result.changes });
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  }

  async function saveDraft() {
    if (!draft || !matrix) return null;
    const saved = (await adminApi(
      `access/package-policies/drafts/${draft.id}`,
      jsonRequest("PUT", { reason, packages: matrix }),
    )) as AccessPolicy;
    setDraft(saved);
    setMatrix(cloneMatrix(saved.packages));
    return saved;
  }

  async function save() {
    setBusy(true);
    try {
      await saveDraft();
      setValidation(null);
      setConfirming(false);
      onMessage("Rascunho salvo e auditado.");
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  }

  async function reviewPublication() {
    if (!draft) return;
    setBusy(true);
    try {
      const saved = await saveDraft();
      if (!saved) return;
      const [validationResult, diffResult, impactResult] = await Promise.all([
        adminApi(`access/package-policies/drafts/${saved.id}/validate`) as Promise<PolicyValidation>,
        adminApi(`access/package-policies/${saved.id}/diff`) as Promise<{ changes: PolicyChange[] }>,
        adminApi(`access/package-policies/${saved.id}/impact-preview`) as Promise<PolicyImpact>,
      ]);
      setValidation(validationResult);
      setChanges(diffResult.changes);
      setImpact(impactResult);
      setConfirming(validationResult.valid);
      onMessage(
        validationResult.valid
          ? "Revisão pronta. Confira as alterações antes de publicar."
          : "Corrija os erros antes de publicar.",
      );
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!draft || !current?.policy || !validation?.valid) return;
    setBusy(true);
    try {
      await adminApi(
        `access/package-policies/drafts/${draft.id}/publish`,
        jsonRequest("POST", {
          reason,
          expectedPublishedVersion: current.policy.version,
        }),
      );
      setDraft(null);
      setMatrix(null);
      setValidation(null);
      setChanges([]);
      setImpact(null);
      setConfirming(false);
      onMessage("Nova matriz publicada com sucesso.");
      await load();
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  }

  function updateBoolean(
    packageCode: PackageCode,
    capability: string,
    enabled: boolean,
  ) {
    setMatrix((previous) => {
      if (!previous) return previous;
      const next = cloneMatrix(previous);
      next[packageCode].capabilities[capability] = enabled;
      return next;
    });
    setConfirming(false);
  }

  function updateLimit(
    packageCode: PackageCode,
    capability: string,
    value: number,
  ) {
    setMatrix((previous) => {
      if (!previous) return previous;
      const next = cloneMatrix(previous);
      next[packageCode].limits[capability] = value;
      return next;
    });
    setConfirming(false);
  }

  if (loading) {
    return <div className={styles.empty}><p>Carregando políticas de acesso…</p></div>;
  }
  if (!current?.policy) {
    return <div className={styles.empty}><h2>Nenhuma política publicada</h2><p>Execute a migration inicial antes de configurar os planos.</p></div>;
  }

  const registry = current.registry;
  const displayedMatrix = matrix ?? current.policy.packages;
  const editable = Boolean(draft && matrix);

  return (
    <main className={styles.policyPanel}>
      <section className={styles.summary}>
        <div>
          <span className={styles.kicker}>Política publicada</span>
          <h2>Versão {current.policy.version}</h2>
          <p>{current.policy.reason}</p>
        </div>
        <div className={styles.planBadge}>PUBLICADA</div>
        <dl>
          <div><dt>Publicada em</dt><dd className={styles.compactValue}>{displayDate(current.policy.publishedAt)}</dd></div>
          <div><dt>Versões anteriores</dt><dd>{Math.max(0, history.total - 1)}</dd></div>
        </dl>
      </section>

      {!draft && current.drafts.length > 0 && (
        <section className={styles.sectionCard}>
          <div className={styles.sectionTitle}>
            <div>
              <h3>Rascunhos abertos</h3>
              <p>Continue uma alteração já iniciada para evitar versões duplicadas.</p>
            </div>
          </div>
          <ul className={styles.policyHistory}>
            {current.drafts.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>Rascunho {item.version}</strong>
                  <span>{item.reason}</span>
                  <small>Criado em {displayDate(item.createdAt)}</small>
                </div>
                <button className={styles.secondaryButton} disabled={busy} onClick={() => resumeDraft(item)}>Continuar</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.sectionCard}>
        <div className={styles.sectionTitle}>
          <div><h3>{draft ? `Rascunho ${draft.version}` : "Matriz de recursos"}</h3><p>Somente a publicação altera o acesso das pessoas.</p></div>
          {!draft && <button className={styles.primaryButton} disabled={busy} onClick={() => createDraft()}>Criar rascunho</button>}
        </div>
        <label className={styles.policyReason}>Motivo da alteração<input value={reason} onChange={(event) => setReason(event.target.value)} minLength={3} disabled={!editable} /></label>

        <div className={styles.matrixScroller}>
          <table className={styles.policyMatrix}>
            <thead><tr><th>Recurso</th>{registry.packageCodes.map((code) => <th key={code}>{packageLabels[code]}</th>)}</tr></thead>
            <tbody>
              {registry.booleanCapabilities.map((capability) => {
                const metadata = capabilityMetadata[capability];
                return (
                  <tr key={capability}>
                    <th scope="row"><span>{metadata?.label ?? capability}</span><small>{metadata?.description}</small></th>
                    {registry.packageCodes.map((code) => (
                      <td key={code}>
                        <label className={styles.switchControl}>
                          <input type="checkbox" checked={displayedMatrix[code].capabilities[capability]} disabled={!editable || busy} onChange={(event) => updateBoolean(code, capability, event.target.checked)} />
                          <span>{displayedMatrix[code].capabilities[capability] ? "Ativo" : "Bloqueado"}</span>
                        </label>
                      </td>
                    ))}
                  </tr>
                );
              })}
              {registry.limitCapabilities.map((capability) => {
                const metadata = capabilityMetadata[capability];
                return (
                  <tr key={capability}>
                    <th scope="row"><span>{metadata?.label ?? capability}</span><small>{metadata?.description}</small></th>
                    {registry.packageCodes.map((code) => (
                      <td key={code}><input className={styles.limitInput} type="number" min="0" max="1000000" value={displayedMatrix[code].limits[capability]} disabled={!editable || busy} aria-label={`${metadata?.label ?? capability} no plano ${packageLabels[code]}`} onChange={(event) => updateLimit(code, capability, Number(event.target.value))} /></td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {editable && <div className={styles.actions}><button className={styles.secondaryButton} disabled={busy} onClick={save}>Salvar rascunho</button><button className={styles.primaryButton} disabled={busy} onClick={reviewPublication}>Revisar publicação</button></div>}
      </section>

      {validation && (
        <section className={styles.sectionCard}>
          <h3>Validação</h3>
          {validation.errors.length === 0 && <p className={styles.successText}>A matriz está estruturalmente válida.</p>}
          {[...validation.errors, ...validation.warnings].map((item) => <div className={item.code.includes("DISABLED") ? styles.warningItem : styles.errorItem} key={`${item.path}-${item.code}`}><strong>{item.message}</strong><small>{item.path}</small></div>)}
        </section>
      )}

      {confirming && validation?.valid && (
        <section className={styles.publishReview}>
          <div><span className={styles.kicker}>Confirmação final</span><h3>Publicar a versão {draft?.version}?</h3><p>{changes.length} alteração(ões). {impact?.affectedAccounts ?? 0} de {impact?.evaluatedAccounts ?? 0} conta(s) ficariam acima de algum novo limite.</p></div>
          {changes.length > 0 && <ul className={styles.changeList}>{changes.map((change) => <li key={`${change.packageCode}-${change.capability}`}><strong>{packageLabels[change.packageCode]} · {capabilityLabel(change.capability)}</strong><span>{String(change.before)} → {String(change.after)}</span></li>)}</ul>}
          {impact && Object.keys(impact.byCapability).length > 0 && <div className={styles.impactGrid}>{Object.entries(impact.byCapability).map(([capability, count]) => <div key={capability}><strong>{count}</strong><span>{capabilityLabel(capability)}</span></div>)}</div>}
          <div className={styles.actions}><button className={styles.secondaryButton} disabled={busy} onClick={() => setConfirming(false)}>Voltar à edição</button><button className={styles.primaryButton} disabled={busy} onClick={publish}>Confirmar publicação</button></div>
        </section>
      )}

      <section className={styles.sectionCard}>
        <div className={styles.sectionTitle}><div><h3>Histórico</h3><p>Clonar uma versão cria um novo rascunho; nenhuma versão publicada é editada diretamente.</p></div></div>
        <ul className={styles.policyHistory}>
          {history.items.map((item) => (
            <li key={item.id}>
              <div>
                <strong>Versão {item.version} · {item.status}</strong>
                <span>{item.reason}</span>
                <small>
                  {displayDate(item.publishedAt)} · {item.publishedBy?.name ?? item.createdBy?.name ?? "Sistema"}
                </small>
                {historyDiff?.policyId === item.id && (
                  historyDiff.changes.length > 0 ? (
                    <ul className={styles.historyDiff}>
                      {historyDiff.changes.map((change) => (
                        <li key={`${change.packageCode}-${change.capability}`}>
                          {packageLabels[change.packageCode]} · {capabilityLabel(change.capability)}: {String(change.before)} → {String(change.after)}
                        </li>
                      ))}
                    </ul>
                  ) : <small>Esta versão não possui diferenças em relação à base.</small>
                )}
              </div>
              <div className={styles.historyActions}>
                <button className={styles.secondaryButton} disabled={busy} onClick={() => inspectHistory(item)}>{historyDiff?.policyId === item.id ? "Ocultar diff" : "Ver diff"}</button>
                <button className={styles.secondaryButton} disabled={busy || Boolean(draft)} onClick={() => createDraft(item.id)}>Clonar</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import type { CanonicalCareError, CareContextSelection } from "../../../lib/professional/care-context";
import { readCanonicalCareError } from "../../../lib/professional/care-context";
import {
  canTerminateRelationship,
  CareInvitation,
  CareRelationship,
  invitationStatusLabel,
  parseCareInvitation,
  parseCareRelationships,
  relationshipStatusLabel,
  scopeLabel,
} from "../../../lib/professional/care-relationships";
import styles from "./professional.module.css";

type Props = {
  context: CareContextSelection;
  sessionEpoch: string;
};

const professionOptions = [
  ["OBSTETRICIAN", "Médica obstetra"],
  ["OBSTETRIC_NURSE", "Enfermeira obstetra"],
  ["DOULA", "Doula"],
  ["PELVIC_PHYSIOTHERAPIST", "Fisioterapeuta pélvica"],
] as const;

function idempotencyKey() {
  return crypto.randomUUID();
}

async function payload(response: Response) {
  return await response.json().catch(() => ({})) as unknown;
}

export function CareRelationshipsPanel({ context, sessionEpoch }: Props) {
  const controllerRef = useRef<AbortController | null>(null);
  const intentKeys = useRef(new Map<string, string>());
  const [relationships, setRelationships] = useState<CareRelationship[]>([]);
  const [createdInvitations, setCreatedInvitations] = useState<CareInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState<CanonicalCareError | null>(null);
  const [feedback, setFeedback] = useState("");
  const [terminatingId, setTerminatingId] = useState("");

  const base = `/profissional/api/contextual/${context.profileId}/${context.pregnancyId}`;
  const requestKey = (intent: string) => {
    const existing = intentKeys.current.get(intent);
    if (existing) return existing;
    const created = idempotencyKey();
    intentKeys.current.set(intent, created);
    return created;
  };

  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoading(true); setError(null);
    try {
      const response = await fetch(`${base}/relationships`, { cache: "no-store", signal: controller.signal });
      const body = await payload(response);
      if (!response.ok) throw readCanonicalCareError(body, "Não foi possível carregar os vínculos.");
      setRelationships(parseCareRelationships(body).relationships);
    } catch (caught) {
      if (controller.signal.aborted) return;
      setError(caught && typeof caught === "object" && "code" in caught ? caught as CanonicalCareError : {
        code: "UNKNOWN_ERROR", message: "Não foi possível carregar os vínculos.", requestId: "",
      });
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    const keys = intentKeys.current;
    const timer = window.setTimeout(() => void load(), 0);
    return () => { window.clearTimeout(timer); controllerRef.current?.abort(); keys.clear(); };
  }, [load, sessionEpoch]);

  async function mutate(intent: string, path: string, method: "POST" | "DELETE", body: unknown) {
    setBusy(intent); setError(null); setFeedback("");
    try {
      const response = await fetch(`${base}/${path}`, {
        method,
        headers: { "content-type": "application/json", "idempotency-key": requestKey(intent) },
        body: JSON.stringify(body),
      });
      const result = await payload(response);
      if (!response.ok) throw readCanonicalCareError(result, "Não foi possível concluir a operação.");
      intentKeys.current.delete(intent);
      return result;
    } catch (caught) {
      setError(caught && typeof caught === "object" && "code" in caught ? caught as CanonicalCareError : {
        code: "UNKNOWN_ERROR", message: "Não foi possível concluir a operação.", requestId: "",
      });
      return null;
    } finally {
      setBusy("");
    }
  }

  async function createInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const profession = String(form.get("profession") || "");
    const includeBirthPlan = form.get("birth.plan.comment") === "on";
    const result = await mutate(`create:${email}:${profession}`, "invitations", "POST", {
      direction: "PROFESSIONAL_TO_PATIENT",
      issuerProfileId: context.profileId,
      recipient: { email },
      expectedProfession: profession,
      scopes: includeBirthPlan ? ["birth.plan.comment"] : [],
    });
    if (!result) return;
    const invitation = parseCareInvitation(result);
    setCreatedInvitations((items) => [{ ...invitation, token: null }, ...items]);
    setFeedback("Convite criado. A paciente ainda precisa confirmar o consentimento.");
    event.currentTarget.reset();
  }

  async function invitationAction(invitation: CareInvitation, action: "resend" | "decline" | "cancel") {
    const result = await mutate(
      `${action}:${invitation.id}:${invitation.version}`,
      action === "cancel" ? `invitations/${invitation.id}` : `invitations/${invitation.id}/${action}`,
      action === "cancel" ? "DELETE" : "POST",
      { expectedInvitationVersion: invitation.version },
    );
    if (!result) return;
    const updated = parseCareInvitation(result);
    setCreatedInvitations((items) => action === "resend"
      ? [{ ...updated, token: null }, ...items.map((item) => item.id === invitation.id ? { ...item, status: "CANCELED" as const, cancellationReason: "SUPERSEDED" } : item)]
      : items.map((item) => item.id === invitation.id ? { ...updated, token: null } : item));
    setFeedback(action === "resend" ? "Novo convite criado; o anterior foi invalidado." : action === "decline" ? "Convite recusado." : "Convite cancelado.");
  }

  async function terminate(event: FormEvent<HTMLFormElement>, relationship: CareRelationship) {
    event.preventDefault();
    const reason = String(new FormData(event.currentTarget).get("reason") || "").trim();
    const result = await mutate(`terminate:${relationship.id}:${relationship.version}`, `relationships/${relationship.id}/terminate`, "POST", {
      expectedRelationshipVersion: relationship.version,
      revocationReason: reason,
    });
    if (!result) return;
    setTerminatingId(""); setFeedback("Vínculo encerrado. Novos acessos foram revogados.");
    await load();
  }

  return (
    <section className={styles.relationshipPanel} aria-labelledby="care-relationships-title" data-cache-key={`${sessionEpoch}:${context.profileId}:${context.pregnancyId}:relationships`}>
      <div className={styles.sectionHeading}>
        <div><span className={styles.kicker}>Equipe de cuidado</span><h2 id="care-relationships-title">Convites e vínculos</h2></div>
        <button className={styles.secondaryButton} disabled={loading || Boolean(busy)} onClick={() => void load()}>Atualizar</button>
      </div>
      <p className={styles.relationshipNotice}>O convite não libera dados. A paciente confirma o consentimento e os acessos antes da ativação.</p>
      {feedback && <div className={styles.feedback} role="status">{feedback}</div>}
      {error && <div className={styles.error} role="alert"><strong>{error.message}</strong>{error.requestId && <small>Identificador: {error.requestId}</small>}</div>}

      <form className={styles.relationshipInviteForm} onSubmit={createInvitation}>
        <label>E-mail da paciente<input name="email" type="email" autoComplete="off" required /></label>
        <label>Sua atuação<select name="profession" required defaultValue=""><option value="" disabled>Selecione</option>{professionOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label className={styles.relationshipScopeChoice}><input name="birth.plan.comment" type="checkbox" />Propor acesso para comentar o plano de parto</label>
        <button className={styles.primaryButton} disabled={Boolean(busy)}>{busy.startsWith("create:") ? "Criando…" : "Criar convite"}</button>
      </form>

      {createdInvitations.length > 0 && <div><h3>Convites criados nesta sessão</h3><div className={styles.relationshipList}>{createdInvitations.map((invitation) => <article className={styles.relationshipCard} key={invitation.id}><div><strong>{invitationStatusLabel(invitation.status, invitation.cancellationReason)}</strong><span>{invitation.direction === "PROFESSIONAL_TO_PATIENT" ? "Profissional → paciente" : "Paciente → profissional"}</span></div><ul>{invitation.scopes.map((scope) => <li key={scope}>{scopeLabel(scope)}</li>)}</ul>{invitation.status === "PENDING" && <div className={styles.relationshipActions}><button className={styles.textButton} disabled={Boolean(busy)} onClick={() => void invitationAction(invitation, "resend")}>Reenviar</button>{invitation.direction === "PATIENT_TO_PROFESSIONAL" && <button className={styles.textButton} disabled={Boolean(busy)} onClick={() => void invitationAction(invitation, "decline")}>Recusar</button>}<button className={styles.textButton} disabled={Boolean(busy)} onClick={() => void invitationAction(invitation, "cancel")}>Cancelar</button></div>}</article>)}</div></div>}

      <div><h3>Vínculos deste contexto</h3>{loading ? <div className={styles.inlineLoading} role="status">Carregando vínculos…</div> : relationships.length === 0 ? <div className={styles.emptyState}><strong>Nenhum vínculo encontrado</strong><p>Convites aceitos e consentidos aparecerão aqui.</p></div> : <div className={styles.relationshipList}>{relationships.map((relationship) => <article className={styles.relationshipCard} key={relationship.id}><div><strong>{relationshipStatusLabel(relationship.status)}</strong><span>{relationship.consentVersion ? `Consentimento ${relationship.consentVersion}` : "Consentimento não informado"}</span></div><div><strong>Acessos recebidos</strong>{relationship.scopes.length === 0 ? <p>Nenhum scope ativo.</p> : <ul>{relationship.scopes.map((scope) => <li key={scope}>{scopeLabel(scope)}{scopeLabel(scope) === "Permissão não reconhecida" ? ` (${scope})` : ""}</li>)}</ul>}</div>{canTerminateRelationship(relationship.status) && (terminatingId === relationship.id ? <form className={styles.terminateForm} onSubmit={(event) => void terminate(event, relationship)}><label>Motivo do encerramento<textarea name="reason" minLength={3} maxLength={500} required /></label><div className={styles.relationshipActions}><button type="button" className={styles.secondaryButton} onClick={() => setTerminatingId("")}>Voltar</button><button className={styles.primaryButton} disabled={Boolean(busy)}>Confirmar encerramento</button></div></form> : <button className={styles.textButton} onClick={() => setTerminatingId(relationship.id)}>Encerrar vínculo</button>)}</article>)}</div>}</div>
    </section>
  );
}

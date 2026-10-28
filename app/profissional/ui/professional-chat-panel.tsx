"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CanonicalCareError, ResolvedCareContext } from "../../../lib/professional/care-context";
import { readCanonicalCareError } from "../../../lib/professional/care-context";
import { buildCareMessage, isComposerPolicyAcknowledgable, mergeMessages, parseMessagePage, parseSentMessage, type CareMessage, type CommunicationPolicy } from "../../../lib/professional/care-chat";
import styles from "./professional.module.css";

type Props = { context: ResolvedCareContext; sessionEpoch: string };
type Phase = "loading" | "ready" | "empty" | "error" | "denied" | "blocked";
type FailedSend = { body: { clientMessageId: string; content: string }; key: string };
const deniedCodes = ["CARE_MESSAGE_CONVERSATION_NOT_FOUND", "CARE_MESSAGE_SCOPE_DENIED", "CARE_PROFILE_ACCESS_DENIED"];
const blockedCodes = ["CARE_MESSAGE_RELATIONSHIP_INACTIVE", "CARE_COMMUNICATION_BLOCKED"];
const days = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];
function uuid() { return globalThis.crypto?.randomUUID() || `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function dateTime(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Data indisponível" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date); }

export function ProfessionalChatPanel({ context, sessionEpoch }: Props) {
  const listRef = useRef<AbortController | null>(null); const sendRef = useRef<AbortController | null>(null); const receiptRef = useRef<AbortController | null>(null); const receiptTarget = useRef("");
  const [messages, setMessages] = useState<CareMessage[]>([]); const [nextCursor, setNextCursor] = useState<string | null>(null); const [policy, setPolicy] = useState<CommunicationPolicy | null>(null);
  const [phase, setPhase] = useState<Phase>("loading"); const [loadingOlder, setLoadingOlder] = useState(false); const [acknowledgedPolicyVersion, setAcknowledgedPolicyVersion] = useState<number | null>(null);
  const [content, setContent] = useState(""); const [sending, setSending] = useState(false); const [failed, setFailed] = useState<FailedSend | null>(null);
  const [error, setError] = useState<CanonicalCareError | null>(null); const [requestId, setRequestId] = useState("");
  const base = useMemo(() => context.relationshipId ? `/profissional/api/contextual/${context.profileId}/${context.pregnancyId}/relationships/${context.relationshipId}/messages` : "", [context]);
  const warningReady = Boolean(policy && isComposerPolicyAcknowledgable(policy)); const warningAccepted = Boolean(policy && acknowledgedPolicyVersion === policy.version); const composerEnabled = (phase === "ready" || phase === "empty") && warningReady && warningAccepted;

  const applyError = useCallback((parsed: CanonicalCareError, purge = false) => {
    setError(parsed); if (purge || deniedCodes.includes(parsed.code)) { setMessages([]); setNextCursor(null); setPolicy(null); setAcknowledgedPolicyVersion(null); }
    setPhase(deniedCodes.includes(parsed.code) ? "denied" : blockedCodes.includes(parsed.code) ? "blocked" : "error");
  }, []);

  const load = useCallback(async (cursor?: string) => {
    if (!base) { applyError({ code: "CARE_MESSAGE_CONVERSATION_NOT_FOUND", message: "Este contexto não possui vínculo de conversa.", requestId: "" }, true); return; }
    listRef.current?.abort(); const controller = new AbortController(); listRef.current = controller; if (cursor) setLoadingOlder(true); else setPhase("loading"); setError(null);
    const query = new URLSearchParams({ limit: "30", direction: "OLDER" }); if (cursor) query.set("cursor", cursor);
    try { const response = await fetch(`${base}?${query}`, { cache: "no-store", signal: controller.signal }); const body = await response.json().catch(() => ({})) as unknown; if (!response.ok) throw readCanonicalCareError(body, "Não foi possível carregar a conversa."); const page = parseMessagePage(body);
      if (!isComposerPolicyAcknowledgable(page.policy)) throw { code: "CARE_COMMUNICATION_POLICY_INVALID", message: "O aviso obrigatório não está disponível. O envio permanece bloqueado.", requestId: page.requestId } satisfies CanonicalCareError;
      setMessages((current) => cursor ? mergeMessages(current, page.messages) : mergeMessages([], page.messages)); setNextCursor(page.nextCursor); setPolicy(page.policy); setRequestId(page.requestId); setPhase(page.messages.length === 0 && !cursor ? "empty" : "ready");
    } catch (caught) { if (controller.signal.aborted) return; const parsed = caught && typeof caught === "object" && "code" in caught ? caught as CanonicalCareError : { code: navigator.onLine ? "UNKNOWN_ERROR" : "OFFLINE", message: navigator.onLine ? "Não foi possível carregar a conversa." : "Sem conexão. Tente novamente quando estiver online.", requestId: "" }; applyError(parsed, parsed.code === "CARE_COMMUNICATION_POLICY_INVALID"); }
    finally { if (!controller.signal.aborted) setLoadingOlder(false); }
  }, [applyError, base]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => { window.clearTimeout(timer); listRef.current?.abort(); sendRef.current?.abort(); receiptRef.current?.abort(); }; }, [load, sessionEpoch]);

  const sendReceipt = useCallback(async (target: CareMessage) => {
    if (!base || receiptTarget.current === target.id) return; receiptTarget.current = target.id; receiptRef.current?.abort(); const controller = new AbortController(); receiptRef.current = controller;
    const idempotencyKey = uuid();
    try { const response = await fetch(`${base}/read-receipts`, { method: "POST", headers: { "content-type": "application/json", "idempotency-key": idempotencyKey }, body: JSON.stringify({ throughMessageId: target.id }), signal: controller.signal }); const body = await response.json().catch(() => ({})) as unknown; if (!response.ok) throw readCanonicalCareError(body, "Não foi possível confirmar a leitura."); }
    catch (caught) { if (controller.signal.aborted) return; receiptTarget.current = ""; const parsed = caught && typeof caught === "object" && "code" in caught ? caught as CanonicalCareError : { code: "UNKNOWN_ERROR", message: "Não foi possível confirmar a leitura.", requestId: "" }; if (deniedCodes.includes(parsed.code) || blockedCodes.includes(parsed.code)) applyError(parsed, deniedCodes.includes(parsed.code)); else setError(parsed); }
  }, [applyError, base]);

  useEffect(() => { const target = [...messages].reverse().find((message) => message.authorProfileId !== context.profileId); if (!target) return; const timer = window.setTimeout(() => void sendReceipt(target), 0); return () => window.clearTimeout(timer); }, [context.profileId, messages, sendReceipt]);

  async function send(pending?: FailedSend) {
    if (!base || !composerEnabled || sending) return; const body = pending?.body || buildCareMessage(content, uuid()); if (!body.content || body.content.length > 5000) { setError({ code: "CARE_MESSAGE_CONTENT_INVALID", message: "Escreva uma mensagem de até 5000 caracteres.", requestId: "" }); return; }
    const idempotencyKey = pending?.key || uuid(); sendRef.current?.abort(); const controller = new AbortController(); sendRef.current = controller; setSending(true); setError(null);
    try { const response = await fetch(base, { method: "POST", headers: { "content-type": "application/json", "idempotency-key": idempotencyKey }, body: JSON.stringify(body), signal: controller.signal }); const payload = await response.json().catch(() => ({})) as unknown; if (!response.ok) throw readCanonicalCareError(payload, "Não foi possível enviar a mensagem."); const sent = parseSentMessage(payload); setMessages((current) => mergeMessages(current, [sent.message])); setRequestId(sent.requestId); setContent(""); setFailed(null); setPhase("ready"); }
    catch (caught) { if (controller.signal.aborted) return; const parsed = caught && typeof caught === "object" && "code" in caught ? caught as CanonicalCareError : { code: navigator.onLine ? "UNKNOWN_ERROR" : "OFFLINE", message: navigator.onLine ? "Não foi possível enviar a mensagem." : "Sem conexão. A mensagem não foi enviada.", requestId: "" }; setFailed({ body, key: idempotencyKey }); if (deniedCodes.includes(parsed.code) || blockedCodes.includes(parsed.code)) applyError(parsed, deniedCodes.includes(parsed.code)); else setError(parsed); }
    finally { if (!controller.signal.aborted) setSending(false); }
  }

  return <section className={styles.chatPanel} data-context-cache-key={`${sessionEpoch}:${context.profileId}:${context.pregnancyId}:${context.relationshipId}:messages`} aria-labelledby="care-chat-title" aria-busy={phase === "loading" || loadingOlder}>
    <div className={styles.sectionHeading}><div><span className={styles.kicker}>MT-06 · comunicação segura</span><h2 id="care-chat-title">Conversa com a paciente</h2></div>{requestId && <small>Identificador: {requestId}</small>}</div>
    {policy && <aside className={styles.communicationPolicy} aria-label="Informações de atendimento"><strong>Informações de resposta</strong>{policy.officeHours?.length ? <ul>{policy.officeHours.map((interval, index) => <li key={`${interval.dayOfWeek}-${interval.start}-${index}`}>{days[interval.dayOfWeek - 1]}: {interval.start}–{interval.end}</li>)}</ul> : <p>Horário de atendimento não publicado.</p>}{policy.timezone && <small>Fuso: {policy.timezone}</small>}{policy.expectedResponseBusinessHours ? <p>Expectativa informada: até {policy.expectedResponseBusinessHours} hora(s) úteis. Isso não é garantia de prazo.</p> : <p>Sem expectativa numérica de resposta publicada.</p>}</aside>}
    {phase === "loading" && <div className={styles.inlineLoading} role="status">Carregando conversa…</div>}
    {phase === "denied" && <div className={styles.error} role="alert"><strong>Conversa indisponível ou acesso revogado</strong><p>{error?.message}</p>{error?.requestId && <small>Identificador: {error.requestId}</small>}</div>}
    {phase === "blocked" && <div className={styles.error} role="alert"><strong>Envio bloqueado</strong><p>{error?.message}</p><p>Novas mensagens não podem ser enviadas neste vínculo.</p>{error?.requestId && <small>Identificador: {error.requestId}</small>}</div>}
    {phase === "error" && <div className={styles.error} role="alert"><strong>Não foi possível carregar a conversa</strong><p>{error?.message}</p>{error?.requestId && <small>Identificador: {error.requestId}</small>}<button className={styles.secondaryButton} onClick={() => void load()}>Tentar novamente</button></div>}
    {nextCursor && !["denied", "error"].includes(phase) && <button className={styles.secondaryButton} disabled={loadingOlder} onClick={() => void load(nextCursor)}>{loadingOlder ? "Carregando…" : "Carregar mensagens anteriores"}</button>}
    {(messages.length > 0 || phase === "empty") && <div className={styles.messageList} aria-live="polite">{messages.length === 0 ? <div className={styles.emptyState}><strong>Nenhuma mensagem</strong><p>Inicie a conversa após reconhecer o aviso abaixo.</p></div> : messages.map((message) => { const own = message.authorProfileId === context.profileId; return <article key={message.id} className={own ? styles.ownMessage : styles.counterpartyMessage}><p>{message.content}</p><small>{dateTime(message.createdAt)}{own ? message.readByCounterpartyAt ? ` · lida em ${dateTime(message.readByCounterpartyAt)}` : " · enviada" : ""}</small></article>; })}</div>}
    {warningReady && policy && <div className={styles.nonEmergencyWarning} role="note"><strong>Este canal não é para urgências</strong><p>Ele não substitui atendimento médico, serviço de emergência ou orientação imediata.</p><label><input type="checkbox" checked={warningAccepted} onChange={(event) => setAcknowledgedPolicyVersion(event.target.checked ? policy.version : null)} /> Li e entendi o aviso desta conversa.</label></div>}
    {!warningReady && phase !== "loading" && <div className={styles.error} role="alert">O aviso obrigatório não está disponível. O envio permanece desabilitado.</div>}
    {error && !["error", "denied", "blocked"].includes(phase) && <div className={styles.error} role="alert"><strong>Não foi possível concluir</strong><p>{error.message}</p>{error.requestId && <small>Identificador: {error.requestId}</small>}</div>}
    {failed && !blockedCodes.includes(error?.code || "") && !deniedCodes.includes(error?.code || "") && <div className={styles.failedMessage} role="status"><span>Mensagem não enviada. O retry preserva o mesmo identificador.</span><div className={styles.relationshipActions}><button className={styles.secondaryButton} disabled={sending} onClick={() => void send(failed)}>Tentar novamente</button><button className={styles.textButton} onClick={() => setFailed(null)}>Descartar tentativa</button></div></div>}
    <form className={styles.chatComposer} onSubmit={(event) => { event.preventDefault(); void send(); }}><label htmlFor="care-message">Mensagem</label><textarea id="care-message" maxLength={5000} disabled={!composerEnabled || sending || Boolean(failed)} value={content} onChange={(event) => setContent(event.target.value)} /><div><small>{content.length}/5000</small><button className={styles.primaryButton} disabled={!composerEnabled || sending || Boolean(failed) || !content.trim()}>{sending ? "Enviando…" : "Enviar"}</button></div></form>
  </section>;
}

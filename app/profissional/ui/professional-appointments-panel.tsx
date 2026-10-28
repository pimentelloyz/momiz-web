"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CanonicalCareError, ResolvedCareContext } from "../../../lib/professional/care-context";
import { readCanonicalCareError, uuidPattern } from "../../../lib/professional/care-context";
import {
  appendAppointments, appointmentActionAllowed, appointmentModalities, appointmentStatusLabel, buildProfessionalAppointmentProposal,
  localDateTimeWithOffset, parseAppointmentEvents, parseAppointmentMutation, parseAppointmentsPage,
  type AppointmentEvent, type CareAppointment,
} from "../../../lib/professional/care-appointments";
import styles from "./professional.module.css";

type Props = { context: ResolvedCareContext; professionalProfileId: string; sessionEpoch: string };
type Phase = "loading" | "ready" | "empty" | "filter-empty" | "error" | "denied";
const deniedCodes = ["CARE_RELATIONSHIP_NOT_ACTIVE", "CARE_SCOPE_DENIED", "HEALTH_APPOINTMENT_NOT_FOUND", "CARE_PROFILE_ACCESS_DENIED"];
const conflictCodes = ["APPOINTMENT_VERSION_CONFLICT", "APPOINTMENT_TIME_CONFLICT", "APPOINTMENT_TRANSITION_NOT_ALLOWED", "APPOINTMENT_RESPONSE_BY_PROPOSER"];

function key() { return globalThis.crypto?.randomUUID() || `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function dateLabel(value: string, timezone: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Data indisponível" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short", timeZone: timezone || undefined }).format(date); }
function actionLabel(action: string) { return ({ ACCEPT: "Aceitar", DECLINE: "Recusar", CANCEL: "Cancelar", COMPLETE: "Concluir", MARK_NO_SHOW: "Marcar ausência", REQUEST_RESCHEDULE: "Solicitar reagendamento", ACCEPT_RESCHEDULE: "Aceitar novo horário", DECLINE_RESCHEDULE: "Recusar novo horário" } as Record<string, string>)[action] || action; }

export function ProfessionalAppointmentsPanel({ context, professionalProfileId, sessionEpoch }: Props) {
  const requestRef = useRef<AbortController | null>(null); const operationRef = useRef<AbortController | null>(null); const mutationKeys = useRef(new Map<string, string>());
  const [items, setItems] = useState<CareAppointment[]>([]); const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("loading"); const [loadingMore, setLoadingMore] = useState(false);
  const [from, setFrom] = useState(""); const [to, setTo] = useState(""); const [status, setStatus] = useState("");
  const [error, setError] = useState<CanonicalCareError | null>(null); const [requestId, setRequestId] = useState("");
  const [showCreate, setShowCreate] = useState(false); const [selected, setSelected] = useState<CareAppointment | null>(null);
  const [events, setEvents] = useState<AppointmentEvent[]>([]); const [eventRequestId, setEventRequestId] = useState(""); const [eventLoading, setEventLoading] = useState(false);
  const [mutationError, setMutationError] = useState<CanonicalCareError | null>(null); const [mutating, setMutating] = useState(false);
  const [startsAt, setStartsAt] = useState(""); const [endsAt, setEndsAt] = useState("");
  const browserTimezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []); const [timezone, setTimezone] = useState(browserTimezone);
  const [modality, setModality] = useState<(typeof appointmentModalities)[number]>("IN_PERSON"); const [title, setTitle] = useState("Consulta"); const [location, setLocation] = useState(""); const [meetingUrl, setMeetingUrl] = useState("");
  const [rescheduleStart, setRescheduleStart] = useState(""); const [rescheduleEnd, setRescheduleEnd] = useState("");
  const base = useMemo(() => `/profissional/api/contextual/${context.profileId}/${context.pregnancyId}/appointments`, [context]); const filtered = Boolean(from || to || status);

  const load = useCallback(async (cursor?: string) => {
    requestRef.current?.abort(); const controller = new AbortController(); requestRef.current = controller;
    if (cursor) setLoadingMore(true); else setPhase("loading"); setError(null);
    const query = new URLSearchParams({ limit: "20" }); if (cursor) query.set("cursor", cursor); if (from) query.set("from", localDateTimeWithOffset(`${from}T00:00`, browserTimezone, browserTimezone) || from); if (to) query.set("to", localDateTimeWithOffset(`${to}T23:59`, browserTimezone, browserTimezone) || to); if (status) query.set("status", status);
    try {
      const response = await fetch(`${base}?${query}`, { cache: "no-store", signal: controller.signal }); const body = await response.json().catch(() => ({})) as unknown;
      if (!response.ok) throw readCanonicalCareError(body, "Não foi possível carregar a agenda."); const page = parseAppointmentsPage(body);
      if (page.items.some((item) => item.status === "UNKNOWN" || item.modality === "UNKNOWN")) throw { code: "APPOINTMENT_RESPONSE_INVALID", message: "A API retornou um estado ainda não suportado.", requestId: page.requestId } satisfies CanonicalCareError;
      setItems((current) => cursor ? appendAppointments(current, page.items) : page.items); setNextCursor(page.nextCursor); setRequestId(page.requestId); setPhase(!cursor && page.items.length === 0 ? filtered ? "filter-empty" : "empty" : "ready");
    } catch (caught) {
      if (controller.signal.aborted) return; const parsed = caught && typeof caught === "object" && "code" in caught ? caught as CanonicalCareError : { code: navigator.onLine ? "UNKNOWN_ERROR" : "OFFLINE", message: navigator.onLine ? "Não foi possível carregar a agenda." : "Sem conexão. Tente novamente quando estiver online.", requestId: "" };
      if (deniedCodes.includes(parsed.code) || parsed.code === "APPOINTMENT_RESPONSE_INVALID") { setItems([]); setNextCursor(null); setSelected(null); }
      setError(parsed); setPhase(deniedCodes.includes(parsed.code) ? "denied" : "error");
    } finally { if (!controller.signal.aborted) setLoadingMore(false); }
  }, [base, browserTimezone, filtered, from, setSelected, status, to]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => { window.clearTimeout(timer); requestRef.current?.abort(); operationRef.current?.abort(); }; }, [load, sessionEpoch]);

  async function mutate(path: string, body: object, intent: string) {
    operationRef.current?.abort(); const controller = new AbortController(); operationRef.current = controller;
    const idempotencyKey = mutationKeys.current.get(intent) || key(); mutationKeys.current.set(intent, idempotencyKey); setMutating(true); setMutationError(null);
    try {
      const response = await fetch(`${base}${path}`, { method: "POST", headers: { "content-type": "application/json", "idempotency-key": idempotencyKey }, body: JSON.stringify(body), signal: controller.signal }); const payload = await response.json().catch(() => ({})) as unknown;
      if (!response.ok) throw readCanonicalCareError(payload, "Não foi possível atualizar a consulta."); const result = parseAppointmentMutation(payload); mutationKeys.current.delete(intent);
      setRequestId(result.requestId); setSelected(result.appointment); setItems((current) => current.some((item) => item.id === result.appointment.id) ? current.map((item) => item.id === result.appointment.id ? result.appointment : item) : [result.appointment, ...current]); await load(); return true;
    } catch (caught) {
      if (controller.signal.aborted) return false;
      const parsed = caught && typeof caught === "object" && "code" in caught ? caught as CanonicalCareError : { code: "UNKNOWN_ERROR", message: "Não foi possível atualizar a consulta.", requestId: "" };
      if (deniedCodes.includes(parsed.code)) { setItems((current) => selected ? current.filter((item) => item.id !== selected.id) : current); setSelected(null); }
      if (conflictCodes.includes(parsed.code)) await load(); setMutationError(parsed); return false;
    } finally { setMutating(false); }
  }

  async function createProposal(event: React.FormEvent) {
    event.preventDefault(); const start = localDateTimeWithOffset(startsAt, timezone, browserTimezone); const end = localDateTimeWithOffset(endsAt, timezone, browserTimezone);
    if (!uuidPattern.test(professionalProfileId) || !context.relationshipId || !start || !end || new Date(end) <= new Date(start)) { setMutationError({ code: "APPOINTMENT_LOCAL_TIME_INVALID", message: "Revise vínculo, intervalo e zona. Horários inexistentes ou ambíguos por mudança de fuso não são ajustados automaticamente.", requestId: "" }); return; }
    const body = buildProfessionalAppointmentProposal({ relationshipId: context.relationshipId, responsibleProfessionalProfileId: professionalProfileId, startsAt: start, endAt: end, timezone, modality, title: title.trim() || "Consulta", ...(modality !== "REMOTE" && location.trim() ? { location: location.trim() } : {}), ...(modality !== "IN_PERSON" && meetingUrl.trim() ? { meetingUrl: meetingUrl.trim() } : {}) });
    if (await mutate("", body, `create:${JSON.stringify(body)}`)) { setShowCreate(false); setStartsAt(""); setEndsAt(""); setLocation(""); setMeetingUrl(""); }
  }

  async function transition(item: CareAppointment, action: string) {
    const mapping: Record<string, { path: string; body: object }> = {
      ACCEPT: { path: `/${item.id}/respond`, body: { action: "ACCEPT", expectedVersion: item.version } }, DECLINE: { path: `/${item.id}/respond`, body: { action: "DECLINE", expectedVersion: item.version } },
      ACCEPT_RESCHEDULE: { path: `/${item.id}/reschedule/respond`, body: { action: "ACCEPT", expectedVersion: item.version } }, DECLINE_RESCHEDULE: { path: `/${item.id}/reschedule/respond`, body: { action: "DECLINE", expectedVersion: item.version } },
      CANCEL: { path: `/${item.id}/cancel`, body: { expectedVersion: item.version } }, COMPLETE: { path: `/${item.id}/complete`, body: { expectedVersion: item.version } }, MARK_NO_SHOW: { path: `/${item.id}/no-show`, body: { expectedVersion: item.version } },
    }; const operation = mapping[action]; if (operation) await mutate(operation.path, operation.body, `${action}:${item.id}:${item.version}`);
  }

  async function requestReschedule(event: React.FormEvent) {
    event.preventDefault(); if (!selected) return; const start = localDateTimeWithOffset(rescheduleStart, timezone, browserTimezone); const end = localDateTimeWithOffset(rescheduleEnd, timezone, browserTimezone);
    if (!start || !end || new Date(end) <= new Date(start)) { setMutationError({ code: "APPOINTMENT_LOCAL_TIME_INVALID", message: "Informe um intervalo local válido.", requestId: "" }); return; }
    await mutate(`/${selected.id}/reschedule`, { expectedVersion: selected.version, startsAt: start, endAt: end, timezone }, `reschedule:${selected.id}:${selected.version}:${start}:${end}`);
  }

  async function loadHistory(item: CareAppointment) {
    operationRef.current?.abort(); const controller = new AbortController(); operationRef.current = controller; setSelected(item); setEvents([]); setEventLoading(true); setMutationError(null);
    try { const response = await fetch(`${base}/${item.id}/events?limit=25`, { cache: "no-store", signal: controller.signal }); const body = await response.json().catch(() => ({})) as unknown; if (!response.ok) throw readCanonicalCareError(body, "Não foi possível carregar o histórico."); const page = parseAppointmentEvents(body); setEvents(page.items); setEventRequestId(page.requestId); }
    catch (caught) { if (!controller.signal.aborted) setMutationError(caught && typeof caught === "object" && "code" in caught ? caught as CanonicalCareError : { code: "UNKNOWN_ERROR", message: "Não foi possível carregar o histórico.", requestId: "" }); } finally { if (!controller.signal.aborted) setEventLoading(false); }
  }

  async function exportIcs() {
    if (!from || !to) { setMutationError({ code: "ICS_INTERVAL_REQUIRED", message: "Informe data inicial e final para exportar.", requestId: "" }); return; }
    try { const query = new URLSearchParams({ from: localDateTimeWithOffset(`${from}T00:00`, browserTimezone, browserTimezone) || from, to: localDateTimeWithOffset(`${to}T23:59`, browserTimezone, browserTimezone) || to }); const response = await fetch(`${base}/calendar.ics?${query}`, { cache: "no-store" }); if (!response.ok) throw readCanonicalCareError(await response.json().catch(() => ({})), "Não foi possível exportar a agenda."); const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "agenda-momiz.ics"; link.click(); URL.revokeObjectURL(url); }
    catch (caught) { setMutationError(caught && typeof caught === "object" && "code" in caught ? caught as CanonicalCareError : { code: "UNKNOWN_ERROR", message: "Não foi possível exportar a agenda.", requestId: "" }); }
  }

  return <section className={styles.appointmentPanel} data-context-cache-key={`${sessionEpoch}:${context.profileId}:${context.pregnancyId}:appointments`} aria-labelledby="appointments-title" aria-busy={phase === "loading" || loadingMore}>
    <div className={styles.sectionHeading}><div><span className={styles.kicker}>MT-05 · agenda v2</span><h2 id="appointments-title" tabIndex={-1}>Consultas do contexto</h2></div><div className={styles.relationshipActions}><button className={styles.secondaryButton} onClick={() => void exportIcs()}>Exportar ICS</button><button className={styles.primaryButton} onClick={() => setShowCreate((value) => !value)}>Nova proposta</button></div></div>
    <div className={styles.appointmentFilters}><label>De<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label>Até<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label><label>Situação<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Todas</option>{["PROPOSED", "CONFIRMED", "RESCHEDULE_REQUESTED", "CANCELED", "COMPLETED", "NO_SHOW"].map((value) => <option key={value} value={value}>{appointmentStatusLabel(value as CareAppointment["status"])}</option>)}</select></label></div>
    {showCreate && <form className={styles.appointmentForm} onSubmit={createProposal}><h3>Propor consulta</h3><p className={styles.relationshipNotice}>Paciente e gestação são derivados pela API a partir do vínculo selecionado neste contexto.</p><label>Início<input required type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></label><label>Fim<input required type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></label><label>Zona IANA<input required value={timezone} onChange={(event) => setTimezone(event.target.value)} /><small>Para validar DST no cliente, use a zona deste navegador: {browserTimezone}.</small></label><label>Modalidade<select value={modality} onChange={(event) => setModality(event.target.value as typeof modality)}>{appointmentModalities.map((value) => <option value={value} key={value}>{value === "IN_PERSON" ? "Presencial" : value === "REMOTE" ? "Remota" : "Híbrida"}</option>)}</select></label><label>Título logístico<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>{modality !== "REMOTE" && <label>Local<input value={location} onChange={(event) => setLocation(event.target.value)} /></label>}{modality !== "IN_PERSON" && <label>Link da reunião<input type="url" value={meetingUrl} onChange={(event) => setMeetingUrl(event.target.value)} /></label>}<button className={styles.primaryButton} disabled={mutating}>{mutating ? "Enviando…" : "Enviar proposta"}</button></form>}
    {mutationError && <div className={styles.error} role="alert"><strong>{conflictCodes.includes(mutationError.code) ? "A agenda mudou ou há conflito" : "Não foi possível concluir"}</strong><p>{mutationError.message}</p>{mutationError.requestId && <small>Identificador: {mutationError.requestId}</small>}{conflictCodes.includes(mutationError.code) && <p>A agenda foi recarregada. Revise os dados antes de tentar novamente.</p>}</div>}
    {phase === "loading" && <div className={styles.inlineLoading} role="status">Carregando agenda…</div>}
    {phase === "empty" && <div className={styles.emptyState}><strong>Nenhuma consulta</strong><p>Propostas e compromissos autorizados aparecerão aqui.</p></div>}
    {phase === "filter-empty" && <div className={styles.emptyState}><strong>Nenhum resultado no período</strong><button className={styles.secondaryButton} onClick={() => { setFrom(""); setTo(""); setStatus(""); }}>Limpar filtros</button></div>}
    {phase === "denied" && <div className={styles.error} role="alert"><strong>Acesso revogado ou negado</strong><p>{error?.message}</p>{error?.requestId && <small>Identificador: {error.requestId}</small>}</div>}
    {phase === "error" && <div className={styles.error} role="alert"><strong>Não foi possível carregar a agenda</strong><p>{error?.message}</p>{error?.requestId && <small>Identificador: {error.requestId}</small>}<button className={styles.secondaryButton} onClick={() => void load()}>Tentar novamente</button></div>}
    {items.length > 0 && <div className={styles.v2AppointmentList}>{items.map((item) => { const actions = new Set(item.allowedActions); if (actions.has("RESPOND")) { actions.add("ACCEPT"); actions.add("DECLINE"); } if (actions.has("RESPOND_RESCHEDULE") || actions.has("RESCHEDULE_RESPOND")) { actions.add("ACCEPT_RESCHEDULE"); actions.add("DECLINE_RESCHEDULE"); } return <article key={item.id} className={styles.v2AppointmentCard}><div><time>{dateLabel(item.startsAt, item.timezone)} – {dateLabel(item.endAt, item.timezone)}</time><strong>{item.title}</strong><span>{item.modality === "IN_PERSON" ? "Presencial" : item.modality === "REMOTE" ? "Remota" : "Híbrida"} · {item.timezone}</span></div><span className={styles.statusBadge}>{appointmentStatusLabel(item.status)}</span>{item.status === "RESCHEDULE_REQUESTED" && <div className={styles.pendingSlot}><strong>Horário vigente</strong><span>{dateLabel(item.startsAt, item.timezone)}</span><strong>Horário proposto</strong><span>{item.pendingStartsAt ? dateLabel(item.pendingStartsAt, item.pendingTimezone || item.timezone) : "Indisponível"}</span></div>}<div className={styles.relationshipActions}>{["ACCEPT", "DECLINE", "ACCEPT_RESCHEDULE", "DECLINE_RESCHEDULE", "CANCEL", "COMPLETE", "MARK_NO_SHOW"].filter((action) => actions.has(action)).map((action) => <button key={action} className={action.includes("DECLINE") || action === "CANCEL" ? styles.dangerButton : styles.secondaryButton} disabled={mutating} onClick={() => void transition(item, action)}>{actionLabel(action)}</button>)}{appointmentActionAllowed(item, "REQUEST_RESCHEDULE", "RESCHEDULE") && <button className={styles.secondaryButton} onClick={() => setSelected(item)}>Solicitar reagendamento</button>}<button className={styles.textButton} onClick={() => void loadHistory(item)}>Ver histórico</button></div></article>; })}</div>}
    {nextCursor && phase === "ready" && <button className={styles.secondaryButton} disabled={loadingMore} onClick={() => void load(nextCursor)}>{loadingMore ? "Carregando…" : "Carregar mais"}</button>}{requestId && phase === "ready" && <small className={styles.readerRequestId}>Identificador: {requestId}</small>}
    {selected && <section className={styles.appointmentDetail} aria-labelledby="appointment-detail-title"><div className={styles.sectionHeading}><h3 id="appointment-detail-title">Consulta · {appointmentStatusLabel(selected.status)}</h3><button className={styles.textButton} onClick={() => { setSelected(null); setEvents([]); }}>Fechar</button></div>{appointmentActionAllowed(selected, "REQUEST_RESCHEDULE", "RESCHEDULE") && <form className={styles.rescheduleForm} onSubmit={requestReschedule}><strong>Novo horário proposto</strong><label>Início<input required type="datetime-local" value={rescheduleStart} onChange={(event) => setRescheduleStart(event.target.value)} /></label><label>Fim<input required type="datetime-local" value={rescheduleEnd} onChange={(event) => setRescheduleEnd(event.target.value)} /></label><button className={styles.primaryButton} disabled={mutating}>Solicitar reagendamento</button></form>}<div className={styles.appointmentHistory}><strong>Histórico imutável</strong>{eventLoading && <span role="status">Carregando histórico…</span>}{!eventLoading && events.length === 0 && <span>Abra “Ver histórico” para carregar os eventos.</span>}{events.map((event) => <article key={event.id}><span>{event.action} · versão {event.appointmentVersion}</span><small>{appointmentStatusLabel(event.fromStatus)} → {appointmentStatusLabel(event.toStatus)} · {dateLabel(event.createdAt, selected.timezone)}</small></article>)}{eventRequestId && <small>Identificador: {eventRequestId}</small>}</div></section>}
  </section>;
}

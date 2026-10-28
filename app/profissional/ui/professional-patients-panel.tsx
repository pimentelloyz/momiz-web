"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CanonicalCareError } from "../../../lib/professional/care-context";
import { readCanonicalCareError } from "../../../lib/professional/care-context";
import {
  appendPatientPage,
  isPatientCardAvailable,
  parseProfessionalPatientsPage,
  ProfessionalPatient,
  relationshipStatusLabel,
} from "../../../lib/professional/professional-patients";
import styles from "./professional.module.css";

type Props = { profileId: string; sessionEpoch: string };
type Phase = "loading" | "ready" | "empty" | "filter-empty" | "error" | "denied";

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function ProfessionalPatientsPanel({ profileId, sessionEpoch }: Props) {
  const requestRef = useRef<AbortController | null>(null);
  const [items, setItems] = useState<ProfessionalPatient[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState("ACTIVE,READ_ONLY");
  const [pregnancyStatus, setPregnancyStatus] = useState("ACTIVE");
  const [phase, setPhase] = useState<Phase>("loading");
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<CanonicalCareError | null>(null);
  const [requestId, setRequestId] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const filters = useMemo(() => ({ q: debouncedSearch, relationshipStatus, pregnancyStatus }), [debouncedSearch, relationshipStatus, pregnancyStatus]);

  const load = useCallback(async (cursor?: string) => {
    if (filters.q.length === 1) {
      requestRef.current?.abort(); setItems([]); setNextCursor(null); setPhase("filter-empty");
      return;
    }
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    if (cursor) setLoadingMore(true); else setPhase("loading");
    setError(null);
    const query = new URLSearchParams({ limit: "25", relationshipStatus: filters.relationshipStatus, pregnancyStatus: filters.pregnancyStatus });
    if (filters.q) query.set("q", filters.q);
    if (cursor) query.set("cursor", cursor);
    try {
      const response = await fetch(`/profissional/api/patients/${profileId}?${query}`, { cache: "no-store", signal: controller.signal });
      const body = await response.json().catch(() => ({})) as unknown;
      if (!response.ok) throw readCanonicalCareError(body, "Não foi possível carregar as pacientes.");
      const page = parseProfessionalPatientsPage(body);
      if (page.items.some((item) => item.relationshipStatus === "UNKNOWN" || item.pregnancyStatus === "UNKNOWN")) {
        await fetch(`/profissional/api/patients/${profileId}`, { method: "DELETE" });
        throw { code: "CARE_PATIENT_RESPONSE_INVALID", message: "A API retornou um estado ainda não suportado.", requestId: page.requestId } satisfies CanonicalCareError;
      }
      setItems((current) => cursor ? appendPatientPage(current, page.items) : page.items);
      setNextCursor(page.nextCursor);
      setRequestId(page.requestId);
      setPhase(page.items.length === 0 && !cursor ? filters.q || relationshipStatus !== "ACTIVE,READ_ONLY" || pregnancyStatus !== "ACTIVE" ? "filter-empty" : "empty" : "ready");
    } catch (caught) {
      if (controller.signal.aborted) return;
      const parsed = caught && typeof caught === "object" && "code" in caught ? caught as CanonicalCareError : {
        code: navigator.onLine ? "UNKNOWN_ERROR" : "OFFLINE", message: navigator.onLine ? "Não foi possível carregar as pacientes." : "Sem conexão. Tente novamente quando estiver online.", requestId: "",
      };
      if (["CARE_PROFILE_ACCESS_DENIED", "CARE_CONTEXT_TYPE_DENIED", "CARE_PATIENT_RESPONSE_INVALID"].includes(parsed.code)) {
        setItems([]); setNextCursor(null);
      }
      if (["CARE_PATIENT_CURSOR_EXPIRED", "CARE_PATIENT_CURSOR_INVALID", "CARE_PATIENT_CURSOR_MISMATCH"].includes(parsed.code)) setNextCursor(null);
      setError(parsed);
      setPhase(["CARE_PROFILE_ACCESS_DENIED", "CARE_CONTEXT_TYPE_DENIED"].includes(parsed.code) ? "denied" : "error");
    } finally {
      if (!controller.signal.aborted) setLoadingMore(false);
    }
  }, [filters, pregnancyStatus, profileId, relationshipStatus]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => { window.clearTimeout(timer); requestRef.current?.abort(); };
  }, [load, sessionEpoch]);

  function resetFilters() {
    setSearch(""); setDebouncedSearch(""); setRelationshipStatus("ACTIVE,READ_ONLY"); setPregnancyStatus("ACTIVE");
  }

  return (
    <section className={styles.professionalPatientsPanel} aria-labelledby="professional-patients-title" aria-busy={phase === "loading" || loadingMore}>
      <div className={styles.sectionHeading}><div><span className={styles.kicker}>Pacientes</span><h2 id="professional-patients-title">Vínculos autorizados</h2></div><span aria-live="polite">{items.length} exibida(s)</span></div>
      <div className={styles.patientReaderFilters}>
        <label>Buscar por nome<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Digite ao menos 2 caracteres" /></label>
        <label>Situação do vínculo<select value={relationshipStatus} onChange={(event) => setRelationshipStatus(event.target.value)}><option value="ACTIVE,READ_ONLY">Ativos e somente leitura</option><option value="ACTIVE">Ativos</option><option value="READ_ONLY">Somente leitura</option><option value="PENDING_VERIFICATION">Aguardando verificação</option><option value="PAUSED">Pausados</option></select></label>
        <label>Situação da gestação<select value={pregnancyStatus} onChange={(event) => setPregnancyStatus(event.target.value)}><option value="ACTIVE">Ativa</option><option value="ARCHIVED">Arquivada</option></select></label>
      </div>
      {phase === "loading" && <div className={styles.inlineLoading} role="status">Carregando pacientes autorizadas…</div>}
      {phase === "empty" && <div className={styles.emptyState}><strong>Nenhuma paciente vinculada</strong><p>Os vínculos ativos e autorizados aparecerão aqui.</p></div>}
      {phase === "filter-empty" && <div className={styles.emptyState}><strong>Nenhum resultado para estes filtros</strong><p>{debouncedSearch.length === 1 ? "Digite ao menos dois caracteres para buscar." : "Ajuste a busca ou os filtros."}</p><button className={styles.secondaryButton} onClick={resetFilters}>Limpar filtros</button></div>}
      {phase === "denied" && <div className={styles.error} role="alert"><strong>Acesso revogado ou negado</strong><p>{error?.message}</p>{error?.requestId && <small>Identificador: {error.requestId}</small>}</div>}
      {phase === "error" && <div className={styles.error} role="alert"><strong>Não foi possível carregar as pacientes</strong><p>{error?.message}</p>{error?.requestId && <small>Identificador: {error.requestId}</small>}<button className={styles.secondaryButton} onClick={() => void load()}>Tentar novamente</button></div>}
      {items.length > 0 && <div className={styles.professionalPatientGrid}>{items.map((item) => {
        const available = isPatientCardAvailable(item.relationshipStatus);
        return <article className={available ? styles.professionalPatientCard : styles.professionalPatientCardUnavailable} key={item.relationshipId}>
          <div className={styles.avatar} aria-hidden="true">{initials(item.patient.displayName)}</div>
          <div><strong>{item.patient.displayName}</strong><span>{relationshipStatusLabel(item.relationshipStatus)} · gestação {item.pregnancyStatus === "ARCHIVED" ? "arquivada" : item.pregnancyStatus === "ACTIVE" ? "ativa" : "indisponível"}</span></div>
          {item.summary.unreadMessages !== undefined && <span className={styles.unreadBadge} aria-label={`${item.summary.unreadMessages} mensagens não lidas`}>{item.summary.unreadMessages > 999 ? "999+" : item.summary.unreadMessages} não lida(s)</span>}
          {!available && <p>Resumos clínicos ficam ocultos neste estado.</p>}
          {available && <small>O detalhe será aberto somente quando houver rota v2 autorizada.</small>}
        </article>;
      })}</div>}
      {nextCursor && phase === "ready" && <button className={styles.secondaryButton} disabled={loadingMore} onClick={() => void load(nextCursor)}>{loadingMore ? "Carregando…" : "Carregar mais"}</button>}
      {requestId && phase === "ready" && <small className={styles.readerRequestId}>Identificador: {requestId}</small>}
    </section>
  );
}

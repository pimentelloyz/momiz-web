"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CanonicalCareError, CareContextSelection } from "../../../lib/professional/care-context";
import { readCanonicalCareError } from "../../../lib/professional/care-context";
import {
  appendSharedDocuments,
  canOpenSharedDocument,
  documentCategories,
  documentCategoryLabel,
  documentStatusLabel,
  parseDocumentCollaboration,
  parseSharedDocumentsPage,
  type DocumentCollaboration,
  type SharedDocument,
} from "../../../lib/professional/care-documents";
import styles from "./professional.module.css";

type Props = { context: CareContextSelection; sessionEpoch: string };
type Phase = "loading" | "ready" | "empty" | "filter-empty" | "error" | "denied";
const deniedCodes = ["DOCUMENT_SHARE_REQUIRED", "DOCUMENT_NOT_FOUND", "CARE_SCOPE_REQUIRED", "CARE_PROFILE_ACCESS_DENIED", "PREGNANCY_CONTEXT_DENIED"];

function idempotencyKey() { return globalThis.crypto?.randomUUID() || `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function formatDate(value: string | null) {
  if (!value) return "Data clínica não informada";
  const date = new Date(value); return Number.isNaN(date.getTime()) ? "Data indisponível" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
}
function formatSize(value: number) { return value < 1024 * 1024 ? `${Math.max(1, Math.round(value / 1024))} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`; }
function safeDownloadUrl(value: unknown) {
  if (typeof value !== "string") return null;
  try { const url = new URL(value); return url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname)) ? url.href : null; } catch { return null; }
}

export function ProfessionalDocumentsPanel({ context, sessionEpoch }: Props) {
  const requestRef = useRef<AbortController | null>(null);
  const operationRef = useRef<AbortController | null>(null);
  const mutationKeys = useRef(new Map<string, string>());
  const [items, setItems] = useState<SharedDocument[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [tag, setTag] = useState("");
  const [error, setError] = useState<CanonicalCareError | null>(null);
  const [requestId, setRequestId] = useState("");
  const [selected, setSelected] = useState<SharedDocument | null>(null);
  const [collaboration, setCollaboration] = useState<DocumentCollaboration | null>(null);
  const [collaborationError, setCollaborationError] = useState<CanonicalCareError | null>(null);
  const [note, setNote] = useState("");
  const [comment, setComment] = useState("");
  const [mutating, setMutating] = useState(false);
  const base = useMemo(() => `/profissional/api/contextual/${context.profileId}/${context.pregnancyId}/documents`, [context]);
  const filtered = Boolean(query || category || dateFrom || dateTo || tag.trim());

  useEffect(() => { const timer = window.setTimeout(() => setQuery(search.trim()), 350); return () => window.clearTimeout(timer); }, [search]);

  const revokeLocalAccess = useCallback((documentId?: string) => {
    if (documentId) setItems((current) => current.filter((item) => item.id !== documentId)); else setItems([]);
    setSelected(null); setCollaboration(null); setNextCursor(null);
  }, []);

  const load = useCallback(async (cursor?: string) => {
    requestRef.current?.abort(); const controller = new AbortController(); requestRef.current = controller;
    if (cursor) setLoadingMore(true); else setPhase("loading"); setError(null);
    const params = new URLSearchParams({ limit: "25" });
    if (cursor) params.set("cursor", cursor); if (query) params.set("q", query); if (category) params.set("clinicalCategory", category);
    if (dateFrom) params.set("clinicalDateFrom", dateFrom); if (dateTo) params.set("clinicalDateTo", dateTo); if (tag.trim()) params.append("tags", tag.trim());
    try {
      const response = await fetch(`${base}?${params}`, { cache: "no-store", signal: controller.signal });
      const body = await response.json().catch(() => ({})) as unknown;
      if (!response.ok) throw readCanonicalCareError(body, "Não foi possível carregar os documentos.");
      const page = parseSharedDocumentsPage(body);
      if (page.items.some((item) => item.status === "UNKNOWN" || item.clinicalCategory === "UNKNOWN")) throw { code: "DOCUMENT_RESPONSE_INVALID", message: "A API retornou um estado ainda não suportado.", requestId: page.requestId } satisfies CanonicalCareError;
      setItems((current) => cursor ? appendSharedDocuments(current, page.items) : page.items); setNextCursor(page.nextCursor); setRequestId(page.requestId);
      setPhase(!cursor && page.items.length === 0 ? filtered ? "filter-empty" : "empty" : "ready");
    } catch (caught) {
      if (controller.signal.aborted) return;
      const parsed = caught && typeof caught === "object" && "code" in caught ? caught as CanonicalCareError : { code: navigator.onLine ? "UNKNOWN_ERROR" : "OFFLINE", message: navigator.onLine ? "Não foi possível carregar os documentos." : "Sem conexão. Tente novamente quando estiver online.", requestId: "" };
      if (deniedCodes.includes(parsed.code) || parsed.code === "DOCUMENT_RESPONSE_INVALID") revokeLocalAccess();
      setError(parsed); setPhase(deniedCodes.includes(parsed.code) ? "denied" : "error");
    } finally { if (!controller.signal.aborted) setLoadingMore(false); }
  }, [base, category, dateFrom, dateTo, filtered, query, revokeLocalAccess, tag]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => { window.clearTimeout(timer); requestRef.current?.abort(); operationRef.current?.abort(); }; }, [load, sessionEpoch]);

  async function openCollaboration(document: SharedDocument) {
    operationRef.current?.abort(); const controller = new AbortController(); operationRef.current = controller;
    setSelected(document); setCollaboration(null); setCollaborationError(null); setNote("");
    if (!canOpenSharedDocument(document)) return;
    try {
      const response = await fetch(`${base}/${document.id}/collaboration`, { cache: "no-store", signal: controller.signal }); const body = await response.json().catch(() => ({})) as unknown;
      if (!response.ok) throw readCanonicalCareError(body, "Não foi possível carregar a colaboração.");
      const value = parseDocumentCollaboration(body); setCollaboration(value); setNote(value.review?.note || "");
    } catch (caught) {
      if (controller.signal.aborted) return;
      const parsed = caught && typeof caught === "object" && "code" in caught ? caught as CanonicalCareError : { code: "UNKNOWN_ERROR", message: "Não foi possível carregar a colaboração.", requestId: "" };
      if (deniedCodes.includes(parsed.code)) revokeLocalAccess(document.id); else setCollaborationError(parsed);
    }
  }

  async function download(document: SharedDocument) {
    operationRef.current?.abort(); const controller = new AbortController(); operationRef.current = controller;
    const popup = window.open("", "_blank", "noopener,noreferrer");
    try {
      const response = await fetch(`${base}/${document.id}/download-url`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}", cache: "no-store", signal: controller.signal });
      const body = await response.json().catch(() => ({})) as { downloadUrl?: unknown; requestId?: string; error?: unknown };
      if (!response.ok) throw readCanonicalCareError(body, "Não foi possível gerar o download.");
      const downloadUrl = safeDownloadUrl(body.downloadUrl);
      if (!downloadUrl) throw { code: "DOCUMENT_RESPONSE_INVALID", message: "A API não retornou uma URL segura.", requestId: body.requestId || "" } satisfies CanonicalCareError;
      if (popup) popup.location.replace(downloadUrl); else window.location.assign(downloadUrl);
    } catch (caught) {
      if (controller.signal.aborted) { popup?.close(); return; }
      popup?.close(); const parsed = caught && typeof caught === "object" && "code" in caught ? caught as CanonicalCareError : { code: "UNKNOWN_ERROR", message: "Não foi possível gerar o download.", requestId: "" };
      if (deniedCodes.includes(parsed.code)) revokeLocalAccess(document.id); else setCollaborationError(parsed);
    }
  }

  async function mutate(kind: "review" | "comments", body: object) {
    if (!selected) return; operationRef.current?.abort(); const controller = new AbortController(); operationRef.current = controller;
    const intent = `${kind}:${selected.id}:${JSON.stringify(body)}`; const key = mutationKeys.current.get(intent) || idempotencyKey(); mutationKeys.current.set(intent, key); setMutating(true); setCollaborationError(null);
    try {
      const response = await fetch(`${base}/${selected.id}/${kind}`, { method: kind === "review" ? "PUT" : "POST", headers: { "content-type": "application/json", "idempotency-key": key }, body: JSON.stringify(body), signal: controller.signal }); const value = await response.json().catch(() => ({})) as unknown;
      if (!response.ok) throw readCanonicalCareError(value, "Não foi possível salvar a colaboração.");
      mutationKeys.current.delete(intent); if (kind === "comments") setComment(""); await openCollaboration(selected);
    } catch (caught) {
      if (controller.signal.aborted) return;
      const parsed = caught && typeof caught === "object" && "code" in caught ? caught as CanonicalCareError : { code: "UNKNOWN_ERROR", message: "Não foi possível salvar a colaboração.", requestId: "" };
      if (deniedCodes.includes(parsed.code)) revokeLocalAccess(selected.id); else setCollaborationError(parsed);
    } finally { setMutating(false); }
  }

  function resetFilters() { setSearch(""); setQuery(""); setCategory(""); setDateFrom(""); setDateTo(""); setTag(""); }

  return <section className={styles.documentPanel} data-context-cache-key={`${sessionEpoch}:${context.profileId}:${context.pregnancyId}:documents`} aria-labelledby="shared-documents-title" aria-busy={phase === "loading" || loadingMore}>
    <div className={styles.sectionHeading}><div><span className={styles.kicker}>MT-04 · documentos</span><h2 id="shared-documents-title" tabIndex={-1}>Compartilhados com você</h2></div><span aria-live="polite">{items.length} exibido(s)</span></div>
    <p className={styles.relationshipNotice}>Acesso somente aos arquivos compartilhados neste vínculo. Uploads, compartilhamentos e versões permanecem com a paciente.</p>
    <div className={styles.documentFilters}>
      <label>Buscar pelo título<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <label>Categoria<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Todas</option>{documentCategories.map((value) => <option key={value} value={value}>{documentCategoryLabel(value)}</option>)}</select></label>
      <label>Data inicial<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label>
      <label>Data final<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label>
      <label>Tag exata<input value={tag} onChange={(event) => setTag(event.target.value)} /></label>
    </div>
    {phase === "loading" && <div className={styles.inlineLoading} role="status">Carregando documentos autorizados…</div>}
    {phase === "empty" && <div className={styles.emptyState}><strong>Nenhum documento compartilhado</strong><p>Arquivos com compartilhamento ativo aparecerão aqui.</p></div>}
    {phase === "filter-empty" && <div className={styles.emptyState}><strong>Nenhum resultado para estes filtros</strong><p>A busca considera somente título e metadados permitidos.</p><button className={styles.secondaryButton} onClick={resetFilters}>Limpar filtros</button></div>}
    {phase === "denied" && <div className={styles.error} role="alert"><strong>Compartilhamento revogado ou acesso negado</strong><p>{error?.message}</p>{error?.requestId && <small>Identificador: {error.requestId}</small>}</div>}
    {phase === "error" && <div className={styles.error} role="alert"><strong>Não foi possível carregar os documentos</strong><p>{error?.message}</p>{error?.requestId && <small>Identificador: {error.requestId}</small>}<button className={styles.secondaryButton} onClick={() => void load()}>Tentar novamente</button></div>}
    {items.length > 0 && <div className={styles.documentGrid}>{items.map((document) => <article key={document.id} className={styles.documentCard}>
      <div><strong>{document.title}</strong><span>{documentCategoryLabel(document.clinicalCategory)} · {formatDate(document.clinicalDate)}</span></div>
      <span className={document.status === "AVAILABLE" ? styles.statusBadge : styles.documentBlocked}>{documentStatusLabel(document.status)}</span>
      <dl><div><dt>Formato</dt><dd>{document.mimeType || "Não informado"}</dd></div><div><dt>Tamanho</dt><dd>{formatSize(document.sizeBytes)}</dd></div><div><dt>Versão</dt><dd>{document.versionNumber || "—"}</dd></div></dl>
      {document.tags.length > 0 && <p aria-label="Tags">{document.tags.join(" · ")}</p>}
      {!canOpenSharedDocument(document) && <p>Download e colaboração indisponíveis até a verificação e um compartilhamento ativo.</p>}
      <div className={styles.relationshipActions}><button className={styles.secondaryButton} disabled={!canOpenSharedDocument(document)} onClick={() => void download(document)}>Baixar</button><button className={styles.secondaryButton} disabled={!canOpenSharedDocument(document)} onClick={() => void openCollaboration(document)}>Revisar e comentar</button></div>
    </article>)}</div>}
    {nextCursor && phase === "ready" && <button className={styles.secondaryButton} disabled={loadingMore} onClick={() => void load(nextCursor)}>{loadingMore ? "Carregando…" : "Carregar mais"}</button>}
    {requestId && phase === "ready" && <small className={styles.readerRequestId}>Identificador: {requestId}</small>}
    {selected && <section className={styles.collaborationPanel} aria-labelledby="collaboration-title"><div className={styles.sectionHeading}><div><span className={styles.kicker}>Colaboração</span><h3 id="collaboration-title">{selected.title}</h3></div><button className={styles.textButton} onClick={() => { setSelected(null); setCollaboration(null); }}>Fechar</button></div>
      {!canOpenSharedDocument(selected) && <div className={styles.error} role="alert">Documento indisponível para colaboração.</div>}
      {canOpenSharedDocument(selected) && !collaboration && !collaborationError && <div className={styles.inlineLoading} role="status">Carregando colaboração…</div>}
      {collaborationError && <div className={styles.error} role="alert"><strong>Não foi possível concluir</strong><p>{collaborationError.message}</p>{collaborationError.requestId && <small>Identificador: {collaborationError.requestId}</small>}<button className={styles.secondaryButton} onClick={() => void openCollaboration(selected)}>Tentar novamente</button></div>}
      {collaboration && <><form className={styles.collaborationForm} onSubmit={(event) => { event.preventDefault(); void mutate("review", { note: note.trim() || null }); }}><label>Nota de revisão<textarea maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} /></label><button className={styles.primaryButton} disabled={mutating}>{mutating ? "Salvando…" : collaboration.review ? "Atualizar revisão" : "Registrar revisão"}</button></form>
        <form className={styles.collaborationForm} onSubmit={(event) => { event.preventDefault(); if (comment.trim()) void mutate("comments", { content: comment.trim() }); }}><label>Novo comentário<textarea required maxLength={2000} value={comment} onChange={(event) => setComment(event.target.value)} /></label><button className={styles.primaryButton} disabled={mutating || !comment.trim()}>Comentar</button></form>
        <div className={styles.commentList}><strong>Comentários</strong>{collaboration.comments.length === 0 ? <p>Nenhum comentário.</p> : collaboration.comments.map((item) => <article key={item.id}><p>{item.content}</p><small>{item.authorLabel} · {formatDate(item.createdAt)}</small></article>)}</div>
        {collaboration.requestId && <small className={styles.readerRequestId}>Identificador: {collaboration.requestId}</small>}</>}
    </section>}
  </section>;
}

"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CanonicalCareError, CareContextSelection, CareProfilesBootstrap, ResolveCareContextResponse } from "../../../lib/professional/care-context";
import { careContextCacheKey, readCanonicalCareError } from "../../../lib/professional/care-context";
import styles from "./professional.module.css";
import { CareRelationshipsPanel } from "./care-relationships-panel";
import { ProfessionalPatientsPanel } from "./professional-patients-panel";
import { ProfessionalDocumentsPanel } from "./professional-documents-panel";
import { ProfessionalAppointmentsPanel } from "./professional-appointments-panel";
import { ProfessionalChatPanel } from "./professional-chat-panel";
import { ProfessionalNotificationsPanel } from "./professional-notifications-panel";

type Phase = "loading" | "empty" | "select" | "switching" | "ready" | "denied" | "error";
type Option = CareContextSelection & { profileVersion: number; label: string; status: string };

const optionValue = (option: CareContextSelection) => `${option.profileId}:${option.pregnancyId}`;
const shortId = (value: string) => value.slice(0, 8);
async function json<T>(response: Response): Promise<T> { return await response.json().catch(() => ({})) as T; }

function optionsFrom(payload: CareProfilesBootstrap): Option[] {
  return payload.profiles.flatMap((profile) => profile.type === "PROFESSIONAL" && profile.status === "ACTIVE"
    ? profile.contexts.map((context, index) => ({
      profileId: profile.id,
      pregnancyId: context.pregnancyId,
      profileVersion: profile.version,
      status: context.status,
      label: `Contexto ${index + 1} · gestação ${shortId(context.pregnancyId)}`,
    }))
    : []);
}

export function Mt01ProfessionalPortal({
  enableRelationships = false,
  enablePatientReader = false,
  enableDocuments = false,
  enableAppointments = false,
  enableChat = false,
  enableNotifications = false,
  enableNotificationPreferences = false,
}: {
  enableRelationships?: boolean;
  enablePatientReader?: boolean;
  enableDocuments?: boolean;
  enableAppointments?: boolean;
  enableChat?: boolean;
  enableNotifications?: boolean;
  enableNotificationPreferences?: boolean;
}) {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [bootstrap, setBootstrap] = useState<CareProfilesBootstrap | null>(null);
  const [active, setActive] = useState<ResolveCareContextResponse | null>(null);
  const [selectedValue, setSelectedValue] = useState("");
  const [error, setError] = useState<CanonicalCareError | null>(null);
  const [summaryRequestId, setSummaryRequestId] = useState("");
  const options = useMemo(() => bootstrap ? optionsFrom(bootstrap) : [], [bootstrap]);

  const loadSummary = useCallback(async (resolved: ResolveCareContextResponse, signal: AbortSignal) => {
    const { profileId, pregnancyId } = resolved.context;
    const response = await fetch(`/profissional/api/contextual/${profileId}/${pregnancyId}/summary`, { cache: "no-store", signal });
    const payload = await json<{ requestId?: string }>(response);
    if (!response.ok) throw readCanonicalCareError(payload, "Não foi possível carregar o contexto.");
    setSummaryRequestId(payload.requestId || "");
  }, []);

  const resolveOption = useCallback(async (option: Option) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setPhase("switching"); setError(null); setActive(null); setSummaryRequestId("");
    try {
      const response = await fetch("/profissional/api/context/resolve", {
        method: "POST", headers: { "content-type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ profileId: option.profileId, pregnancyId: option.pregnancyId, expectedProfileVersion: option.profileVersion }),
      });
      const payload = await json<ResolveCareContextResponse>(response);
      if (!response.ok) throw readCanonicalCareError(payload, "Não foi possível trocar de contexto.");
      setActive(payload);
      await loadSummary(payload, controller.signal);
      setPhase("ready");
      window.setTimeout(() => headingRef.current?.focus(), 0);
    } catch (caught) {
      if (controller.signal.aborted) return;
      const parsed = caught && typeof caught === "object" && "code" in caught
        ? caught as CanonicalCareError
        : { code: "UNKNOWN_ERROR", message: "Não foi possível trocar de contexto.", requestId: "" };
      setError(parsed);
      setPhase(["CARE_PROFILE_ACCESS_DENIED", "PREGNANCY_CONTEXT_DENIED", "PREGNANCY_NOT_FOUND"].includes(parsed.code) ? "denied" : "error");
    }
  }, [loadSummary]);

  const loadBootstrap = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setPhase("loading"); setError(null); setActive(null);
    try {
      const response = await fetch("/profissional/api/context/bootstrap", { cache: "no-store", signal: controller.signal });
      if (response.status === 401) { router.replace("/profissional/login"); router.refresh(); return; }
      const payload = await json<CareProfilesBootstrap>(response);
      if (!response.ok) throw readCanonicalCareError(payload, "Não foi possível carregar os contextos.");
      setBootstrap(payload);
      const nextOptions = optionsFrom(payload);
      const activeOptions = nextOptions.filter((item) => item.status === "ACTIVE");
      const preferred = payload.preference && nextOptions.find((item) => item.profileId === payload.preference?.profileId && item.pregnancyId === payload.preference?.pregnancyId);
      const automatic = preferred?.status === "ACTIVE" ? preferred : activeOptions.length === 1 ? activeOptions[0] : null;
      if (automatic) { setSelectedValue(optionValue(automatic)); await resolveOption(automatic); }
      else if (nextOptions.length > 0 && activeOptions.length === 0) {
        setError({ code: "PREGNANCY_CONTEXT_DENIED", message: "Seus vínculos estão encerrados ou indisponíveis.", requestId: payload.requestId });
        setPhase("denied");
      } else setPhase(nextOptions.length === 0 ? "empty" : "select");
    } catch (caught) {
      if (controller.signal.aborted) return;
      const parsed = caught && typeof caught === "object" && "code" in caught
        ? caught as CanonicalCareError
        : { code: "UNKNOWN_ERROR", message: "Não foi possível carregar os contextos.", requestId: "" };
      setError(parsed); setPhase("error");
    }
  }, [resolveOption, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadBootstrap(), 0);
    return () => { window.clearTimeout(timer); requestRef.current?.abort(); };
  }, [loadBootstrap]);

  async function changeContext(value: string) {
    setSelectedValue(value);
    const option = options.find((item) => optionValue(item) === value);
    if (option) await resolveOption(option);
  }

  async function logout() {
    requestRef.current?.abort(); setActive(null); setBootstrap(null);
    await fetch("/profissional/api/session", { method: "DELETE" });
    router.replace("/profissional/login"); router.refresh();
  }

  const cacheKey = active && bootstrap ? careContextCacheKey(bootstrap.sessionEpoch, active.context, "summary").join(":") : "";
  return (
    <div className={styles.portalPage} data-context-cache-key={cacheKey}>
      <header className={styles.portalHeader}>
        <Image src="/brand/momiz-logo-horizontal.png" alt="Momiz" width={1600} height={533} priority />
        <div className={styles.contextHeaderLabel}><strong>Portal profissional</strong><span>{active ? `Gestação ${shortId(active.context.pregnancyId)}` : "Contexto de cuidado"}</span></div>
        <button className={styles.headerButton} onClick={() => void logout()}>Sair</button>
      </header>
      <main className={styles.contextMain} aria-busy={phase === "loading" || phase === "switching"}>
        <section className={styles.contextCard}>
          <span className={styles.kicker}>MT-01 · acesso contextual</span>
          <h1 ref={headingRef} tabIndex={-1}>Seu contexto profissional</h1>
          <p>A API valida seu perfil, a gestação e o vínculo a cada acesso.</p>
          {options.length > 1 && <label className={styles.contextSelector}>Contexto ativo<select disabled={phase === "switching"} value={selectedValue} onChange={(event) => void changeContext(event.target.value)}><option value="">Selecione um contexto</option>{options.map((option) => <option key={optionValue(option)} value={optionValue(option)} disabled={option.status !== "ACTIVE"}>{option.label}{option.status !== "ACTIVE" ? " · indisponível" : ""}</option>)}</select></label>}
          {(phase === "loading" || phase === "switching") && <div className={styles.contextStatus} role="status"><span className={styles.spinner} aria-hidden="true" /><strong>{phase === "switching" ? "Trocando contexto…" : "Carregando contextos…"}</strong></div>}
          {phase === "select" && <div className={styles.contextStatus} role="status"><strong>Selecione onde deseja trabalhar.</strong></div>}
          {phase === "empty" && <div className={styles.emptyState}><strong>Nenhum contexto disponível</strong><p>Seu perfil não possui uma gestação autorizada neste momento.</p></div>}
          {phase === "denied" && <div className={styles.error} role="alert"><strong>Acesso encerrado ou revogado</strong><p>{error?.message}</p></div>}
          {phase === "error" && <div className={styles.error} role="alert"><strong>Não foi possível abrir o contexto</strong><p>{error?.message}</p>{error?.requestId && <small>Identificador: {error.requestId}</small>}<button className={styles.secondaryButton} onClick={() => void loadBootstrap()}>Tentar novamente</button></div>}
          {phase === "ready" && active && <div className={styles.contextReady} role="status"><strong>Contexto validado</strong><span>Perfil {shortId(active.context.profileId)} · gestação {shortId(active.context.pregnancyId)}</span><span>Acesso: {active.context.accessKind === "PROFESSIONAL_RELATIONSHIP" ? "vínculo profissional" : active.context.accessKind}</span>{(summaryRequestId || active.requestId) && <small>Identificador: {summaryRequestId || active.requestId}</small>}</div>}
        </section>
        {phase === "ready" && active && bootstrap && enableNotifications && (
          <ProfessionalNotificationsPanel key={`${bootstrap.sessionEpoch}:${active.context.profileId}:notifications`} profileId={active.context.profileId} sessionEpoch={bootstrap.sessionEpoch} enablePreferences={enableNotificationPreferences} />
        )}
        {phase === "ready" && active && bootstrap && enablePatientReader && (
          <ProfessionalPatientsPanel
            key={`${bootstrap.sessionEpoch}:${active.context.profileId}:patients`}
            profileId={active.context.profileId}
            sessionEpoch={bootstrap.sessionEpoch}
          />
        )}
        {phase === "ready" && active && bootstrap && enableRelationships && (
          <CareRelationshipsPanel
            key={`${bootstrap.sessionEpoch}:${active.context.profileId}:${active.context.pregnancyId}`}
            context={active.context}
            sessionEpoch={bootstrap.sessionEpoch}
          />
        )}
        {phase === "ready" && active && bootstrap && enableDocuments && (
          <ProfessionalDocumentsPanel
            key={`${bootstrap.sessionEpoch}:${active.context.profileId}:${active.context.pregnancyId}:documents`}
            context={active.context}
            sessionEpoch={bootstrap.sessionEpoch}
          />
        )}
        {phase === "ready" && active && bootstrap && enableAppointments && (
          <ProfessionalAppointmentsPanel
            key={`${bootstrap.sessionEpoch}:${active.context.profileId}:${active.context.pregnancyId}:appointments`}
            context={active.context}
            professionalProfileId={bootstrap.profiles.find((profile) => profile.id === active.context.profileId)?.professional?.professionalProfileId || ""}
            sessionEpoch={bootstrap.sessionEpoch}
          />
        )}
        {phase === "ready" && active && bootstrap && enableChat && (
          <ProfessionalChatPanel key={`${bootstrap.sessionEpoch}:${active.context.profileId}:${active.context.pregnancyId}:${active.context.relationshipId}:chat`} context={active.context} sessionEpoch={bootstrap.sessionEpoch} />
        )}
      </main>
    </div>
  );
}

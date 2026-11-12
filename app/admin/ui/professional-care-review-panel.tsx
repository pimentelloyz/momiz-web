"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { adminApi, adminErrorMessage, isAdminSessionExpired, jsonRequest } from "./admin-api-client";
import { FeedbackState, MutationFeedback } from "./admin-primitives";
import { AdminMutationState, AdminQueryState, runAdminMutation, runAdminQuery } from "./admin-query-state";
import { openEphemeralCredentialUrl, readCredentialDownload } from "./admin-credential-download";
import { AdminProfilePage, mergeAdminProfilePages, readAdminProfilePage } from "./admin-profile-pagination";
import { AdminReportPage, mergeAdminReportPages, readAdminReportPage } from "./admin-report-pagination";
import { AdminAuditPage, isUuidFilter, mergeAdminAuditPages, readAdminAuditPage } from "./admin-audit-pagination";
import {
  AdminRelationshipPage,
  AdminRelationshipStatus,
  adminRelationshipStatuses,
  mergeAdminRelationshipPages,
  readAdminRelationshipPage,
} from "./admin-relationship-pagination";
import { PilotDraft, PilotReadinessPanel } from "./pilot-readiness-panel";
import {
  PilotGate,
  PilotReadiness,
  isCurrentPilotReadinessRequest,
  pilotGatePatch,
  readPilotReadiness,
  updatePilotGateWithReconciliation,
} from "./admin-pilot-readiness";
import {
  AdminCareOperations,
  areAdminCareMetricsEmpty,
  isCurrentAdminCareMetricsRequest,
  readAdminCareMetrics,
} from "./admin-care-metrics";
import {
  ProfessionalReviewDecision,
  isCurrentProfessionalProfileRequest,
  professionalReviewPayload,
  submitProfessionalReviewWithReconciliation,
} from "./admin-professional-review";
import styles from "./admin.module.css";

type VerificationStatus =
  | "DRAFT"
  | "PENDING_VERIFICATION"
  | "NEEDS_CORRECTION"
  | "VERIFIED"
  | "REJECTED"
  | "SUSPENDED"
  | "EXPIRED";

type Credential = {
  id: string;
  type: string;
  registrationNumber: string | null;
  jurisdiction: string | null;
  specialty: string | null;
  issuer: string | null;
  expiresAt: string | null;
  status: string;
  reviewReason: string | null;
  documentFileName: string | null;
  renewalOfCredentialId: string | null;
};

type ProfessionalProfile = {
  id: string;
  primaryProfession: string;
  displayName: string;
  bio: string | null;
  city: string | null;
  state: string | null;
  verificationStatus: VerificationStatus;
  submittedAt: string | null;
  verifiedAt: string | null;
  updatedAt?: string | null;
  user: { id: string; name: string; email: string; photoUrl: string | null };
  credentials: Credential[];
  reviewLogs: Array<{
    id: string;
    action: string;
    previousStatus: string | null;
    resultingStatus: string | null;
    reason: string | null;
    createdAt: string;
    actor: { id: string; name: string | null; email: string | null } | null;
  }>;
};

type CommunicationReportStatus = "OPEN" | "RESOLVED" | "DISMISSED";

type CommunicationReport = {
  id: string;
  category: string;
  details: string | null;
  status: CommunicationReportStatus;
  createdAt: string;
  resolvedAt: string | null;
  resolutionNote: string | null;
  patient: { id: string; name: string; email: string | null };
  reporter: { id: string; name: string; email: string | null };
  resolvedBy: { id: string; name: string; email: string | null } | null;
  message: {
    id: string;
    content: string;
    authorUserId: string;
    createdAt: string;
  } | null;
  relationship: {
    id: string;
    status: string;
    communicationBlockedAt: string | null;
    professionalProfile: {
      id: string;
      displayName: string;
      primaryProfession: string;
      user: { id: string; name: string; email: string | null };
    };
  };
};

const statusLabels: Record<VerificationStatus, string> = {
  DRAFT: "Rascunho",
  PENDING_VERIFICATION: "Aguardando análise",
  NEEDS_CORRECTION: "Correção solicitada",
  VERIFIED: "Verificado",
  REJECTED: "Rejeitado",
  SUSPENDED: "Suspenso",
  EXPIRED: "Expirado",
};

const professionLabels: Record<string, string> = {
  OBSTETRICIAN: "Médica obstetra",
  DOULA: "Doula",
  OBSTETRIC_NURSE: "Enfermeira obstetra",
  PELVIC_PHYSIOTHERAPIST: "Fisioterapeuta pélvica",
};

const reportCategoryLabels: Record<string, string> = {
  HARASSMENT: "Assédio ou intimidação",
  INAPPROPRIATE_CONTENT: "Conteúdo inadequado",
  PRIVACY_CONCERN: "Privacidade ou uso indevido de dados",
  PROFESSIONAL_CONDUCT: "Conduta profissional",
  SPAM: "Spam ou abordagem comercial",
  OTHER: "Outro motivo",
};

function formatDate(value: string | null) {
  if (!value) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ProfessionalCareReviewPanel({
  onSessionExpired,
}: {
  onSessionExpired: () => void;
}) {
  const [status, setStatus] = useState<VerificationStatus>("PENDING_VERIFICATION");
  const [profilesState, setProfilesState] = useState<AdminQueryState<AdminProfilePage<ProfessionalProfile>>>({ phase: "loading" });
  const [profilesMoreState, setProfilesMoreState] = useState<AdminQueryState<AdminProfilePage<ProfessionalProfile>> | { phase: "idle" }>({ phase: "idle" });
  const activeProfileStatusRef = useRef(status);
  const profileRequestVersionRef = useRef(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [reviewMutations, setReviewMutations] = useState<Record<string, AdminMutationState>>({});
  const [credentialMutations, setCredentialMutations] = useState<Record<string, AdminMutationState>>({});
  const [metricsState, setMetricsState] = useState<AdminQueryState<AdminCareOperations>>({ phase: "loading" });
  const metricsRequestVersionRef = useRef(0);
  const [reportStatus, setReportStatus] = useState<CommunicationReportStatus>("OPEN");
  const [reportsState, setReportsState] = useState<AdminQueryState<AdminReportPage<CommunicationReport>>>({ phase: "loading" });
  const [reportsMoreState, setReportsMoreState] = useState<AdminQueryState<AdminReportPage<CommunicationReport>> | { phase: "idle" }>({ phase: "idle" });
  const activeReportStatusRef = useRef(reportStatus);
  const reportRequestVersionRef = useRef(0);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [reportMutation, setReportMutation] = useState<AdminMutationState>({ phase: "idle" });
  const [auditFilterDraft, setAuditFilterDraft] = useState("");
  const [auditPatientFilter, setAuditPatientFilter] = useState("");
  const [auditFilterError, setAuditFilterError] = useState<string | null>(null);
  const [auditState, setAuditState] = useState<AdminQueryState<AdminAuditPage>>({ phase: "loading" });
  const [auditMoreState, setAuditMoreState] = useState<AdminQueryState<AdminAuditPage> | { phase: "idle" }>({ phase: "idle" });
  const auditFilterRef = useRef(auditPatientFilter);
  const auditRequestVersionRef = useRef(0);
  const [relationshipStatus, setRelationshipStatus] = useState<"ALL" | AdminRelationshipStatus>("ALL");
  const [relationshipsState, setRelationshipsState] = useState<AdminQueryState<AdminRelationshipPage>>({ phase: "loading" });
  const [relationshipsMoreState, setRelationshipsMoreState] = useState<AdminQueryState<AdminRelationshipPage> | { phase: "idle" }>({ phase: "idle" });
  const relationshipStatusRef = useRef(relationshipStatus);
  const relationshipRequestVersionRef = useRef(0);
  const [pilotReadinessState, setPilotReadinessState] = useState<AdminQueryState<PilotReadiness>>({ phase: "loading" });
  const [pilotDrafts, setPilotDrafts] = useState<Record<string, PilotDraft>>({});
  const [pilotMutations, setPilotMutations] = useState<Record<string, AdminMutationState>>({});
  const pilotRequestVersionRef = useRef(0);

  useEffect(() => {
    activeProfileStatusRef.current = status;
  }, [status]);

  useEffect(() => {
    activeReportStatusRef.current = reportStatus;
  }, [reportStatus]);

  useEffect(() => {
    auditFilterRef.current = auditPatientFilter;
  }, [auditPatientFilter]);

  useEffect(() => {
    relationshipStatusRef.current = relationshipStatus;
  }, [relationshipStatus]);

  const profiles = useMemo(
    () => profilesState.phase === "ready" || profilesState.phase === "empty" ? profilesState.data.items : [],
    [profilesState],
  );
  const reports = useMemo(
    () => reportsState.phase === "ready" || reportsState.phase === "empty" ? reportsState.data.items : [],
    [reportsState],
  );
  const auditItems = useMemo(
    () => auditState.phase === "ready" || auditState.phase === "empty" ? auditState.data.items : [],
    [auditState],
  );
  const relationships = useMemo(
    () => relationshipsState.phase === "ready" || relationshipsState.phase === "empty" ? relationshipsState.data.items : [],
    [relationshipsState],
  );
  const pilotReadiness = pilotReadinessState.phase === "ready" || pilotReadinessState.phase === "empty" ? pilotReadinessState.data : null;

  const selected = useMemo(
    () => profiles.find((profile) => profile.id === selectedId) ?? profiles[0] ?? null,
    [profiles, selectedId],
  );
  const reviewMutation = selected ? reviewMutations[selected.id] ?? { phase: "idle" as const } : { phase: "idle" as const };
  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? reports[0] ?? null,
    [reports, selectedReportId],
  );
  const pendingRenewals = useMemo(
    () => selected?.credentials.filter(
      (credential) => credential.status === "PENDING" && Boolean(credential.renewalOfCredentialId),
    ) ?? [],
    [selected],
  );
  const isRenewalReview = selected?.verificationStatus === "VERIFIED" && pendingRenewals.length > 0;

  const loadProfiles = useCallback(async () => {
    const requestedStatus = status;
    const requestVersion = profileRequestVersionRef.current + 1;
    profileRequestVersionRef.current = requestVersion;
    setProfilesState({ phase: "loading" });
    setProfilesMoreState({ phase: "idle" });
    const next = await runAdminQuery(async () => {
      const query = new URLSearchParams({ status: requestedStatus, limit: "50" });
      return readAdminProfilePage<ProfessionalProfile>(await adminApi(`care/profiles?${query}`));
    }, (page) => page.items.length === 0);
    if (activeProfileStatusRef.current !== requestedStatus || !isCurrentProfessionalProfileRequest(requestVersion, profileRequestVersionRef.current)) return next;
    if (next.phase === "error" && isAdminSessionExpired(next.error)) {
      onSessionExpired();
      return next;
    }
    if (next.phase === "ready" || next.phase === "empty") {
      setSelectedId((current) => next.data.items.some((profile) => profile.id === current) ? current : next.data.items[0]?.id ?? null);
    }
    setProfilesState(next);
    return next;
  }, [onSessionExpired, status]);

  const loadMoreProfiles = useCallback(async () => {
    if (profilesState.phase !== "ready" || !profilesState.data.nextCursor || profilesMoreState.phase === "loading") return;
    const requestedStatus = status;
    const cursor = profilesState.data.nextCursor;
    const requestVersion = profileRequestVersionRef.current;
    setProfilesMoreState({ phase: "loading" });
    const next = await runAdminQuery(async () => {
      const query = new URLSearchParams({ status: requestedStatus, limit: "50", cursor });
      return readAdminProfilePage<ProfessionalProfile>(await adminApi(`care/profiles?${query}`));
    }, () => false);
    if (activeProfileStatusRef.current !== requestedStatus || !isCurrentProfessionalProfileRequest(requestVersion, profileRequestVersionRef.current)) return;
    if (next.phase === "error") {
      if (isAdminSessionExpired(next.error)) onSessionExpired();
      setProfilesMoreState(next);
      return;
    }
    if (next.phase !== "ready" && next.phase !== "empty") return;
    setProfilesState((current) => {
      if (current.phase !== "ready" && current.phase !== "empty") return current;
      return {
        phase: "ready",
        data: { items: mergeAdminProfilePages(current.data.items, next.data.items), nextCursor: next.data.nextCursor },
      };
    });
    setProfilesMoreState({ phase: "idle" });
  }, [onSessionExpired, profilesMoreState.phase, profilesState, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadProfiles(), 0);
    return () => window.clearTimeout(timer);
  }, [loadProfiles]);

  const loadMetrics = useCallback(async () => {
    const requestVersion = metricsRequestVersionRef.current + 1;
    metricsRequestVersionRef.current = requestVersion;
    setMetricsState({ phase: "loading" });
    const next = await runAdminQuery(async () => {
      return readAdminCareMetrics(await adminApi("care/metrics"));
    }, areAdminCareMetricsEmpty);
    if (!isCurrentAdminCareMetricsRequest(requestVersion, metricsRequestVersionRef.current)) return next;
    if (next.phase === "error" && isAdminSessionExpired(next.error)) {
      onSessionExpired();
      return next;
    }
    setMetricsState(next);
    return next;
  }, [onSessionExpired]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadMetrics(), 0);
    return () => window.clearTimeout(timer);
  }, [loadMetrics]);

  const applyPilotReadiness = useCallback((readiness: PilotReadiness) => {
    setPilotReadinessState({ phase: readiness.gates.length === 0 ? "empty" : "ready", data: readiness });
    setPilotDrafts(Object.fromEntries(readiness.gates.map((gate) => [
      gate.key,
      {
        status: gate.status,
        reason: "",
        evidenceReference: "",
      },
    ])));
  }, []);

  const loadPilotReadiness = useCallback(async (showLoading = true) => {
    const requestVersion = pilotRequestVersionRef.current + 1;
    pilotRequestVersionRef.current = requestVersion;
    if (showLoading) setPilotReadinessState({ phase: "loading" });
    const next = await runAdminQuery(async () => {
      return readPilotReadiness(await adminApi("care/pilot-readiness"));
    }, (readiness) => readiness.gates.length === 0);
    if (!isCurrentPilotReadinessRequest(requestVersion, pilotRequestVersionRef.current)) return next;
    if (next.phase === "error" && isAdminSessionExpired(next.error)) {
      onSessionExpired();
      return next;
    }
    if (next.phase === "ready" || next.phase === "empty") {
      applyPilotReadiness(next.data);
      return next;
    }
    setPilotReadinessState(next);
    return next;
  }, [applyPilotReadiness, onSessionExpired]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPilotReadiness(), 0);
    return () => window.clearTimeout(timer);
  }, [loadPilotReadiness]);

  function updatePilotDraft(
    gate: string,
    field: "status" | "reason" | "evidenceReference",
    value: string,
  ) {
    setPilotMutations((current) => ({ ...current, [gate]: { phase: "idle" } }));
    setPilotDrafts((current) => ({
      ...current,
      [gate]: {
        ...(current[gate] ?? { status: "PENDING", reason: "", evidenceReference: "" }),
        [field]: value,
      },
    }));
  }

  async function savePilotGate(gate: PilotGate) {
    const draft = pilotDrafts[gate.key];
    if (!draft || draft.reason.trim().length < 10) {
      setPilotMutations((current) => ({ ...current, [gate.key]: { phase: "error", error: new Error("Registre uma justificativa com pelo menos 10 caracteres.") } }));
      return;
    }
    if (draft.status === "APPROVED" && !draft.evidenceReference.trim()) {
      setPilotMutations((current) => ({ ...current, [gate.key]: { phase: "error", error: new Error("Informe a referência da evidência antes de aprovar o gate.") } }));
      return;
    }
    setPilotMutations((current) => ({ ...current, [gate.key]: { phase: "pending" } }));
    const result = await runAdminMutation(async () => {
      await updatePilotGateWithReconciliation(
        async () => {
          await adminApi(
          `care/pilot-readiness/${gate.key}`,
          jsonRequest("PATCH", pilotGatePatch(draft.status, draft.reason, draft.evidenceReference, gate.updatedAt)),
          );
        },
        async () => {
          const refreshed = await loadPilotReadiness(false);
          if (refreshed.phase === "error") throw refreshed.error;
        },
      );
    }, "Gate registrado. Nenhum rollout foi ativado.");
    if (result.phase === "error" && isAdminSessionExpired(result.error)) {
      onSessionExpired();
      return;
    }
    setPilotMutations((current) => ({ ...current, [gate.key]: result }));
  }

  const loadReports = useCallback(async () => {
    const requestedStatus = reportStatus;
    const requestVersion = reportRequestVersionRef.current + 1;
    reportRequestVersionRef.current = requestVersion;
    setReportsState({ phase: "loading" });
    setReportsMoreState({ phase: "idle" });
    const next = await runAdminQuery(async () => {
      const query = new URLSearchParams({ status: requestedStatus, limit: "50" });
      return readAdminReportPage<CommunicationReport>(await adminApi(`care/communication-reports?${query}`));
    }, (page) => page.items.length === 0);
    if (activeReportStatusRef.current !== requestedStatus || reportRequestVersionRef.current !== requestVersion) return next;
    if (next.phase === "error" && isAdminSessionExpired(next.error)) {
      onSessionExpired();
      return next;
    }
    if (next.phase === "ready" || next.phase === "empty") {
      setSelectedReportId((current) =>
        next.data.items.some((report) => report.id === current)
          ? current
          : next.data.items[0]?.id ?? null,
      );
    }
    setReportsState(next);
    return next;
  }, [onSessionExpired, reportStatus]);

  const loadMoreReports = useCallback(async () => {
    if (reportsState.phase !== "ready" || !reportsState.data.nextCursor || reportsMoreState.phase === "loading") return;
    const requestedStatus = reportStatus;
    const cursor = reportsState.data.nextCursor;
    const requestVersion = reportRequestVersionRef.current;
    setReportsMoreState({ phase: "loading" });
    const next = await runAdminQuery(async () => {
      const query = new URLSearchParams({ status: requestedStatus, limit: "50", cursor });
      return readAdminReportPage<CommunicationReport>(await adminApi(`care/communication-reports?${query}`));
    }, () => false);
    if (activeReportStatusRef.current !== requestedStatus || reportRequestVersionRef.current !== requestVersion) return;
    if (next.phase === "error") {
      if (isAdminSessionExpired(next.error)) onSessionExpired();
      setReportsMoreState(next);
      return;
    }
    if (next.phase !== "ready" && next.phase !== "empty") return;
    setReportsState((current) => {
      if (current.phase !== "ready" && current.phase !== "empty") return current;
      return {
        phase: "ready",
        data: { items: mergeAdminReportPages(current.data.items, next.data.items), nextCursor: next.data.nextCursor },
      };
    });
    setReportsMoreState({ phase: "idle" });
  }, [onSessionExpired, reportStatus, reportsMoreState.phase, reportsState]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadReports(), 0);
    return () => window.clearTimeout(timer);
  }, [loadReports]);

  const loadAuditLogs = useCallback(async () => {
    const requestedFilter = auditPatientFilter;
    const requestVersion = auditRequestVersionRef.current + 1;
    auditRequestVersionRef.current = requestVersion;
    setAuditState({ phase: "loading" });
    setAuditMoreState({ phase: "idle" });
    const next = await runAdminQuery(async () => {
      const query = new URLSearchParams({ limit: "50" });
      if (requestedFilter) query.set("patientUserId", requestedFilter);
      return readAdminAuditPage(await adminApi(`care/audit-logs?${query}`));
    }, (page) => page.items.length === 0);
    if (auditFilterRef.current !== requestedFilter || auditRequestVersionRef.current !== requestVersion) return next;
    if (next.phase === "error" && isAdminSessionExpired(next.error)) {
      onSessionExpired();
      return next;
    }
    setAuditState(next);
    return next;
  }, [auditPatientFilter, onSessionExpired]);

  const loadMoreAuditLogs = useCallback(async () => {
    if (auditState.phase !== "ready" || !auditState.data.nextCursor || auditMoreState.phase === "loading") return;
    const requestedFilter = auditPatientFilter;
    const cursor = auditState.data.nextCursor;
    const requestVersion = auditRequestVersionRef.current;
    setAuditMoreState({ phase: "loading" });
    const next = await runAdminQuery(async () => {
      const query = new URLSearchParams({ limit: "50", cursor });
      if (requestedFilter) query.set("patientUserId", requestedFilter);
      return readAdminAuditPage(await adminApi(`care/audit-logs?${query}`));
    }, () => false);
    if (auditFilterRef.current !== requestedFilter || auditRequestVersionRef.current !== requestVersion) return;
    if (next.phase === "error") {
      if (isAdminSessionExpired(next.error)) onSessionExpired();
      setAuditMoreState(next);
      return;
    }
    if (next.phase !== "ready" && next.phase !== "empty") return;
    setAuditState((current) => {
      if (current.phase !== "ready" && current.phase !== "empty") return current;
      return { phase: "ready", data: { items: mergeAdminAuditPages(current.data.items, next.data.items), nextCursor: next.data.nextCursor } };
    });
    setAuditMoreState({ phase: "idle" });
  }, [auditMoreState.phase, auditPatientFilter, auditState, onSessionExpired]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAuditLogs(), 0);
    return () => window.clearTimeout(timer);
  }, [loadAuditLogs]);

  function applyAuditFilter() {
    const value = auditFilterDraft.trim();
    if (value && !isUuidFilter(value)) {
      setAuditFilterError("Informe um UUID válido para filtrar por paciente.");
      return;
    }
    setAuditFilterError(null);
    if (value === auditPatientFilter) void loadAuditLogs();
    else setAuditPatientFilter(value);
  }

  const loadRelationships = useCallback(async () => {
    const requestedStatus = relationshipStatus;
    const requestVersion = relationshipRequestVersionRef.current + 1;
    relationshipRequestVersionRef.current = requestVersion;
    setRelationshipsState({ phase: "loading" });
    setRelationshipsMoreState({ phase: "idle" });
    const next = await runAdminQuery(async () => {
      const query = new URLSearchParams({ limit: "50" });
      if (requestedStatus !== "ALL") query.set("status", requestedStatus);
      return readAdminRelationshipPage(await adminApi(`care/relationships?${query}`));
    }, (page) => page.items.length === 0);
    if (relationshipStatusRef.current !== requestedStatus || relationshipRequestVersionRef.current !== requestVersion) return next;
    if (next.phase === "error" && isAdminSessionExpired(next.error)) {
      onSessionExpired();
      return next;
    }
    setRelationshipsState(next);
    return next;
  }, [onSessionExpired, relationshipStatus]);

  const loadMoreRelationships = useCallback(async () => {
    if (relationshipsState.phase !== "ready" || !relationshipsState.data.nextCursor || relationshipsMoreState.phase === "loading") return;
    const requestedStatus = relationshipStatus;
    const cursor = relationshipsState.data.nextCursor;
    const requestVersion = relationshipRequestVersionRef.current;
    setRelationshipsMoreState({ phase: "loading" });
    const next = await runAdminQuery(async () => {
      const query = new URLSearchParams({ limit: "50", cursor });
      if (requestedStatus !== "ALL") query.set("status", requestedStatus);
      return readAdminRelationshipPage(await adminApi(`care/relationships?${query}`));
    }, () => false);
    if (relationshipStatusRef.current !== requestedStatus || relationshipRequestVersionRef.current !== requestVersion) return;
    if (next.phase === "error") {
      if (isAdminSessionExpired(next.error)) onSessionExpired();
      setRelationshipsMoreState(next);
      return;
    }
    if (next.phase !== "ready" && next.phase !== "empty") return;
    setRelationshipsState((current) => {
      if (current.phase !== "ready" && current.phase !== "empty") return current;
      return {
        phase: "ready",
        data: { items: mergeAdminRelationshipPages(current.data.items, next.data.items), nextCursor: next.data.nextCursor },
      };
    });
    setRelationshipsMoreState({ phase: "idle" });
  }, [onSessionExpired, relationshipStatus, relationshipsMoreState.phase, relationshipsState]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadRelationships(), 0);
    return () => window.clearTimeout(timer);
  }, [loadRelationships]);

  async function resolveReport(decision: "resolve" | "dismiss") {
    if (!selectedReport) return;
    if (!resolutionNote.trim()) {
      setReportMutation({ phase: "error", error: new Error("Registre a análise e as medidas tomadas antes de encerrar a denúncia.") });
      return;
    }
    setReportMutation({ phase: "pending" });
    const successMessage = decision === "resolve" ? "Denúncia resolvida e auditada." : "Denúncia descartada com justificativa.";
    const result = await runAdminMutation(async () => {
      await adminApi(
        `care/communication-reports/${selectedReport.id}`,
        jsonRequest("PATCH", { decision, resolutionNote: resolutionNote.trim() }),
      );
      setResolutionNote("");
      const reportsRefresh = await loadReports();
      if (reportsRefresh.phase === "error") throw reportsRefresh.error;
      const metricsRefresh = await loadMetrics();
      if (metricsRefresh.phase === "error") throw metricsRefresh.error;
    }, successMessage);
    if (result.phase === "error" && isAdminSessionExpired(result.error)) {
      onSessionExpired();
      return;
    }
    setReportMutation(result);
  }

  async function review(decision: ProfessionalReviewDecision) {
    if (!selected) return;
    const target = selected;
    if (reviewMutations[target.id]?.phase === "pending") return;
    let payload: ReturnType<typeof professionalReviewPayload>;
    try {
      payload = professionalReviewPayload(decision, reason, target.updatedAt);
    } catch (error) {
      setReviewMutations((current) => ({ ...current, [target.id]: { phase: "error", error } }));
      return;
    }
    setReviewMutations((current) => ({ ...current, [target.id]: { phase: "pending" } }));
    const successMessage = decision === "verify"
      ? isRenewalReview
        ? "Renovação aprovada. A nova credencial assumiu a vigência sem interromper os vínculos."
        : "Perfil verificado e vínculos pendentes ativados."
      : decision === "request_correction"
        ? isRenewalReview
          ? "Correção solicitada. A credencial vigente e os vínculos permanecem ativos."
          : "Correção solicitada ao profissional."
        : decision === "suspend"
          ? "Perfil suspenso e vínculos ativos pausados."
          : "Cadastro profissional rejeitado.";
    const result = await runAdminMutation(async () => {
      await submitProfessionalReviewWithReconciliation(
        () => adminApi(`care/profiles/${target.id}/review`, jsonRequest("POST", payload)),
        async () => {
          const profilesRefresh = await loadProfiles();
          if (profilesRefresh.phase === "error") throw profilesRefresh.error;
        },
      );
      setReason("");
      await loadMetrics();
    }, successMessage);
    setReviewMutations((current) => ({ ...current, [target.id]: result }));
    if (result.phase === "error" && isAdminSessionExpired(result.error)) {
      onSessionExpired();
      return;
    }
  }

  async function openCredential(credential: Credential) {
    if (!selected || !credential.documentFileName) return;
    setCredentialMutations((current) => ({ ...current, [credential.id]: { phase: "pending" } }));
    const result = await runAdminMutation(async () => {
      const payload = await adminApi(
        `care/profiles/${selected.id}/credentials/${credential.id}/download-url`,
      );
      const { downloadUrl } = readCredentialDownload(payload);
      openEphemeralCredentialUrl(downloadUrl, window.open.bind(window));
    }, "Comprovante aberto em uma nova janela.");
    if (result.phase === "error") {
      if (isAdminSessionExpired(result.error)) {
        onSessionExpired();
        return;
      }
    }
    setCredentialMutations((current) => ({ ...current, [credential.id]: result }));
  }

  return (
    <div className={styles.careReviewPanel}>
      <PilotReadinessPanel
        readiness={pilotReadiness}
        loadError={pilotReadinessState.phase === "error" ? adminErrorMessage(pilotReadinessState.error, "Não foi possível carregar os gates do piloto.") : undefined}
        drafts={pilotDrafts}
        mutations={pilotMutations}
        onDraftChange={updatePilotDraft}
        onSave={(gate) => void savePilotGate(gate)}
        onRetry={() => void loadPilotReadiness()}
      />
      <section className={styles.sectionCard}>
        <div className={styles.sectionTitle}>
          <div>
            <span className={styles.kicker}>Credenciais profissionais</span>
            <h2>Verificação da equipe de cuidado</h2>
            <p>Confira profissão e registro antes de liberar qualquer dado de saúde.</p>
          </div>
          <label className={styles.statusFilter}>
            Situação
            <select value={status} onChange={(event) => setStatus(event.target.value as VerificationStatus)}>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>
        {metricsState.phase === "loading" ? (
          <FeedbackState variant="loading" title="Carregando indicadores" description="Consultando métricas operacionais atualizadas." className={styles.feedback} />
        ) : metricsState.phase === "error" ? (
          <FeedbackState
            variant="error"
            title="Não foi possível carregar os indicadores"
            description={adminErrorMessage(metricsState.error, "Não foi possível carregar as métricas.")}
            action={<button type="button" className={styles.secondaryButton} onClick={() => void loadMetrics()}>Tentar novamente</button>}
            className={styles.feedback}
          />
        ) : metricsState.phase === "empty" ? (
          <FeedbackState variant="empty" title="Nenhuma atividade no momento" description="A consulta foi concluída e todos os indicadores retornaram zero." className={styles.feedback} />
        ) : (
          <div className={styles.impactGrid}>
            <div><strong>{metricsState.data.active}</strong><span>vínculos ativos</span></div>
            <div><strong>{metricsState.data.paused}</strong><span>vínculos pausados</span></div>
            <div><strong>{metricsState.data.expiring}</strong><span>expiram em até 7 dias</span></div>
            <div><strong>{metricsState.data.blocked}</strong><span>comunicações bloqueadas</span></div>
            <div><strong>{metricsState.data.pendingProfiles}</strong><span>perfis aguardando análise</span></div>
            <div><strong>{metricsState.data.expiringCredentials}</strong><span>credenciais vencem em até 30 dias</span></div>
            <div><strong>{metricsState.data.expiredProfiles}</strong><span>perfis expirados</span></div>
            <div><strong>{metricsState.data.openReports}</strong><span>denúncias abertas</span></div>
            <div><strong>{metricsState.data.auditEvents}</strong><span>acessos auditados em 24h</span></div>
            <div><strong>{metricsState.data.deniedAuditEvents}</strong><span>acessos negados em 24h</span></div>
          </div>
        )}
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.sectionTitle}>
          <div>
            <span className={styles.kicker}>Vínculos minimizados</span>
            <h2>Relationships de cuidado</h2>
            <p>Consulte somente identificadores, estado, vigência e capabilities ativas.</p>
          </div>
          <label className={styles.statusFilter}>
            Situação
            <select
              value={relationshipStatus}
              onChange={(event) => setRelationshipStatus(event.target.value as "ALL" | AdminRelationshipStatus)}
            >
              <option value="ALL">Todas</option>
              {adminRelationshipStatuses.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        </div>
        {relationshipsState.phase === "loading" ? (
          <FeedbackState variant="loading" title="Carregando vínculos" description="Consultando relationships administrativas minimizadas." className={styles.feedback} />
        ) : relationshipsState.phase === "error" ? (
          <FeedbackState
            variant="error"
            title="Não foi possível carregar os vínculos"
            description={adminErrorMessage(relationshipsState.error, "Não foi possível consultar os vínculos administrativos.")}
            action={<button type="button" className={styles.secondaryButton} onClick={() => void loadRelationships()}>Tentar novamente</button>}
            className={styles.feedback}
          />
        ) : relationshipsState.phase === "empty" ? (
          <FeedbackState variant="empty" title="Nenhum vínculo nesta situação" description="A consulta foi concluída sem relationships para o filtro selecionado." className={styles.feedback} />
        ) : (
          <>
            <ol className={styles.reviewList} aria-label="Relationships administrativas">
              {relationships.map((item) => (
                <li key={item.id} className={styles.reviewBio}>
                  <div><strong>{item.profession}</strong><span className={styles.planBadge}>{item.status}</span></div>
                  <p>Paciente: {item.patientUserId}</p>
                  <p>Perfil profissional: {item.professionalProfileId}</p>
                  <p>Capabilities: {item.scopes.length > 0 ? item.scopes.map((scope) => scope.capability).join(", ") : "Nenhuma ativa"}</p>
                  <small>Criado em {formatDate(item.createdAt)} · Atualizado em {formatDate(item.updatedAt)}</small>
                  <small>Início: {formatDate(item.startsAt)} · Expiração: {formatDate(item.expiresAt)}</small>
                  {(item.pausedAt || item.revokedAt || item.communicationBlockedAt) && (
                    <small>
                      {item.pausedAt ? `Pausado: ${formatDate(item.pausedAt)}` : ""}
                      {item.revokedAt ? ` · Revogado: ${formatDate(item.revokedAt)}` : ""}
                      {item.communicationBlockedAt ? ` · Comunicação bloqueada: ${formatDate(item.communicationBlockedAt)}` : ""}
                    </small>
                  )}
                </li>
              ))}
            </ol>
            {relationshipsMoreState.phase === "error" && (
              <FeedbackState
                variant="error"
                title="Não foi possível carregar mais vínculos"
                description={adminErrorMessage(relationshipsMoreState.error, "Os vínculos já carregados continuam disponíveis.")}
                action={<button type="button" className={styles.secondaryButton} onClick={() => void loadMoreRelationships()}>Tentar novamente</button>}
                className={styles.feedback}
              />
            )}
            {relationshipsState.data.nextCursor && relationshipsMoreState.phase !== "error" && (
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={relationshipsMoreState.phase === "loading"}
                aria-busy={relationshipsMoreState.phase === "loading"}
                onClick={() => void loadMoreRelationships()}
              >
                {relationshipsMoreState.phase === "loading" ? "Carregando mais…" : "Carregar mais vínculos"}
              </button>
            )}
          </>
        )}
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.sectionTitle}>
          <div>
            <span className={styles.kicker}>Segurança da comunicação</span>
            <h2>Denúncias</h2>
            <p>Analise o contexto somente para moderação e registre a decisão tomada.</p>
          </div>
          <label className={styles.statusFilter}>
            Situação
            <select value={reportStatus} onChange={(event) => setReportStatus(event.target.value as CommunicationReportStatus)}>
              <option value="OPEN">Abertas</option>
              <option value="RESOLVED">Resolvidas</option>
              <option value="DISMISSED">Descartadas</option>
            </select>
          </label>
        </div>
        <MutationFeedback state={reportMutation} pendingTitle="Registrando decisão" errorTitle="Não foi possível encerrar a denúncia" fallbackError="Não foi possível encerrar a denúncia." className={styles.feedback} />
        {reportsState.phase === "loading" ? (
          <FeedbackState variant="loading" title="Carregando denúncias" description="Consultando a fila de moderação selecionada." className={styles.feedback} />
        ) : reportsState.phase === "error" ? (
          <FeedbackState
            variant="error"
            title="Não foi possível carregar as denúncias"
            description={adminErrorMessage(reportsState.error, "Não foi possível carregar as denúncias.")}
            action={<button type="button" className={styles.secondaryButton} onClick={() => void loadReports()}>Tentar novamente</button>}
            className={styles.feedback}
          />
        ) : reportsState.phase === "empty" ? (
          <FeedbackState variant="empty" title="Nenhuma denúncia nesta situação" description="A consulta foi concluída e a fila está atualizada." className={styles.feedback} />
        ) : (
          <div className={styles.careReviewGrid}>
            <div className={styles.reviewList}>
              {reports.map((report) => (
                <button
                  key={report.id}
                  className={selectedReport?.id === report.id ? styles.reviewSelected : styles.reviewItem}
                  onClick={() => { setSelectedReportId(report.id); setResolutionNote(""); setReportMutation({ phase: "idle" }); }}
                >
                  <strong>{reportCategoryLabels[report.category] ?? report.category}</strong>
                  <span>{report.patient.name} · {report.relationship.professionalProfile.displayName}</span>
                  <small>{formatDate(report.createdAt)}</small>
                </button>
              ))}
              {reportsMoreState.phase === "error" && (
                <FeedbackState
                  variant="error"
                  title="Não foi possível carregar mais denúncias"
                  description={adminErrorMessage(reportsMoreState.error, "As denúncias já carregadas continuam disponíveis.")}
                  action={<button type="button" className={styles.secondaryButton} onClick={() => void loadMoreReports()}>Tentar novamente</button>}
                  className={styles.feedback}
                />
              )}
              {reportsState.data.nextCursor && reportsMoreState.phase !== "error" && (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={reportsMoreState.phase === "loading"}
                  aria-busy={reportsMoreState.phase === "loading"}
                  onClick={() => void loadMoreReports()}
                >
                  {reportsMoreState.phase === "loading" ? "Carregando mais…" : "Carregar mais denúncias"}
                </button>
              )}
            </div>
            {selectedReport && (
              <div className={styles.reviewDetail}>
                <div className={styles.reviewIdentity}>
                  <div>
                    <span className={styles.kicker}>{reportCategoryLabels[selectedReport.category] ?? selectedReport.category}</span>
                    <h3>Relato de {selectedReport.reporter.name}</h3>
                    <p>Paciente: {selectedReport.patient.name} · Profissional: {selectedReport.relationship.professionalProfile.displayName}</p>
                  </div>
                  <span className={styles.planBadge}>{selectedReport.status}</span>
                </div>
                <div className={styles.reviewBio}>
                  <strong>Descrição</strong>
                  <p>{selectedReport.details || "Nenhum detalhe adicional informado."}</p>
                </div>
                {selectedReport.message && (
                  <div className={styles.reviewBio}>
                    <strong>Mensagem denunciada · {formatDate(selectedReport.message.createdAt)}</strong>
                    <p>{selectedReport.message.content}</p>
                  </div>
                )}
                {selectedReport.status === "OPEN" ? (
                  <div className={styles.reviewActions}>
                    <label>
                      Análise e medidas tomadas
                      <textarea value={resolutionNote} onChange={(event) => setResolutionNote(event.target.value)} rows={4} maxLength={2000} />
                    </label>
                    <div className={styles.actions}>
                      <button disabled={reportMutation.phase === "pending"} className={styles.secondaryButton} onClick={() => void resolveReport("dismiss")}>Descartar com justificativa</button>
                      <button disabled={reportMutation.phase === "pending"} className={styles.primaryButton} onClick={() => void resolveReport("resolve")}>{reportMutation.phase === "pending" ? "Salvando…" : "Marcar como resolvida"}</button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.reviewBio}>
                    <strong>Resolução · {formatDate(selectedReport.resolvedAt)}</strong>
                    <p>{selectedReport.resolutionNote}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.sectionTitle}>
          <div>
            <span className={styles.kicker}>Auditoria minimizada</span>
            <h2>Acessos administrativos ao cuidado</h2>
            <p>Consulte somente identificadores operacionais, recurso, ação, resultado e correlação.</p>
          </div>
          <form
            className={styles.statusFilter}
            onSubmit={(event) => { event.preventDefault(); applyAuditFilter(); }}
          >
            <label htmlFor="audit-patient-filter">UUID da paciente (opcional)</label>
            <input
              id="audit-patient-filter"
              value={auditFilterDraft}
              onChange={(event) => { setAuditFilterDraft(event.target.value); setAuditFilterError(null); }}
              aria-invalid={Boolean(auditFilterError)}
              aria-describedby={auditFilterError ? "audit-patient-filter-error" : undefined}
              autoComplete="off"
              spellCheck={false}
            />
            <div className={styles.actions}>
              <button type="submit" className={styles.secondaryButton}>Aplicar filtro</button>
              {(auditFilterDraft || auditPatientFilter) && (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => {
                    setAuditFilterDraft("");
                    setAuditFilterError(null);
                    if (auditPatientFilter) setAuditPatientFilter("");
                    else void loadAuditLogs();
                  }}
                >
                  Limpar
                </button>
              )}
            </div>
          </form>
        </div>
        {auditFilterError && <p id="audit-patient-filter-error" role="alert" className={styles.feedback}>{auditFilterError}</p>}
        {auditState.phase === "loading" ? (
          <FeedbackState variant="loading" title="Carregando auditoria" description="Consultando eventos administrativos minimizados." className={styles.feedback} />
        ) : auditState.phase === "error" ? (
          <FeedbackState
            variant="error"
            title="Não foi possível carregar a auditoria"
            description={adminErrorMessage(auditState.error, "Não foi possível consultar os eventos administrativos.")}
            action={<button type="button" className={styles.secondaryButton} onClick={() => void loadAuditLogs()}>Tentar novamente</button>}
            className={styles.feedback}
          />
        ) : auditState.phase === "empty" ? (
          <FeedbackState variant="empty" title="Nenhum evento de auditoria" description="A consulta foi concluída sem eventos para o filtro informado." className={styles.feedback} />
        ) : (
          <>
            <ol className={styles.reviewList} aria-label="Eventos de auditoria administrativa">
              {auditItems.map((item) => (
                <li key={item.id} className={styles.reviewBio}>
                  <div><strong>{item.resource} · {item.action}</strong><span className={styles.planBadge}>{item.outcome}</span></div>
                  <p>Paciente: {item.patientUserId}</p>
                  <p>Ator: {item.actorUserId ?? "Sistema"}{item.relationshipId ? ` · Vínculo: ${item.relationshipId}` : ""}</p>
                  <small>{formatDate(item.createdAt)}{item.requestId ? ` · Identificador: ${item.requestId}` : ""}</small>
                </li>
              ))}
            </ol>
            {auditMoreState.phase === "error" && (
              <FeedbackState
                variant="error"
                title="Não foi possível carregar mais eventos"
                description={adminErrorMessage(auditMoreState.error, "Os eventos já carregados continuam disponíveis.")}
                action={<button type="button" className={styles.secondaryButton} onClick={() => void loadMoreAuditLogs()}>Tentar novamente</button>}
                className={styles.feedback}
              />
            )}
            {auditState.data.nextCursor && auditMoreState.phase !== "error" && (
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={auditMoreState.phase === "loading"}
                aria-busy={auditMoreState.phase === "loading"}
                onClick={() => void loadMoreAuditLogs()}
              >
                {auditMoreState.phase === "loading" ? "Carregando mais…" : "Carregar mais eventos"}
              </button>
            )}
          </>
        )}
      </section>

      <div className={styles.careReviewGrid}>
        <aside className={styles.sectionCard}>
          <h3>Cadastros</h3>
          <div className={styles.reviewList}>
            {profilesState.phase === "loading" ? (
              <FeedbackState variant="loading" title="Carregando cadastros" description="Consultando a fila de verificação selecionada." className={styles.feedback} />
            ) : profilesState.phase === "error" ? (
              <FeedbackState
                variant="error"
                title="Não foi possível carregar os cadastros"
                description={adminErrorMessage(profilesState.error, "Não foi possível carregar os cadastros.")}
                action={<button type="button" className={styles.secondaryButton} onClick={() => void loadProfiles()}>Tentar novamente</button>}
                className={styles.feedback}
              />
            ) : profilesState.phase === "empty" ? (
              <FeedbackState variant="empty" title="Nenhum cadastro nesta situação" description="A consulta foi concluída e não há perfis nesta fila." className={styles.feedback} />
            ) : (
              <>
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    className={selected?.id === profile.id ? styles.reviewSelected : styles.reviewItem}
                    onClick={() => { setSelectedId(profile.id); setReason(""); }}
                  >
                    <strong>{profile.displayName}</strong>
                    <span>{professionLabels[profile.primaryProfession] ?? profile.primaryProfession}</span>
                    <small>{profile.user.email}</small>
                  </button>
                ))}
                {profilesMoreState.phase === "error" && (
                  <FeedbackState
                    variant="error"
                    title="Não foi possível carregar mais cadastros"
                    description={adminErrorMessage(profilesMoreState.error, "Os cadastros já carregados continuam disponíveis.")}
                    action={<button type="button" className={styles.secondaryButton} onClick={() => void loadMoreProfiles()}>Tentar novamente</button>}
                    className={styles.feedback}
                  />
                )}
                {profilesState.data.nextCursor && profilesMoreState.phase !== "error" && (
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    disabled={profilesMoreState.phase === "loading"}
                    aria-busy={profilesMoreState.phase === "loading"}
                    onClick={() => void loadMoreProfiles()}
                  >
                    {profilesMoreState.phase === "loading" ? "Carregando mais…" : "Carregar mais cadastros"}
                  </button>
                )}
              </>
            )}
          </div>
        </aside>

        <main className={styles.sectionCard}>
          <MutationFeedback state={reviewMutation} pendingTitle="Registrando análise" errorTitle="Não foi possível concluir a análise" fallbackError="Não foi possível concluir a análise." className={styles.feedback} />
          {profilesState.phase === "error" ? (
            <div className={styles.empty}><h3>Detalhes indisponíveis</h3><p>Recarregue a fila de cadastros para consultar perfil e credenciais.</p></div>
          ) : profilesState.phase === "loading" ? (
            <div className={styles.empty}><h3>Carregando detalhes</h3><p>Aguarde a atualização da fila.</p></div>
          ) : !selected ? (
            <div className={styles.empty}><h3>Selecione um cadastro</h3><p>Os detalhes e registros aparecem aqui.</p></div>
          ) : (
            <div className={styles.reviewDetail}>
              <div className={styles.reviewIdentity}>
                <div>
                  <span className={styles.kicker}>{professionLabels[selected.primaryProfession] ?? selected.primaryProfession}</span>
                  <h2>{selected.displayName}</h2>
                  <p>{selected.user.name} · {selected.user.email}</p>
                </div>
                <span className={styles.planBadge}>{statusLabels[selected.verificationStatus]}</span>
              </div>
              <dl className={styles.profileFacts}>
                <div><dt>Enviado em</dt><dd>{formatDate(selected.submittedAt)}</dd></div>
                <div><dt>Localidade</dt><dd>{[selected.city, selected.state].filter(Boolean).join(" / ") || "Não informada"}</dd></div>
                <div><dt>Verificado em</dt><dd>{formatDate(selected.verifiedAt)}</dd></div>
              </dl>
              {selected.bio && <div className={styles.reviewBio}><strong>Apresentação</strong><p>{selected.bio}</p></div>}
              <div>
                <h3>Credenciais declaradas</h3>
                <div className={styles.credentialList}>
                  {selected.credentials.length === 0 ? <p>Nenhuma credencial informada.</p> : selected.credentials.map((credential) => {
                    const mutation = credentialMutations[credential.id] ?? { phase: "idle" as const };
                    return <article key={credential.id}>
                      <div>
                        <strong>{credential.type}</strong>
                        <span>{credential.renewalOfCredentialId ? `RENOVAÇÃO · ${credential.status}` : credential.status}</span>
                      </div>
                      <p>{credential.registrationNumber || "Sem número"}{credential.jurisdiction ? ` · ${credential.jurisdiction}` : ""}</p>
                      <small>{credential.specialty || credential.issuer || "Sem especialidade informada"}</small>
                      {credential.documentFileName && (
                        <>
                          <MutationFeedback state={mutation} pendingTitle="Obtendo comprovante" errorTitle="Não foi possível abrir o comprovante" fallbackError="Não foi possível abrir o comprovante." className={styles.feedback} />
                          <button
                            className={styles.secondaryButton}
                            disabled={mutation.phase === "pending"}
                            onClick={() => void openCredential(credential)}
                          >
                            {mutation.phase === "pending" ? "Abrindo…" : "Ver comprovante"}
                          </button>
                        </>
                      )}
                    </article>;
                  })}
                </div>
              </div>
              <div>
                <h3>Histórico de auditoria</h3>
                <div className={styles.credentialList}>
                  {(selected.reviewLogs ?? []).length === 0 ? <p>Nenhuma decisão registrada.</p> : selected.reviewLogs.map((log) => (
                    <article key={log.id}>
                      <div><strong>{log.action.replaceAll("_", " ")}</strong><span>{formatDate(log.createdAt)}</span></div>
                      <p>{[log.previousStatus, log.resultingStatus].filter(Boolean).join(" → ") || "Acesso administrativo"}</p>
                      <small>{log.reason || "Sem observação"} · {log.actor?.name || log.actor?.email || "Administrador removido"}</small>
                    </article>
                  ))}
                </div>
              </div>
              {(selected.verificationStatus === "PENDING_VERIFICATION" || isRenewalReview) && (
                <div className={styles.reviewActions}>
                  {isRenewalReview && (
                    <div className={styles.reviewBio}>
                      <strong>Renovação sem interrupção</strong>
                      <p>A credencial atual permanece válida até a aprovação da nova versão. Correção ou rejeição não pausa o perfil nem os vínculos.</p>
                    </div>
                  )}
                  <label>
                    Motivo ou orientação ao profissional
                    <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} maxLength={1000} placeholder="Obrigatório para correção ou rejeição" />
                  </label>
                  <div className={styles.actions}>
                    <button disabled={reviewMutation.phase === "pending"} className={styles.dangerButton} onClick={() => void review("reject")}>Rejeitar</button>
                    <button disabled={reviewMutation.phase === "pending"} className={styles.secondaryButton} onClick={() => void review("request_correction")}>Solicitar correção</button>
                    <button disabled={reviewMutation.phase === "pending"} className={styles.primaryButton} onClick={() => void review("verify")}>{reviewMutation.phase === "pending" ? "Salvando…" : isRenewalReview ? "Aprovar renovação" : "Verificar perfil"}</button>
                  </div>
                </div>
              )}
              {selected.verificationStatus === "VERIFIED" && !isRenewalReview && (
                <div className={styles.reviewActions}>
                  <label>
                    Motivo da suspensão
                    <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} maxLength={1000} placeholder="Descreva o motivo operacional ou de segurança" />
                  </label>
                  <div className={styles.actions}>
                    <button disabled={reviewMutation.phase === "pending"} className={styles.dangerButton} onClick={() => void review("suspend")}>Suspender perfil e pausar vínculos</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

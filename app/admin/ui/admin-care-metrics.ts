export type AdminCareOperations = {
  active: number;
  paused: number;
  expiring: number;
  blocked: number;
  auditEvents: number;
  deniedAuditEvents: number;
  openReports: number;
  pendingProfiles: number;
  expiringCredentials: number;
  expiredProfiles: number;
};

const metricFields = [
  "activeRelationships",
  "pausedRelationships",
  "expiringRelationships",
  "blockedCommunications",
  "openReports",
  "pendingProfiles",
  "expiringCredentials",
  "expiredProfiles",
  "auditEventsLast24h",
  "deniedAuditEventsLast24h",
] as const;

export function readAdminCareMetrics(payload: unknown): AdminCareOperations {
  if (!payload || typeof payload !== "object") throw new Error("Resposta inválida das métricas administrativas.");
  const envelope = payload as { metrics?: unknown };
  if (!envelope.metrics || typeof envelope.metrics !== "object") throw new Error("Resposta inválida das métricas administrativas.");
  const metrics = envelope.metrics as Record<string, unknown>;
  for (const field of metricFields) {
    const value = metrics[field];
    if (!Number.isSafeInteger(value) || (value as number) < 0) throw new Error("Resposta inválida das métricas administrativas.");
  }
  return {
    active: metrics.activeRelationships as number,
    paused: metrics.pausedRelationships as number,
    expiring: metrics.expiringRelationships as number,
    blocked: metrics.blockedCommunications as number,
    openReports: metrics.openReports as number,
    pendingProfiles: metrics.pendingProfiles as number,
    expiringCredentials: metrics.expiringCredentials as number,
    expiredProfiles: metrics.expiredProfiles as number,
    auditEvents: metrics.auditEventsLast24h as number,
    deniedAuditEvents: metrics.deniedAuditEventsLast24h as number,
  };
}

export function areAdminCareMetricsEmpty(metrics: AdminCareOperations) {
  return Object.values(metrics).every((value) => value === 0);
}

export function isCurrentAdminCareMetricsRequest(requestedVersion: number, currentVersion: number) {
  return requestedVersion === currentVersion;
}

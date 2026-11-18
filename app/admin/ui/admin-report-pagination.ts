export const communicationReportStatuses = ["OPEN", "RESOLVED", "DISMISSED"] as const;

export type CommunicationReportStatus = typeof communicationReportStatuses[number];

export type CommunicationReportListItem = {
  id: string;
  patientUserId: string;
  relationshipId: string;
  messageId: string | null;
  reporterUserId: string;
  category: string;
  details: string | null;
  status: CommunicationReportStatus;
  resolvedAt: string | null;
  resolvedByUserId: string | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
};

type AdminReportPerson = { id: string; name: string };

export type CommunicationReportDetail = CommunicationReportListItem & {
  patient: AdminReportPerson;
  reporter: AdminReportPerson;
  resolvedBy: AdminReportPerson | null;
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
      user: AdminReportPerson;
    };
  };
};

export type AdminReportPage = {
  items: CommunicationReportListItem[];
  nextCursor: string | null;
};

const invalid = () => new Error("Resposta inválida da fila de denúncias.");
const listItemKeys = [
  "id",
  "patientUserId",
  "relationshipId",
  "messageId",
  "reporterUserId",
  "category",
  "details",
  "status",
  "resolvedAt",
  "resolvedByUserId",
  "resolutionNote",
  "createdAt",
  "updatedAt",
] as const;
const detailKeys = [...listItemKeys, "patient", "reporter", "resolvedBy", "message", "relationship"] as const;

function readRecord(value: unknown, allowedKeys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw invalid();
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => !allowedKeys.includes(key))) throw invalid();
  return record;
}

function readString(value: unknown) {
  if (typeof value !== "string") throw invalid();
  return value;
}

function readNullableString(value: unknown) {
  if (value === null) return null;
  return readString(value);
}

function readPerson(value: unknown): AdminReportPerson {
  const person = readRecord(value, ["id", "name"]);
  return { id: readString(person.id), name: readString(person.name) };
}

function readReportListItem(value: unknown, allowedKeys: readonly string[] = listItemKeys): CommunicationReportListItem {
  const report = readRecord(value, allowedKeys);
  const status = readString(report.status);
  if (!communicationReportStatuses.includes(status as CommunicationReportStatus)) throw invalid();
  return {
    id: readString(report.id),
    patientUserId: readString(report.patientUserId),
    relationshipId: readString(report.relationshipId),
    messageId: readNullableString(report.messageId),
    reporterUserId: readString(report.reporterUserId),
    category: readString(report.category),
    details: readNullableString(report.details),
    status: status as CommunicationReportStatus,
    resolvedAt: readNullableString(report.resolvedAt),
    resolvedByUserId: readNullableString(report.resolvedByUserId),
    resolutionNote: readNullableString(report.resolutionNote),
    createdAt: readString(report.createdAt),
    updatedAt: readString(report.updatedAt),
  };
}

export function readAdminReportPage(payload: unknown): AdminReportPage {
  const envelope = readRecord(payload, ["items", "reports", "nextCursor"]);
  const source = Array.isArray(envelope.items)
    ? envelope.items
    : Array.isArray(envelope.reports)
      ? envelope.reports
      : null;
  if (!source || (envelope.nextCursor !== null && envelope.nextCursor !== undefined && typeof envelope.nextCursor !== "string")) {
    throw invalid();
  }
  return {
    items: source.map((item) => readReportListItem(item)),
    nextCursor: typeof envelope.nextCursor === "string" ? envelope.nextCursor : null,
  };
}

export function readAdminReportDetail(payload: unknown): CommunicationReportDetail {
  const envelope = readRecord(payload, ["report"]);
  const report = readRecord(envelope.report, detailKeys);
  const relationship = readRecord(report.relationship, ["id", "status", "communicationBlockedAt", "professionalProfile"]);
  const professionalProfile = readRecord(relationship.professionalProfile, ["id", "displayName", "primaryProfession", "user"]);
  const rawMessage = report.message;
  const message = rawMessage === null
    ? null
    : (() => {
        const value = readRecord(rawMessage, ["id", "content", "authorUserId", "createdAt"]);
        return {
          id: readString(value.id),
          content: readString(value.content),
          authorUserId: readString(value.authorUserId),
          createdAt: readString(value.createdAt),
        };
      })();

  return {
    ...readReportListItem(report, detailKeys),
    patient: readPerson(report.patient),
    reporter: readPerson(report.reporter),
    resolvedBy: report.resolvedBy === null ? null : readPerson(report.resolvedBy),
    message,
    relationship: {
      id: readString(relationship.id),
      status: readString(relationship.status),
      communicationBlockedAt: readNullableString(relationship.communicationBlockedAt),
      professionalProfile: {
        id: readString(professionalProfile.id),
        displayName: readString(professionalProfile.displayName),
        primaryProfession: readString(professionalProfile.primaryProfession),
        user: readPerson(professionalProfile.user),
      },
    },
  };
}

export function isCurrentAdminReportDetailRequest(
  requestedReportId: string,
  activeReportId: string | null,
  requestedVersion: number,
  currentVersion: number,
) {
  return requestedReportId === activeReportId && requestedVersion === currentVersion;
}

export function mergeAdminReportPages(current: CommunicationReportListItem[], incoming: CommunicationReportListItem[]) {
  const merged = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) merged.set(item.id, item);
  return [...merged.values()];
}

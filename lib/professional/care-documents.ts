export const documentCategories = ["LAB_RESULT", "IMAGING", "CLINICAL_REPORT", "PRESCRIPTION", "OTHER"] as const;
export type DocumentCategory = (typeof documentCategories)[number] | "UNKNOWN";
export const documentStatuses = ["PENDING_UPLOAD", "PENDING_SCAN", "AVAILABLE", "QUARANTINED", "REJECTED", "LEGACY_UNSCANNED"] as const;
export type DocumentStatus = (typeof documentStatuses)[number] | "UNKNOWN";

export type SharedDocument = {
  id: string;
  pregnancyId: string;
  title: string;
  clinicalCategory: DocumentCategory;
  tags: string[];
  clinicalDate: string | null;
  mimeType: string;
  sizeBytes: number;
  version: number;
  versionNumber: number;
  uploadedAt: string;
  status: DocumentStatus;
  myShare: { id: string; version: number } | null;
};

export type SharedDocumentsPage = { items: SharedDocument[]; nextCursor: string | null; requestId: string };
export type DocumentCollaboration = {
  review: { id: string; note: string | null; reviewedAt: string | null } | null;
  comments: Array<{ id: string; content: string; createdAt: string; authorLabel: string }>;
  requestId: string;
};

function object(value: unknown): Record<string, unknown> | null { return typeof value === "object" && value !== null ? value as Record<string, unknown> : null; }
function text(value: unknown) { return typeof value === "string" ? value : ""; }
function nullableText(value: unknown) { return typeof value === "string" ? value : null; }
function enumValue<T extends readonly string[]>(value: unknown, values: T): T[number] | "UNKNOWN" { return typeof value === "string" && values.includes(value) ? value as T[number] : "UNKNOWN"; }

export function parseSharedDocumentsPage(value: unknown): SharedDocumentsPage {
  const root = object(value);
  if (!root || !Array.isArray(root.items)) throw new Error("DOCUMENT_RESPONSE_INVALID");
  return {
    nextCursor: typeof root.nextCursor === "string" ? root.nextCursor : null,
    requestId: text(root.requestId),
    items: root.items.flatMap((raw) => {
      const item = object(raw); const share = object(item?.myShare);
      if (!item || !text(item.id) || !text(item.pregnancyId)) return [];
      return [{
        id: text(item.id), pregnancyId: text(item.pregnancyId), title: text(item.title) || "Documento sem título",
        clinicalCategory: enumValue(item.clinicalCategory, documentCategories),
        tags: Array.isArray(item.tags) ? item.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 20) : [],
        clinicalDate: nullableText(item.clinicalDate), mimeType: text(item.mimeType),
        sizeBytes: Number.isFinite(item.sizeBytes) ? Number(item.sizeBytes) : 0,
        version: Number.isInteger(item.version) ? Number(item.version) : 0,
        versionNumber: Number.isInteger(item.versionNumber) ? Number(item.versionNumber) : 0,
        uploadedAt: text(item.uploadedAt),
        status: enumValue(item.status || "AVAILABLE", documentStatuses),
        myShare: share && text(share.id) ? { id: text(share.id), version: Number.isInteger(share.version) ? Number(share.version) : 0 } : null,
      }];
    }),
  };
}

export function parseDocumentCollaboration(value: unknown): DocumentCollaboration {
  const root = object(value); if (!root) throw new Error("DOCUMENT_COLLABORATION_INVALID");
  const review = object(root.review);
  return {
    requestId: text(root.requestId),
    review: review && text(review.id) ? { id: text(review.id), note: nullableText(review.note), reviewedAt: nullableText(review.reviewedAt || review.updatedAt) } : null,
    comments: Array.isArray(root.comments) ? root.comments.flatMap((raw) => {
      const comment = object(raw); const author = object(comment?.author);
      if (!comment || !text(comment.id) || !text(comment.content)) return [];
      return [{ id: text(comment.id), content: text(comment.content), createdAt: text(comment.createdAt), authorLabel: text(author?.displayName || author?.name) || "Profissional" }];
    }) : [],
  };
}

export function appendSharedDocuments(current: SharedDocument[], incoming: SharedDocument[]) {
  const seen = new Set(current.map((item) => item.id));
  return [...current, ...incoming.filter((item) => !seen.has(item.id))];
}

export function documentCategoryLabel(value: DocumentCategory) {
  return ({ LAB_RESULT: "Laboratório", IMAGING: "Imagem", CLINICAL_REPORT: "Relatório clínico", PRESCRIPTION: "Prescrição", OTHER: "Outro", UNKNOWN: "Categoria indisponível" } as const)[value];
}

export function documentStatusLabel(value: DocumentStatus) {
  return ({ PENDING_UPLOAD: "Upload pendente", PENDING_SCAN: "Em verificação", AVAILABLE: "Disponível", QUARANTINED: "Em quarentena", REJECTED: "Rejeitado", LEGACY_UNSCANNED: "Histórico ainda não verificado", UNKNOWN: "Estado indisponível" } as const)[value];
}

export function canOpenSharedDocument(document: SharedDocument) {
  return document.status === "AVAILABLE" && Boolean(document.myShare);
}

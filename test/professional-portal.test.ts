import assert from "node:assert/strict";
import test from "node:test";
import {
  activeAgendaFilterCount,
  agendaFilterQuery,
  emptyAgendaFilter,
  filterAgenda,
} from "../lib/professional/agenda.ts";
import { isAllowedProfessionalCarePath } from "../lib/professional/care-proxy-policy.ts";
import {
  careContextCacheKey,
  parseCareProfilesResponse,
  parseResolvedCareContext,
  readCanonicalCareError,
} from "../lib/professional/care-context.ts";
import {
  contextualCareHeaders,
  contextualCareRequiresIdempotency,
  contextualCareUpstreamPath,
  isAllowedContextualCarePath,
  isMt01CareContextsEnabled,
  isMt02CareRelationshipsEnabled,
  isMt03ProfessionalPatientsEnabled,
  isMt04DocumentSharesEnabled,
  isMt05AppointmentsEnabled,
  isMt06CareChatEnabled,
  isMt07LaborEventsEnabled,
  isValidCareContextPath,
  normalizeProfessionalPatientsQuery,
  normalizeContextualCareQuery,
  professionalProfileHeaders,
} from "../lib/professional/care-context-policy.ts";
import {
  canTerminateRelationship,
  invitationStatusLabel,
  parseCareInvitation,
  parseCareRelationships,
  relationshipStatusLabel,
  scopeLabel,
} from "../lib/professional/care-relationships.ts";
import {
  appendPatientPage,
  isPatientCardAvailable,
  parseProfessionalPatientsPage,
  relationshipStatusLabel as patientRelationshipStatusLabel,
} from "../lib/professional/professional-patients.ts";
import { readProfessionalPatientsFresh } from "../lib/professional/professional-patient-reader.ts";
import {
  appendSharedDocuments,
  canOpenSharedDocument,
  parseDocumentCollaboration,
  parseSharedDocumentsPage,
} from "../lib/professional/care-documents.ts";
import {
  appointmentActionAllowed,
  buildProfessionalAppointmentProposal,
  localDateTimeWithOffset,
  parseAppointmentEvents,
  parseAppointmentsPage,
} from "../lib/professional/care-appointments.ts";
import {
  buildCareMessage,
  isComposerPolicyAcknowledgable,
  mergeMessages,
  parseMessagePage,
} from "../lib/professional/care-chat.ts";
import {
  isCompletePreferenceMatrix,
  mergeNotifications,
  notificationCategories,
  notificationChannels,
  notificationDeepLinkTarget,
  parseNotificationPage,
  parseNotificationPreferences,
} from "../lib/professional/care-notifications.ts";
import {
  isAllowedNotificationPath,
  isMt08NotificationPreferencesEnabled,
  isMt08NotificationsEnabled,
  normalizeNotificationQuery,
  notificationUpstreamPath,
} from "../lib/professional/notification-policy.ts";
import { LABOR_SAFETY_TEXT_PT_BR, LABOR_SAFETY_TEXT_VERSION, laborEventLabel, mergeLaborEvents, parseLaborEventPage } from "../lib/professional/labor-events.ts";
import { parseCareEntitlement, parseChatEntitlement } from "../lib/professional/care-entitlements.ts";
import { entitlementUpstreamPath, isAllowedEntitlementPath, isMt09ChatSponsorshipEnabled, isMt09EntitlementsEnabled } from "../lib/professional/entitlement-policy.ts";

test("professional proxy exposes only explicit portal endpoints and methods", () => {
  assert.equal(isAllowedProfessionalCarePath("professional/profile"), true);
  assert.equal(isAllowedProfessionalCarePath("professional/patients"), true);
  assert.equal(isAllowedProfessionalCarePath("professional/agenda"), true);
  assert.equal(isAllowedProfessionalCarePath("professional/agenda/export.ics"), true);
  assert.equal(isAllowedProfessionalCarePath("team"), false);
  assert.equal(isAllowedProfessionalCarePath("professional/profile/submit"), false);
  assert.equal(isAllowedProfessionalCarePath("../admin/users"), false);
  const clinicId = "1bb1ca83-a3aa-4775-9c09-539d208e3bb7";
  const memberId = "32cc3546-d372-4ec7-b633-a81672fbe43d";
  assert.equal(isAllowedProfessionalCarePath("professional/clinics", "GET"), true);
  assert.equal(isAllowedProfessionalCarePath("professional/clinics", "POST"), true);
  assert.equal(isAllowedProfessionalCarePath(`professional/clinics/${clinicId}/members`, "GET"), true);
  assert.equal(isAllowedProfessionalCarePath(`professional/clinics/${clinicId}/members/${memberId}`, "PATCH"), true);
  assert.equal(isAllowedProfessionalCarePath(`professional/clinics/${clinicId}/members`, "DELETE"), false);
  assert.equal(isAllowedProfessionalCarePath("professional/clinics/not-an-id/members", "GET"), false);
});

test("agenda filtering and export query share the same criteria", () => {
  const filter = {
    ...emptyAgendaFilter,
    patientUserId: "patient-1",
    type: "CONSULTATION",
    status: "CONFIRMED",
    from: "2026-10-25",
    to: "2026-10-26",
  };
  const items = [
    {
      id: "included",
      type: "CONSULTATION",
      status: "CONFIRMED",
      scheduledAt: "2026-10-25T15:00:00.000Z",
      user: { id: "patient-1" },
    },
    {
      id: "other-patient",
      type: "CONSULTATION",
      status: "CONFIRMED",
      scheduledAt: "2026-10-25T15:00:00.000Z",
      user: { id: "patient-2" },
    },
  ];

  assert.deepEqual(filterAgenda(items, filter).map((item) => item.id), ["included"]);
  assert.equal(activeAgendaFilterCount(filter), 5);
  const query = new URLSearchParams(agendaFilterQuery(filter));
  assert.equal(query.get("patientUserId"), "patient-1");
  assert.equal(query.get("type"), "CONSULTATION");
  assert.equal(query.get("status"), "CONFIRMED");
  assert.equal(query.get("from"), new Date("2026-10-25T00:00:00").toISOString());
  assert.equal(query.get("to"), new Date("2026-10-26T23:59:59.999").toISOString());
});

test("MT-01 DTO parser preserves explicit context and falls back unknown enums", () => {
  const profileId = "8e954350-5c54-4d7c-a58c-06cb7ac85919";
  const pregnancyId = "3dd3776b-683a-4861-b555-ae528fb99518";
  const bootstrap = parseCareProfilesResponse({
    profiles: [{
      id: profileId,
      type: "NEW_PROFILE_TYPE",
      status: "ACTIVE",
      version: 2,
      professional: null,
      contexts: [{ pregnancyId, accessKind: "NEW_ACCESS_KIND", status: "ACTIVE" }],
    }],
    requestId: "req-list",
  });
  assert.equal(bootstrap.profiles[0].type, "UNKNOWN");
  assert.equal(bootstrap.profiles[0].contexts[0].accessKind, "UNKNOWN");
  const resolved = parseResolvedCareContext({
    context: {
      profileId,
      profileType: "PROFESSIONAL",
      profileVersion: 2,
      pregnancyId,
      pregnancyVersion: 4,
      accessKind: "PROFESSIONAL_RELATIONSHIP",
      membershipId: null,
      relationshipId: "relationship-id",
    },
    requestId: "req-resolve",
  });
  assert.equal(resolved.context.pregnancyId, pregnancyId);
  assert.equal(resolved.requestId, "req-resolve");
});

test("MT-01 contextual proxy is flag-off, allowlisted and creates only canonical headers", () => {
  const profileId = "8e954350-5c54-4d7c-a58c-06cb7ac85919";
  const pregnancyId = "3dd3776b-683a-4861-b555-ae528fb99518";
  assert.equal(isMt01CareContextsEnabled(undefined), false);
  assert.equal(isMt01CareContextsEnabled("false"), false);
  assert.equal(isMt01CareContextsEnabled("true"), true);
  assert.equal(isValidCareContextPath(profileId, pregnancyId), true);
  assert.equal(isValidCareContextPath("other-user", pregnancyId), false);
  assert.equal(isAllowedContextualCarePath("summary", "GET"), true);
  assert.equal(isAllowedContextualCarePath("summary", "POST"), false);
  assert.equal(isAllowedContextualCarePath("../admin/users", "GET"), false);
  const headers = contextualCareHeaders(profileId, pregnancyId, "req-client");
  assert.deepEqual([...headers.keys()].sort(), ["x-momiz-pregnancy-id", "x-momiz-profile-id", "x-request-id"]);
  assert.equal(headers.get("authorization"), null);
});

test("MT-01 cache keys and canonical errors remain segregated by pregnancy", () => {
  const selection = {
    profileId: "8e954350-5c54-4d7c-a58c-06cb7ac85919",
    pregnancyId: "3dd3776b-683a-4861-b555-ae528fb99518",
  };
  assert.deepEqual(careContextCacheKey("epoch-a", selection, "summary"), [
    "professional", "epoch-a", selection.profileId, selection.pregnancyId, "summary",
  ]);
  assert.deepEqual(readCanonicalCareError({
    error: { code: "PREGNANCY_CONTEXT_DENIED", message: "Negado", requestId: "req-denied" },
  }, "fallback"), { code: "PREGNANCY_CONTEXT_DENIED", message: "Negado", requestId: "req-denied" });
});

test("MT-02 parser keeps invitation and relationship states fail-closed", () => {
  const pregnancyId = "3dd3776b-683a-4861-b555-ae528fb99518";
  const invitation = parseCareInvitation({ invitation: {
    id: "4dd3776b-683a-4861-b555-ae528fb99518",
    direction: "PROFESSIONAL_TO_PATIENT",
    status: "NEW_STATE",
    version: 3,
    scopes: ["birth.plan.comment"],
    token: "must-remain-ephemeral",
  } });
  assert.equal(invitation.status, "UNKNOWN");
  assert.equal(invitationStatusLabel(invitation.status, null), "Indisponível");
  const result = parseCareRelationships({
    requestId: "req-relationships",
    relationships: [{
      id: "5dd3776b-683a-4861-b555-ae528fb99518",
      pregnancyId,
      status: "READ_ONLY",
      version: 2,
      consentVersion: "care-sharing-v1",
      scopes: [{ capability: "birth.plan.comment" }, "future.scope"],
    }],
  });
  assert.equal(result.relationships[0].status, "READ_ONLY");
  assert.equal(relationshipStatusLabel(result.relationships[0].status), "Somente leitura");
  assert.equal(canTerminateRelationship(result.relationships[0].status), true);
  assert.equal(scopeLabel("birth.plan.comment"), "Comentar plano de parto");
  assert.equal(scopeLabel("future.scope"), "Permissão não reconhecida");
});

test("MT-02 proxy is flag-off and maps only contract routes when enabled", () => {
  const pregnancyId = "3dd3776b-683a-4861-b555-ae528fb99518";
  const invitationId = "4dd3776b-683a-4861-b555-ae528fb99518";
  const relationshipId = "5dd3776b-683a-4861-b555-ae528fb99518";
  assert.equal(isMt02CareRelationshipsEnabled(undefined), false);
  assert.equal(isMt02CareRelationshipsEnabled("false"), false);
  assert.equal(isMt02CareRelationshipsEnabled("true"), true);
  assert.equal(isAllowedContextualCarePath("relationships", "GET", false), false);
  assert.equal(isAllowedContextualCarePath("relationships", "GET", true), true);
  assert.equal(isAllowedContextualCarePath("invitations", "POST", true), true);
  assert.equal(isAllowedContextualCarePath(`invitations/${invitationId}/resend`, "POST", true), true);
  assert.equal(isAllowedContextualCarePath(`invitations/${invitationId}/decline`, "POST", true), true);
  assert.equal(isAllowedContextualCarePath(`invitations/${invitationId}`, "DELETE", true), true);
  assert.equal(isAllowedContextualCarePath(`relationships/${relationshipId}/terminate`, "POST", true), true);
  assert.equal(isAllowedContextualCarePath("invitations/not-a-uuid/resend", "POST", true), false);
  assert.equal(contextualCareUpstreamPath(pregnancyId, "invitations"), `/api/care/v2/pregnancies/${pregnancyId}/invitations`);
  assert.equal(contextualCareUpstreamPath(pregnancyId, `relationships/${relationshipId}/terminate`), `/api/care/v2/relationships/${relationshipId}/terminate`);
  assert.equal(contextualCareUpstreamPath(pregnancyId, "../admin/users"), null);
});

test("MT-03 patient DTO omits absent summaries and blocks unknown status", () => {
  const profileId = "8e954350-5c54-4d7c-a58c-06cb7ac85919";
  const pregnancyId = "3dd3776b-683a-4861-b555-ae528fb99518";
  const relationshipId = "5dd3776b-683a-4861-b555-ae528fb99518";
  const page = parseProfessionalPatientsPage({
    items: [{
      pregnancyId,
      relationshipId,
      relationshipVersion: 2,
      relationshipStatus: "FUTURE_STATUS",
      patient: { profileId, displayName: "Paciente Teste", photoUrl: null },
      pregnancyStatus: "ACTIVE",
      grantedScopes: [],
      summary: {},
      updatedAt: "2026-10-28T15:12:00.000Z",
    }],
    nextCursor: "opaque.cursor",
    requestId: "req-page",
  });
  assert.equal(page.items[0].relationshipStatus, "UNKNOWN");
  assert.equal(page.items[0].summary.unreadMessages, undefined);
  assert.equal(isPatientCardAvailable(page.items[0].relationshipStatus), false);
  assert.equal(patientRelationshipStatusLabel(page.items[0].relationshipStatus), "Indisponível");
});

test("MT-03 pagination dedupes by relationship", () => {
  const base = {
    pregnancyId: "3dd3776b-683a-4861-b555-ae528fb99518",
    relationshipId: "5dd3776b-683a-4861-b555-ae528fb99518",
    relationshipVersion: 1,
    relationshipStatus: "ACTIVE" as const,
    patient: { profileId: "8e954350-5c54-4d7c-a58c-06cb7ac85919", displayName: "Paciente", photoUrl: null },
    pregnancyStatus: "ACTIVE" as const,
    grantedScopes: [], summary: {}, updatedAt: "2026-10-28T15:12:00.000Z",
  };
  assert.equal(appendPatientPage([base], [base]).length, 1);
});

test("MT-03 always reads authorization-sensitive patients fresh after revocation", async () => {
  const responses = [
    new Response(JSON.stringify({ items: [{ relationshipStatus: "ACTIVE" }] }), { status: 200 }),
    new Response(JSON.stringify({ error: { code: "CARE_PROFILE_ACCESS_DENIED" } }), { status: 403 }),
  ];
  const calls: RequestInit[] = [];
  const fetcher = async (_path: string, init?: RequestInit) => {
    calls.push(init || {});
    return responses.shift() as Response;
  };

  assert.equal((await readProfessionalPatientsFresh(fetcher, "/patients", new Headers())).status, 200);
  assert.equal((await readProfessionalPatientsFresh(fetcher, "/patients", new Headers())).status, 403);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls.map((call) => call.cache), ["no-store", "no-store"]);
});

test("MT-03 BFF normalizes only allowlisted filters and creates profile-only headers", () => {
  const profileId = "8e954350-5c54-4d7c-a58c-06cb7ac85919";
  assert.equal(isMt03ProfessionalPatientsEnabled(undefined), false);
  assert.equal(isMt03ProfessionalPatientsEnabled("false"), false);
  assert.equal(isMt03ProfessionalPatientsEnabled("true"), true);
  const normalized = normalizeProfessionalPatientsQuery(new URLSearchParams("q=%20Ana%20&limit=10&pregnancyStatus=ARCHIVED"));
  assert.equal(normalized?.toString(), "limit=10&q=Ana&relationshipStatus=ACTIVE%2CREAD_ONLY&pregnancyStatus=ARCHIVED");
  assert.equal(normalizeProfessionalPatientsQuery(new URLSearchParams("email=secret%40example.test")), null);
  const headers = professionalProfileHeaders(profileId, "req-reader");
  assert.deepEqual([...headers.keys()].sort(), ["x-momiz-profile-id", "x-request-id"]);
  assert.equal(headers.get("x-momiz-pregnancy-id"), null);
  assert.equal(headers.get("authorization"), null);
});

test("MT-04 document DTO exposes only allowlisted metadata and fails closed on scan states", () => {
  const documentId = "6dd3776b-683a-4861-b555-ae528fb99518";
  const pregnancyId = "3dd3776b-683a-4861-b555-ae528fb99518";
  const page = parseSharedDocumentsPage({ items: [{
    id: documentId, pregnancyId, title: "Hemograma", clinicalCategory: "LAB_RESULT", tags: ["rotina"],
    clinicalDate: null, mimeType: "application/pdf", sizeBytes: 1200, version: 2, versionNumber: 1,
    uploadedAt: "2026-10-28T10:00:00.000Z", status: "LEGACY_UNSCANNED",
    myShare: { id: "7dd3776b-683a-4861-b555-ae528fb99518", version: 1 }, storageKey: "must-not-leak",
  }], requestId: "req-documents" });
  assert.equal(page.items[0].status, "LEGACY_UNSCANNED");
  assert.equal(canOpenSharedDocument(page.items[0]), false);
  assert.equal("storageKey" in page.items[0], false);
  const available = parseSharedDocumentsPage({ items: [{ ...page.items[0], status: undefined }], requestId: "req" }).items[0];
  assert.equal(available.status, "AVAILABLE");
  assert.equal(canOpenSharedDocument(available), true);
  assert.equal(appendSharedDocuments([available], [available]).length, 1);
});

test("MT-04 collaboration parser keeps minimized author data", () => {
  const result = parseDocumentCollaboration({
    review: { id: "review-1", note: "Revisado", reviewedAt: "2026-10-28T12:00:00.000Z" },
    comments: [{ id: "comment-1", content: "Ciente", createdAt: "2026-10-28T12:01:00.000Z", author: { displayName: "Dra. Ana", email: "must-not-leak@example.test" } }],
    requestId: "req-collaboration",
  });
  assert.equal(result.review?.note, "Revisado");
  assert.deepEqual(result.comments[0], { id: "comment-1", content: "Ciente", createdAt: "2026-10-28T12:01:00.000Z", authorLabel: "Dra. Ana" });
  assert.equal("email" in result.comments[0], false);
});

test("MT-04 BFF allows only professional reader and collaboration routes", () => {
  const pregnancyId = "3dd3776b-683a-4861-b555-ae528fb99518";
  const documentId = "6dd3776b-683a-4861-b555-ae528fb99518";
  assert.equal(isMt04DocumentSharesEnabled(undefined), false);
  assert.equal(isMt04DocumentSharesEnabled("true"), true);
  assert.equal(isAllowedContextualCarePath("documents", "GET", false, false), false);
  assert.equal(isAllowedContextualCarePath("documents", "GET", false, true), true);
  assert.equal(isAllowedContextualCarePath(`documents/${documentId}/download-url`, "POST", false, true), true);
  assert.equal(isAllowedContextualCarePath(`documents/${documentId}/collaboration`, "GET", false, true), true);
  assert.equal(isAllowedContextualCarePath(`documents/${documentId}/review`, "PUT", false, true), true);
  assert.equal(isAllowedContextualCarePath(`documents/${documentId}/comments`, "POST", false, true), true);
  assert.equal(isAllowedContextualCarePath("documents/upload-intents", "POST", false, true), false);
  assert.equal(isAllowedContextualCarePath(`documents/${documentId}/shares`, "POST", false, true), false);
  assert.equal(isAllowedContextualCarePath(`documents/${documentId}/versions`, "POST", false, true), false);
  assert.equal(contextualCareUpstreamPath(pregnancyId, `documents/${documentId}/review`), `/api/care/v2/pregnancies/${pregnancyId}/documents/${documentId}/review`);
  assert.equal(contextualCareRequiresIdempotency(`documents/${documentId}/download-url`, "POST"), false);
  assert.equal(contextualCareRequiresIdempotency(`documents/${documentId}/review`, "PUT"), true);
  const query = normalizeContextualCareQuery("documents", new URLSearchParams("q=%20Hemograma%20&tags=rotina"));
  assert.equal(query?.toString(), "q=Hemograma&tags=rotina&limit=25");
  assert.equal(normalizeContextualCareQuery("documents", new URLSearchParams("patientUserId=other")), null);
  assert.equal(normalizeContextualCareQuery("documents", new URLSearchParams("limit=51")), null);
  assert.equal(normalizeContextualCareQuery("documents", new URLSearchParams("clinicalCategory=DIAGNOSIS")), null);
  assert.equal(normalizeContextualCareQuery(`documents/${documentId}/collaboration`, new URLSearchParams("q=x")), null);
});

test("MT-05 appointment DTO follows status, allowedActions and simultaneous reschedule slots", () => {
  const appointmentId = "8dd3776b-683a-4861-b555-ae528fb99518";
  const page = parseAppointmentsPage({ items: [{
    id: appointmentId, pregnancyId: "3dd3776b-683a-4861-b555-ae528fb99518", patientProfileId: "9dd3776b-683a-4861-b555-ae528fb99518",
    responsibleProfessionalProfileId: "8e954350-5c54-4d7c-a58c-06cb7ac85919", relationshipId: "5dd3776b-683a-4861-b555-ae528fb99518",
    startsAt: "2026-11-03T09:00:00-03:00", endAt: "2026-11-03T10:00:00-03:00", timezone: "America/Sao_Paulo",
    modality: "IN_PERSON", status: "RESCHEDULE_REQUESTED", version: 3, pendingStartsAt: "2026-11-10T10:00:00-03:00",
    pendingEndAt: "2026-11-10T11:00:00-03:00", pendingTimezone: "America/Sao_Paulo", allowedActions: ["RESPOND_RESCHEDULE", "CANCEL"],
  }], requestId: "req-agenda" });
  assert.equal(page.items[0].status, "RESCHEDULE_REQUESTED");
  assert.equal(page.items[0].pendingStartsAt, "2026-11-10T10:00:00-03:00");
  assert.equal(appointmentActionAllowed(page.items[0], "CANCEL"), true);
  assert.equal(appointmentActionAllowed(page.items[0], "COMPLETE"), false);
});

test("MT-05 event parser is minimized and timezone conversion rejects normalization", () => {
  const events = parseAppointmentEvents({ items: [{ id: "event-1", appointmentVersion: 2, action: "ACCEPT", fromStatus: "PROPOSED", toStatus: "CONFIRMED", actorRole: "PROFESSIONAL", createdAt: "2026-10-28T10:00:00Z", notes: "must-not-leak" }], requestId: "req-events" });
  assert.equal(events.items[0].action, "ACCEPT"); assert.equal("notes" in events.items[0], false);
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  assert.equal(localDateTimeWithOffset("2026-11-03T09:00", "Other/Zone", browserTimezone), null);
  assert.match(localDateTimeWithOffset("2026-11-03T09:00", browserTimezone, browserTimezone) || "", /T09:00:00[+-]\d{2}:\d{2}$/);
});

test("MT-05 professional proposal sends only the authorized relationship identity", () => {
  const proposal = buildProfessionalAppointmentProposal({
    relationshipId: "5dd3776b-683a-4861-b555-ae528fb99518",
    responsibleProfessionalProfileId: "8e954350-5c54-4d7c-a58c-06cb7ac85919",
    startsAt: "2026-11-03T09:00:00-03:00", endAt: "2026-11-03T10:00:00-03:00", timezone: "America/Sao_Paulo",
    modality: "IN_PERSON", title: "Consulta", location: "Consultório",
  });
  assert.equal(proposal.relationshipId, "5dd3776b-683a-4861-b555-ae528fb99518");
  assert.equal("patientProfileId" in proposal, false);
  assert.equal("pregnancyId" in proposal, false);
  assert.equal("patientUserId" in proposal, false);
});

test("MT-05 contextual BFF is flag-off and allowlists only the contract surface", () => {
  const pregnancyId = "3dd3776b-683a-4861-b555-ae528fb99518"; const appointmentId = "8dd3776b-683a-4861-b555-ae528fb99518";
  assert.equal(isMt05AppointmentsEnabled(undefined), false); assert.equal(isMt05AppointmentsEnabled("true"), true);
  assert.equal(isAllowedContextualCarePath("appointments", "GET", false, false, false), false);
  assert.equal(isAllowedContextualCarePath("appointments", "GET", false, false, true), true);
  assert.equal(isAllowedContextualCarePath("appointments", "POST", false, false, true), true);
  for (const suffix of ["respond", "reschedule", "reschedule/respond", "cancel", "complete", "no-show"]) assert.equal(isAllowedContextualCarePath(`appointments/${appointmentId}/${suffix}`, "POST", false, false, true), true);
  assert.equal(isAllowedContextualCarePath(`appointments/${appointmentId}/events`, "GET", false, false, true), true);
  assert.equal(isAllowedContextualCarePath("appointments/calendar.ics", "GET", false, false, true), true);
  assert.equal(isAllowedContextualCarePath(`appointments/${appointmentId}/delete`, "POST", false, false, true), false);
  assert.equal(contextualCareUpstreamPath(pregnancyId, `appointments/${appointmentId}/cancel`), `/api/care/v2/pregnancies/${pregnancyId}/appointments/${appointmentId}/cancel`);
  const query = normalizeContextualCareQuery("appointments", new URLSearchParams("limit=20&status=CONFIRMED"));
  assert.equal(query?.get("limit"), "20"); assert.equal(query?.get("status"), "CONFIRMED");
  assert.equal(normalizeContextualCareQuery("appointments", new URLSearchParams("status=SECRET")), null);
  assert.equal(normalizeContextualCareQuery("appointments/calendar.ics", new URLSearchParams("from=2026-01-01")), null);
});

test("MT-06 message DTO keeps text plain, policy explicit and receipt separate", () => {
  const page = parseMessagePage({
    messages: [{ id: "message-1", clientMessageId: "client-1", authorProfileId: "profile-1", content: "<strong>texto</strong>", createdAt: "2026-10-28T18:00:00Z", readByCounterpartyAt: null, pushStatus: "SENT" }],
    nextCursor: "opaque.cursor", policy: { timezone: "America/Sao_Paulo", officeHours: [{ dayOfWeek: 1, start: "09:00", end: "17:00" }], expectedResponseBusinessHours: 8, warningCode: "NON_EMERGENCY_V1", version: 2 }, requestId: "req-chat",
  });
  assert.equal(page.messages[0].content, "<strong>texto</strong>");
  assert.equal("pushStatus" in page.messages[0], false);
  assert.equal(page.messages[0].readByCounterpartyAt, null);
  assert.equal(isComposerPolicyAcknowledgable(page.policy), true);
  assert.equal(isComposerPolicyAcknowledgable({ ...page.policy, warningCode: "FUTURE_WARNING" }), false);
});

test("MT-06 pagination deduplicates and retry body preserves clientMessageId", () => {
  const first = { id: "message-1", clientMessageId: "client-1", authorProfileId: "profile-1", content: "Olá", createdAt: "2026-10-28T18:00:00Z", readByCounterpartyAt: null };
  const older = { ...first, id: "message-0", clientMessageId: "client-0", createdAt: "2026-10-28T17:00:00Z" };
  assert.deepEqual(mergeMessages([first], [older, first]).map((item) => item.id), ["message-0", "message-1"]);
  const body = buildCareMessage("  mensagem  ", "8a1079b6-ef74-4d4d-a789-77999136b121");
  assert.deepEqual(body, { clientMessageId: "8a1079b6-ef74-4d4d-a789-77999136b121", content: "mensagem" });
});

test("MT-06 contextual BFF is flag-off and exposes no attachment or entitlement route", () => {
  const pregnancyId = "3dd3776b-683a-4861-b555-ae528fb99518"; const relationshipId = "5dd3776b-683a-4861-b555-ae528fb99518";
  const messages = `relationships/${relationshipId}/messages`;
  assert.equal(isMt06CareChatEnabled(undefined), false); assert.equal(isMt06CareChatEnabled("true"), true);
  assert.equal(isAllowedContextualCarePath(messages, "GET", false, false, false, false), false);
  assert.equal(isAllowedContextualCarePath(messages, "GET", false, false, false, true), true);
  assert.equal(isAllowedContextualCarePath(messages, "POST", false, false, false, true), true);
  assert.equal(isAllowedContextualCarePath(`${messages}/read-receipts`, "POST", false, false, false, true), true);
  assert.equal(isAllowedContextualCarePath(`${messages}/policy`, "GET", false, false, false, true), true);
  assert.equal(isAllowedContextualCarePath(`${messages}/attachments`, "POST", false, false, false, true), false);
  assert.equal(isAllowedContextualCarePath(`${messages}/entitlements`, "GET", false, false, false, true), false);
  assert.equal(contextualCareUpstreamPath(pregnancyId, messages), `/api/care/v2/pregnancies/${pregnancyId}/${messages}`);
  const query = normalizeContextualCareQuery(messages, new URLSearchParams("limit=30&direction=OLDER")); assert.equal(query?.get("direction"), "OLDER");
  assert.equal(normalizeContextualCareQuery(messages, new URLSearchParams("direction=SIDEWAYS")), null);
});

test("MT-08 parses a complete six-category/two-channel matrix without client defaults", () => {
  const preferences = notificationCategories.flatMap((category) => notificationChannels.map((channel) => ({ category, channel, enabled: !(category === "MESSAGE" && channel === "PUSH") })));
  const parsed = parseNotificationPreferences({ version: 3, preferences, requestId: "req-preferences" });
  assert.equal(parsed.preferences.length, 12); assert.equal(isCompletePreferenceMatrix(parsed.preferences), true);
  assert.equal(parsed.preferences.find((item) => item.category === "MESSAGE" && item.channel === "PUSH")?.enabled, false);
  assert.equal(isCompletePreferenceMatrix(parsed.preferences.slice(1)), false);
});

test("MT-08 feed minimizes source data and keeps delivery status technical", () => {
  const page = parseNotificationPage({ notifications: [{ notificationId: "notice_1", category: "MESSAGE", type: "RECEIVED", status: "SENT", deepLink: "CARE_MESSAGES", title: "Nova atualização", body: "Abra o Momiz para conferir.", createdAt: "2026-10-28T19:00:00Z", sourceResourceId: "must-not-leak", patientName: "must-not-leak" }], requestId: "req-feed" });
  assert.equal(page.items[0].status, "SENT"); assert.equal("sourceResourceId" in page.items[0], false); assert.equal("patientName" in page.items[0], false);
  assert.equal(notificationDeepLinkTarget(page.items[0].deepLink), "care-chat-title");
  assert.equal(notificationDeepLinkTarget("UNKNOWN"), "notification-feed-title");
  assert.equal(mergeNotifications(page.items, page.items).length, 1);
});

test("MT-08 BFF flags and allowlist separate feed from preferences", () => {
  assert.equal(isMt08NotificationsEnabled(undefined), false); assert.equal(isMt08NotificationPreferencesEnabled(undefined), false);
  assert.equal(isAllowedNotificationPath("feed", "GET", false, false), false);
  assert.equal(isAllowedNotificationPath("feed", "GET", true, false), true);
  assert.equal(isAllowedNotificationPath("preferences", "GET", true, false), false);
  assert.equal(isAllowedNotificationPath("preferences", "PATCH", false, true), true);
  assert.equal(isAllowedNotificationPath("feed/notice_1/opened", "POST", true, false), true);
  assert.equal(isAllowedNotificationPath("feed/../admin/opened", "POST", true, true), false);
  assert.equal(notificationUpstreamPath("feed/notice_1/opened"), "/api/account/notifications/notice_1/opened");
  const query = normalizeNotificationQuery("feed", new URLSearchParams("limit=20&category=MESSAGE&status=SENT")); assert.equal(query?.get("category"), "MESSAGE");
  assert.equal(normalizeNotificationQuery("feed", new URLSearchParams("category=BIRTH")), null);
  assert.equal(normalizeNotificationQuery("preferences", new URLSearchParams("profileId=other")), null);
});

test("MT-07 professional reader exposes technical events without clinical detail", () => {
  const page = parseLaborEventPage({ events: [{ id: "event-1", eventType: "CONTRACTION", startedAt: "2026-10-28T20:00:00Z", durationSeconds: 54, version: 2, syncStatus: "APPLIED", color: "BLOODY", odor: "UNUSUAL", observation: "must-not-leak" }], requestId: "req-labor" });
  assert.equal(page.items[0].type, "CONTRACTION"); assert.equal(laborEventLabel(page.items[0].type), "Contração registrada");
  assert.equal("color" in page.items[0], false); assert.equal("odor" in page.items[0], false); assert.equal("observation" in page.items[0], false);
  assert.equal(mergeLaborEvents(page.items, page.items).length, 1);
  assert.equal(LABOR_SAFETY_TEXT_VERSION, "LABOR_SAFETY_PT_BR_V1"); assert.match(LABOR_SAFETY_TEXT_PT_BR, /SAMU 192/);
});

test("MT-07 BFF is flag-off and permits professional read only", () => {
  const pregnancyId = "3dd3776b-683a-4861-b555-ae528fb99518";
  assert.equal(isMt07LaborEventsEnabled(undefined), false); assert.equal(isMt07LaborEventsEnabled("true"), true);
  assert.equal(isAllowedContextualCarePath("labor-events", "GET", false, false, false, false, false), false);
  assert.equal(isAllowedContextualCarePath("labor-events", "GET", false, false, false, false, true), true);
  assert.equal(isAllowedContextualCarePath("labor-events", "POST", false, false, false, false, true), false);
  assert.equal(isAllowedContextualCarePath("labor-events/export", "GET", false, false, false, false, true), false);
  assert.equal(contextualCareUpstreamPath(pregnancyId, "labor-events"), `/api/care/v2/pregnancies/${pregnancyId}/labor-events`);
  assert.equal(normalizeContextualCareQuery("labor-events", new URLSearchParams("limit=101")), null);
});

test("MT-09 profile plans and downgrade preserve server-driven usage/history semantics", () => {
  const summary = parseCareEntitlement({ entitlement: { tier: "FREE", status: "EXPIRED", catalogVersion: "care-v1", version: 4 }, usage: [{ capability: "care.relationship.create", allowed: false, reason: "CARE_QUOTA_EXCEEDED", limit: 3, used: 3, remaining: 0 }], offers: [{ tier: "STANDARD", currency: "BRL", formattedReferencePrice: "Referência retornada", referencePrice: 59.9, checkoutAvailable: false }], requestId: "req-entitlement" });
  assert.equal(summary.tier, "FREE"); assert.equal(summary.status, "EXPIRED"); assert.equal(summary.usage[0].allowed, false); assert.equal(summary.usage[0].remaining, 0);
  assert.equal(summary.offers[0].formattedReferencePrice, "Referência retornada"); assert.equal(summary.offers[0].checkoutAvailable, false);
  assert.equal("historyHidden" in summary, false); assert.equal("checkoutUrl" in summary.offers[0], false);
});

test("MT-09 chat uses server OR sponsorship without exposing sponsor identity", () => {
  const professionalProfileId = "8e954350-5c54-4d7c-a58c-06cb7ac85919";
  const own = parseChatEntitlement({ allowed: true, reason: "PROFESSIONAL_SPONSOR", tier: "STANDARD", catalogVersion: "care-v1", sponsorProfileId: professionalProfileId, requestId: "req-own" }, professionalProfileId);
  const other = parseChatEntitlement({ allowed: true, reason: "PATIENT_SPONSOR", tier: "FREE", catalogVersion: "care-v1", sponsorProfileId: "9dd3776b-683a-4861-b555-ae528fb99518", requestId: "req-other" }, professionalProfileId);
  assert.equal(own.sponsoredByCurrentProfile, true); assert.equal(other.sponsoredByOtherProfile, true); assert.equal(other.allowed, true); assert.equal("sponsorProfileId" in other, false);
});

test("MT-09 BFF isolates profiles A/B and exposes read-only summary/sponsorship", () => {
  const relationshipId = "5dd3776b-683a-4861-b555-ae528fb99518"; const profileA = "8e954350-5c54-4d7c-a58c-06cb7ac85919"; const profileB = "9dd3776b-683a-4861-b555-ae528fb99518";
  assert.equal(isMt09EntitlementsEnabled(undefined), false); assert.equal(isMt09ChatSponsorshipEnabled(undefined), false);
  assert.equal(isAllowedEntitlementPath("summary", "GET", false, false), false); assert.equal(isAllowedEntitlementPath("summary", "GET", true, false), true);
  assert.equal(isAllowedEntitlementPath(`message/${relationshipId}`, "GET", false, true), true); assert.equal(isAllowedEntitlementPath("summary", "POST", true, true), false);
  assert.equal(entitlementUpstreamPath(`message/${relationshipId}`), `/api/care/v2/relationships/${relationshipId}/message-entitlement`);
  assert.notDeepEqual([...professionalProfileHeaders(profileA)], [...professionalProfileHeaders(profileB)]);
  assert.equal(isAllowedEntitlementPath("restore", "POST", true, true), false);
});

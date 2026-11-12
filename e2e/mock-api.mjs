import { createServer } from "node:http";

const port = Number(process.env.MOMIZ_E2E_MOCK_PORT || 3022);
const professionalProfileId = "10000000-0000-4000-8000-000000000001";
const credentialIds = {
  valid: "20000000-0000-4000-8000-000000000001",
  invalid: "20000000-0000-4000-8000-000000000002",
  expired: "20000000-0000-4000-8000-000000000003",
};

function json(response, status, body, headers = {}) {
  response.writeHead(status, { "content-type": "application/json", ...headers });
  response.end(JSON.stringify(body));
}

const eventDetails = {
  event: {
    title: "Chá da família Teste",
    subtitle: "Um encontro especial",
    description: "Fixture pública sem dados reais.",
    eventDateTime: "2027-03-20T15:00:00.000Z",
    dressCode: "Confortável",
    footerMessage: "Esperamos você!",
  },
  address: {
    venueName: "Espaço de Testes",
    city: "Cidade Exemplo",
    state: "SP",
    isRedacted: true,
  },
  theme: {
    heroTitle: "Nosso chá de teste",
    heroSubtitle: "Perto ou de longe",
    backgroundColor: "#faf7f2",
    primaryColor: "#7b3f61",
  },
};

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

  if (url.pathname === "/health") {
    response.writeHead(204).end();
    return;
  }

  if (url.pathname === "/fixture/credential") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    response.end("<!doctype html><html lang=\"pt-BR\"><title>Fixture de comprovante</title><body><h1>Comprovante sintético aberto</h1></body></html>");
    return;
  }

  if (url.pathname === "/api/admin/users") {
    json(response, 200, { items: [] });
    return;
  }

  if (url.pathname === "/api/admin/care/profiles") {
    const profiles = [{
      id: professionalProfileId,
      primaryProfession: "DOULA",
      displayName: "Profissional Sintética",
      bio: null,
      city: "Cidade Teste",
      state: "SP",
      verificationStatus: "PENDING_VERIFICATION",
      submittedAt: "2026-11-11T12:00:00.000Z",
      verifiedAt: null,
      updatedAt: "2026-11-12T12:00:00.000Z",
      user: { id: "user-synthetic", name: "Conta Sintética", email: "synthetic@example.test", photoUrl: null },
      credentials: [
        { id: credentialIds.valid, type: "Credencial válida", registrationNumber: "FIXTURE-1", jurisdiction: "SP", specialty: null, issuer: "Fixture", expiresAt: null, status: "PENDING", reviewReason: null, documentFileName: "valid.pdf", renewalOfCredentialId: null, reviewedAt: null, createdAt: "2026-11-11T12:00:00.000Z", updatedAt: "2026-11-12T12:00:00.000Z" },
        { id: credentialIds.invalid, type: "Payload inválido", registrationNumber: "FIXTURE-2", jurisdiction: "SP", specialty: null, issuer: "Fixture", expiresAt: null, status: "PENDING", reviewReason: null, documentFileName: "invalid.pdf", renewalOfCredentialId: null, reviewedAt: null, createdAt: "2026-11-11T12:00:00.000Z", updatedAt: "2026-11-12T12:00:00.000Z" },
        { id: credentialIds.expired, type: "URL expirada", registrationNumber: "FIXTURE-3", jurisdiction: "SP", specialty: null, issuer: "Fixture", expiresAt: null, status: "PENDING", reviewReason: null, documentFileName: "expired.pdf", renewalOfCredentialId: null, reviewedAt: null, createdAt: "2026-11-11T12:00:00.000Z", updatedAt: "2026-11-12T12:00:00.000Z" },
      ],
      reviewLogs: [],
    }];
    json(response, 200, { items: profiles, profiles, nextCursor: null });
    return;
  }

  if (url.pathname === "/api/admin/care/metrics") {
    json(response, 200, { metrics: { activeRelationships: 1, pausedRelationships: 0, expiringRelationships: 0, blockedCommunications: 0, openReports: 0, pendingProfiles: 1, expiringCredentials: 0, expiredProfiles: 0, auditEventsLast24h: 1, deniedAuditEventsLast24h: 0 } });
    return;
  }

  if (url.pathname === "/api/admin/care/pilot-readiness") {
    json(response, 200, { readiness: { ready: false, advisoryOnly: true, rolloutAutomaticallyEnabled: false, approvedCount: 0, requiredCount: 0, gates: [] } });
    return;
  }

  if (url.pathname === "/api/admin/care/communication-reports") {
    json(response, 200, { items: [], reports: [], nextCursor: null });
    return;
  }

  if (url.pathname === "/api/admin/care/audit-logs") {
    json(response, 200, { items: [], auditLogs: [], nextCursor: null });
    return;
  }

  if (url.pathname === "/api/admin/care/relationships") {
    json(response, 200, { items: [], relationships: [], nextCursor: null });
    return;
  }

  const credentialMatch = url.pathname.match(new RegExp(`^/api/admin/care/profiles/${professionalProfileId}/credentials/([0-9a-f-]+)/download-url$`));
  if (credentialMatch) {
    const credentialId = credentialMatch[1];
    if (credentialId === credentialIds.valid) {
      json(response, 200, { downloadUrl: `http://127.0.0.1:${port}/fixture/credential`, expiresAt: new Date(Date.now() + 240_000).toISOString() });
      return;
    }
    if (credentialId === credentialIds.invalid) {
      json(response, 200, { downloadUrl: "javascript:fixture-secret", expiresAt: new Date(Date.now() + 240_000).toISOString(), requestId: "req-credential-invalid" });
      return;
    }
    if (credentialId === credentialIds.expired) {
      json(response, 410, { message: "A URL temporária expirou.", code: "CREDENTIAL_URL_EXPIRED", requestId: "req-credential-expired" }, { "x-request-id": "req-credential-expired" });
      return;
    }
  }

  const match = url.pathname.match(/^\/api\/events\/by-slug\/([^/]+)\/details$/);
  if (!match) {
    response.writeHead(404).end();
    return;
  }

  const slug = decodeURIComponent(match[1]);
  if (slug === "smoke") {
    json(response, 200, eventDetails);
    return;
  }

  if (slug === "transient") {
    json(response, 503, { error: "temporary fixture failure" });
    return;
  }

  json(response, 404, { error: "fixture not found" });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Mock invite API listening on http://127.0.0.1:${port}`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

import assert from "node:assert/strict";
import test from "node:test";
import {
  ProfessionalProfileResponseError,
  readProfessionalProfileResponse,
} from "../lib/professional/professional-profile.ts";

const credential = {
  id: "20000000-0000-4000-8000-000000000001",
  type: "CRM",
  registrationNumber: "123",
  status: "VERIFIED",
  expiresAt: null,
  renewalOfCredentialId: null,
};
const profile = {
  id: "10000000-0000-4000-8000-000000000001",
  primaryProfession: "OBSTETRICIAN",
  displayName: "Profissional Sintética",
  verificationStatus: "VERIFIED",
  bio: null,
  credentials: [credential],
};

test("professional profile parser accepts GET null but can reject null for mutation responses", () => {
  assert.deepEqual(readProfessionalProfileResponse({ profile: null }), { profile: null });
  assert.throws(
    () => readProfessionalProfileResponse({ profile: null }, { allowNull: false }),
    ProfessionalProfileResponseError,
  );
});

test("professional profile parser projects the complete safe contract and discards deep extras", () => {
  const parsed = readProfessionalProfileResponse({
    profile: {
      ...profile,
      phone: "must-not-leak",
      termsAcceptedAt: "must-not-leak",
      credentials: [{
        ...credential,
        documentStorageKey: "must-not-leak",
        documentFileName: "must-not-leak",
        issuer: "must-not-leak",
      }],
    },
    internal: "must-not-leak",
  });
  assert.deepEqual(parsed, { profile });
  assert.equal("phone" in parsed.profile!, false);
  assert.equal("documentStorageKey" in parsed.profile!.credentials[0], false);
});

test("professional profile parser accepts SUSPENDED as an explicit status", () => {
  assert.equal(readProfessionalProfileResponse({ profile: { ...profile, verificationStatus: "SUSPENDED" } }).profile?.verificationStatus, "SUSPENDED");
});

test("professional profile parser rejects malformed IDs, enums, dates and nesting without echoing payload", () => {
  const invalidPayloads = [
    { profile: { ...profile, id: "invalid-id" } },
    { profile: { ...profile, primaryProfession: "UNKNOWN" } },
    { profile: { ...profile, verificationStatus: "UNKNOWN" } },
    { profile: { ...profile, credentials: [{ ...credential, id: "invalid-id" }] } },
    { profile: { ...profile, credentials: [{ ...credential, type: "UNKNOWN" }] } },
    { profile: { ...profile, credentials: [{ ...credential, status: "UNKNOWN" }] } },
    { profile: { ...profile, credentials: [{ ...credential, expiresAt: "not-a-date" }] } },
    { profile: { ...profile, credentials: [{ ...credential, renewalOfCredentialId: "invalid-id" }] } },
    { profile: { ...profile, credentials: Array.from({ length: 101 }, () => credential) } },
  ];
  for (const payload of invalidPayloads) {
    assert.throws(() => readProfessionalProfileResponse(payload), (error: unknown) => {
      assert.ok(error instanceof ProfessionalProfileResponseError);
      assert.equal(error.message.includes("must-not-leak"), false);
      return true;
    });
  }
});

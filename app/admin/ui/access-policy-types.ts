export type PackageCode = "FREE" | "DEMO" | "STANDARD" | "PRO";

export type PackageDefinition = {
  capabilities: Record<string, boolean>;
  limits: Record<string, number>;
};

export type PackageMatrix = Record<PackageCode, PackageDefinition>;

export type AccessPolicy = {
  id: string;
  version: number;
  basedOnVersion: number | null;
  status: "DRAFT" | "PUBLISHED" | "SUPERSEDED";
  reason: string;
  createdByUserId: string | null;
  publishedByUserId: string | null;
  createdAt: string;
  publishedAt: string | null;
  packages: PackageMatrix;
};

export type AccessPolicyHistoryItem = Omit<AccessPolicy, "packages"> & {
  createdBy: { id: string; name: string; email: string | null } | null;
  publishedBy: { id: string; name: string; email: string | null } | null;
};

export type PolicyRegistry = {
  booleanCapabilities: string[];
  limitCapabilities: string[];
  packageCodes: PackageCode[];
};

export type PolicyValidation = {
  valid: boolean;
  errors: Array<{ path: string; code: string; message: string }>;
  warnings: Array<{ path: string; code: string; message: string }>;
};

export type PolicyChange = {
  packageCode: PackageCode;
  capability: string;
  kind: "BOOLEAN" | "LIMIT";
  before: boolean | number | null;
  after: boolean | number;
};

export type PolicyImpact = {
  evaluatedAccounts: number;
  affectedAccounts: number;
  byCapability: Record<string, number>;
  sampleTruncated: boolean;
  capabilitiesDisabled: PolicyChange[];
};

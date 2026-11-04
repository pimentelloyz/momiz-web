import { legalDocumentsManifest } from "../../../lib/legal-documents";

export function GET() {
  return Response.json(
    legalDocumentsManifest(),
    { headers: { "cache-control": "public, max-age=300, must-revalidate" } },
  );
}

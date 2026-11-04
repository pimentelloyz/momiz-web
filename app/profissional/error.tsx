"use client";

import { PortalErrorState } from "../portal-error-state";

export default function ProfessionalError({ error, reset }: { error: Error & { requestId?: unknown }; reset: () => void }) {
  return <PortalErrorState surface="profissional" error={error} reset={reset} />;
}

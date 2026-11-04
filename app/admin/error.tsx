"use client";

import { PortalErrorState } from "../portal-error-state";

export default function AdminError({ error, reset }: { error: Error & { requestId?: unknown }; reset: () => void }) {
  return <PortalErrorState surface="administrativa" error={error} reset={reset} />;
}

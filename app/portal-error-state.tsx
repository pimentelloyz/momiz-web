"use client";

import { useState } from "react";
import { safeRequestId } from "../lib/request-correlation";

export function PortalErrorState({
  surface,
  error,
  reset,
}: {
  surface: "administrativa" | "profissional";
  error: Error & { requestId?: unknown };
  reset: () => void;
}) {
  const requestId = safeRequestId(error.requestId);
  const [copied, setCopied] = useState(false);

  async function copyRequestId() {
    if (!requestId || !navigator.clipboard) return;
    await navigator.clipboard.writeText(requestId);
    setCopied(true);
  }

  return (
    <main className="portal-error-page">
      <section className="portal-error-card" role="alert" aria-labelledby="portal-error-title">
        <span className="eyebrow">Momiz</span>
        <h1 id="portal-error-title">Não foi possível carregar esta área {surface}</h1>
        <p>Seus dados não foram alterados. Tente novamente ou procure o suporte se o problema continuar.</p>
        <div className="portal-error-actions">
          <button type="button" className="button primary" onClick={reset}>Tentar novamente</button>
          <a className="button secondary" href="/suporte">Acessar suporte</a>
        </div>
        {requestId && (
          <div className="portal-error-correlation">
            <span>Identificador do atendimento: <code>{requestId}</code></span>
            <button type="button" onClick={() => void copyRequestId()}>{copied ? "Copiado" : "Copiar identificador"}</button>
          </div>
        )}
      </section>
    </main>
  );
}

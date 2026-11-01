"use client";

import { useState } from "react";
import { buildIosResumeLink, buildPlayInstallUrl, handoffCode, type DeferredPlatform } from "../../../lib/deferred-deep-link";

type Props = {
  slug: string;
  guest?: string;
  universalLink: string;
  appStoreUrl?: string;
  playStoreUrl: string;
};

export function InviteAppActions({ slug, guest, universalLink, appStoreUrl, playStoreUrl }: Props) {
  const [busy, setBusy] = useState<DeferredPlatform | null>(null);
  const [message, setMessage] = useState<string>();
  const [manualCode, setManualCode] = useState<string>();

  async function createHandoff(platform: DeferredPlatform) {
    const response = await fetch("/api/deep-link-handoffs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, guestId: guest, platform }),
    });
    const data = await response.json().catch(() => null) as { token?: string } | null;
    if (!response.ok || !data?.token) throw new Error("handoff_failed");
    return data.token;
  }

  async function installAndroid() {
    setBusy("ANDROID"); setMessage(undefined); setManualCode(undefined);
    try {
      const url = buildPlayInstallUrl(playStoreUrl, await createHandoff("ANDROID"));
      if (!url) throw new Error("invalid_store_url");
      window.location.assign(url);
    } catch {
      setMessage("Não conseguimos preparar a retomada automática. O convite continua disponível nesta página.");
    } finally { setBusy(null); }
  }

  async function installIos() {
    if (!appStoreUrl) return;
    setBusy("IOS"); setMessage(undefined); setManualCode(undefined);
    try {
      const token = await createHandoff("IOS");
      const resumeLink = buildIosResumeLink(token);
      if (!resumeLink) throw new Error("invalid_token");
      try {
        await navigator.clipboard.writeText(resumeLink);
        setMessage("Link de retomada copiado. Após instalar, toque em “Continuar convite” no app e autorize a leitura. Se precisar, volte ao Safari e cole o link.");
      } catch {
        setManualCode(handoffCode(token) ?? undefined);
        setMessage("Após instalar, volte ao Safari e use o código abaixo para retomar este convite.");
      }
      window.location.assign(appStoreUrl);
    } catch {
      setMessage("Não conseguimos preparar a retomada automática. O convite continua disponível nesta página.");
    } finally { setBusy(null); }
  }

  return (
    <div className="invite-app-actions">
      <a className="button primary" href={universalLink}>Abrir no Momiz e escolher</a>
      <p className="invite-install-title"><strong>Ainda não tem o app?</strong></p>
      <div className="invite-install-options">
        <button className="button secondary" type="button" disabled={busy !== null} onClick={installAndroid}>
          {busy === "ANDROID" ? "Preparando…" : "Instalar no Android"}
        </button>
        {appStoreUrl ? (
          <button className="button secondary" type="button" disabled={busy !== null} onClick={installIos}>
            {busy === "IOS" ? "Preparando…" : "Instalar no iPhone"}
          </button>
        ) : null}
      </div>
      {message ? <p className="invite-inline-feedback" role="status">{message}</p> : null}
      {manualCode ? <input className="invite-manual-code" aria-label="Código para retomar o convite" readOnly value={manualCode} onFocus={(event) => event.currentTarget.select()} /> : null}
      <p className="invite-install-note">Se a loja não abrir, volte ao Safari: este convite permanecerá acessível.</p>
    </div>
  );
}

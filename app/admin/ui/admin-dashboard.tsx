"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AccessPackagePolicyPanel } from "./access-package-policy-panel";
import { ProfessionalCareReviewPanel } from "./professional-care-review-panel";
import { CareAnalyticsPanel } from "./care-analytics-panel";
import { adminApi as api } from "./admin-api-client";
import styles from "./admin.module.css";

type UserSummary = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  _count: { ownedEvents: number; accessEntitlements: number };
};
type Override = {
  capability: string;
  enabled: boolean | null;
  limitValue: number | null;
};
type Demo = {
  id: string;
  kind: string;
  packageCode: "DEMO" | "STANDARD" | "PRO";
  status: string;
  startsAt: string;
  expiresAt: string;
  reason: string;
  notes: string | null;
  overrides: Override[];
};
type AccessDetail = {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
    _count: { ownedEvents: number };
    accessEntitlements: Demo[];
    accessAuditLogsTarget: Array<{
      id: string;
      action: string;
      reason: string | null;
      createdAt: string;
    }>;
  };
  effectiveAccess: {
    packageCode: string;
    limits: Record<string, number>;
    capabilities: Record<string, boolean>;
    usage: { activeEvents: number };
  };
};

const booleanOverrides = [
  ["gift.collective", "Presentes coletivos"],
  ["gift.pix", "Recebimento por Pix"],
  ["gift.contribution_reconciliation", "Conciliação de contribuições"],
  ["planning.budget", "Orçamento"],
  ["event.advanced_analytics", "Relatório avançado"],
  ["care.professional_invite", "Convidar equipe profissional de cuidado"],
] as const;

const demoLimitOverrides = [
  "guest.limit_per_event",
  "gift.limit_per_event",
  "gift.suggestion_batch_limit",
  "care.professional_relationship_limit",
] as const;

const demoProfileLabels: Record<Demo["packageCode"], string> = {
  DEMO: "Demo personalizada",
  STANDARD: "Standard",
  PRO: "Pro",
};

function localDateTime(value: Date | string) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function displayDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value))
    : "Sem término";
}

export function AdminDashboard() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [detail, setDetail] = useState<AccessDetail | null>(null);
  const [editing, setEditing] = useState<Demo | null>(null);
  const [demoProfile, setDemoProfile] = useState<Demo["packageCode"]>("DEMO");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<"users" | "plans" | "care" | "reports">("users");
  const [defaultDemoWindow] = useState(() => ({
    startsAt: new Date(),
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  }));

  const handleError = useCallback(
    (error: unknown) => {
      if (error instanceof Error && error.message === "SESSION_EXPIRED") {
        router.replace("/admin/login");
        router.refresh();
        return;
      }
      setMessage(error instanceof Error ? error.message : "Erro inesperado.");
    },
    [router],
  );

  const search = useCallback(
    async (term = "") => {
      setLoading(true);
      try {
        const data = (await api(
          `users?pageSize=30${term ? `&q=${encodeURIComponent(term)}` : ""}`,
        )) as { items: UserSummary[] };
        setUsers(data.items);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    },
    [handleError],
  );

  useEffect(() => {
    let active = true;
    fetch("/admin/api/access/users?pageSize=30")
      .then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as {
          items?: UserSummary[];
        };
        if (!response.ok)
          throw new Error(
            response.status === 401
              ? "SESSION_EXPIRED"
              : "Não foi possível carregar os usuários.",
          );
        if (active) setUsers(data.items || []);
      })
      .catch((error: unknown) => {
        if (active) handleError(error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [handleError]);

  async function openUser(userId: string) {
    setMessage("");
    setEditing(null);
    setDemoProfile("DEMO");
    try {
      setDetail((await api(`users/${userId}/access`)) as AccessDetail);
    } catch (error) {
      handleError(error);
    }
  }

  async function submitSearch(event: FormEvent) {
    event.preventDefault();
    await search(query.trim());
  }

  async function saveDemo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;
    const form = new FormData(event.currentTarget);
    const overrides: Array<{
      capability: string;
      enabled?: boolean;
      limitValue?: number;
      reason: string;
    }> = [];
    if (demoProfile === "DEMO") {
      const professionalInvitesEnabled =
        form.get("care.professional_invite") === "on";
      const professionalLimit = Number(
        form.get("care.professional_relationship_limit") || 0,
      );
      if (
        professionalInvitesEnabled !==
        (Number.isInteger(professionalLimit) && professionalLimit > 0)
      ) {
        setMessage(
          "Para liberar o piloto profissional, marque o convite e informe um limite maior que zero.",
        );
        return;
      }
      for (const [capability] of booleanOverrides) {
        if (form.get(capability) === "on")
          overrides.push({
            capability,
            enabled: true,
            reason: String(form.get("reason")),
          });
      }
      for (const capability of demoLimitOverrides) {
        const raw = String(form.get(capability) || "");
        if (raw)
          overrides.push({
            capability,
            limitValue: Number(raw),
            reason: String(form.get("reason")),
          });
      }
    }
    const payload = {
      packageCode: demoProfile,
      startsAt: new Date(String(form.get("startsAt"))).toISOString(),
      expiresAt: new Date(String(form.get("expiresAt"))).toISOString(),
      reason: String(form.get("reason")),
      notes: String(form.get("notes") || "") || null,
      overrides,
    };
    try {
      await api(
        editing
          ? `users/${detail.user.id}/demos/${editing.id}`
          : `users/${detail.user.id}/demos`,
        {
          method: editing ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      setEditing(null);
      setMessage(editing ? "Demo atualizada." : "Demo liberada.");
      await openUser(detail.user.id);
    } catch (error) {
      handleError(error);
    }
  }

  async function revoke(demo: Demo) {
    if (!detail) return;
    const reason = window.prompt("Informe o motivo da revogação:");
    if (!reason?.trim()) return;
    try {
      await api(`users/${detail.user.id}/demos/${demo.id}/revoke`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ revocationReason: reason.trim() }),
      });
      setMessage("Demo revogada.");
      await openUser(detail.user.id);
    } catch (error) {
      handleError(error);
    }
  }

  async function logout() {
    await fetch("/admin/api/session", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh();
  }

  const activeDemo = detail?.user.accessEntitlements.find(
    (item) =>
      item.kind === "DEMO" && ["ACTIVE", "SCHEDULED"].includes(item.status),
  );
  const formDemo = editing;

  return (
    <div className={styles.adminPage}>
      <header className={styles.adminHeader}>
        <div>
          <span className={styles.kicker}>Momiz operacional</span>
          <h1>Painel administrativo</h1>
        </div>
        <button className={styles.secondaryButton} onClick={logout}>
          Sair
        </button>
      </header>
      {message && (
        <div className={styles.feedback} role="status">
          {message}
        </div>
      )}
      <nav className={styles.adminTabs} aria-label="Seções administrativas">
        <button
          className={
            section === "users" ? styles.adminTabActive : styles.adminTab
          }
          onClick={() => setSection("users")}
        >
          Acessos e demos
        </button>
        <button
          className={
            section === "plans" ? styles.adminTabActive : styles.adminTab
          }
          onClick={() => setSection("plans")}
        >
          Planos e recursos
        </button>
        <button
          className={
            section === "care" ? styles.adminTabActive : styles.adminTab
          }
          onClick={() => setSection("care")}
        >
          Profissionais de saúde
        </button>
        <button
          className={
            section === "reports" ? styles.adminTabActive : styles.adminTab
          }
          onClick={() => setSection("reports")}
        >
          Relatórios anônimos
        </button>
      </nav>
      {section === "plans" ? (
        <AccessPackagePolicyPanel
          onMessage={setMessage}
          onSessionExpired={() => {
            router.replace("/admin/login");
            router.refresh();
          }}
        />
      ) : section === "care" ? (
        <ProfessionalCareReviewPanel
          onMessage={setMessage}
          onSessionExpired={() => {
            router.replace("/admin/login");
            router.refresh();
          }}
        />
      ) : section === "reports" ? (
        <CareAnalyticsPanel
          onMessage={setMessage}
          onSessionExpired={() => {
            router.replace("/admin/login");
            router.refresh();
          }}
        />
      ) : (
        <div className={styles.adminGrid}>
          <aside className={styles.userPanel}>
            <form className={styles.search} onSubmit={submitSearch}>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nome, e-mail ou ID"
                aria-label="Buscar usuário"
              />
              <button className={styles.primaryButton}>Buscar</button>
            </form>
            <div className={styles.userList}>
              {loading ? (
                <p>Carregando usuários…</p>
              ) : (
                users.map((user) => (
                  <button
                    key={user.id}
                    className={
                      detail?.user.id === user.id
                        ? styles.userSelected
                        : styles.userItem
                    }
                    onClick={() => openUser(user.id)}
                  >
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                    <small>
                      {user._count.ownedEvents} chá(s) ·{" "}
                      {user._count.accessEntitlements} acesso(s)
                    </small>
                  </button>
                ))
              )}
            </div>
          </aside>
          <main className={styles.detailPanel}>
            {!detail ? (
              <div className={styles.empty}>
                <h2>Selecione uma pessoa</h2>
                <p>
                  Consulte o acesso efetivo e libere uma demonstração com prazo
                  e recursos controlados.
                </p>
              </div>
            ) : (
              <>
                <section className={styles.summary}>
                  <div>
                    <span className={styles.kicker}>Conta selecionada</span>
                    <h2>{detail.user.name}</h2>
                    <p>{detail.user.email}</p>
                  </div>
                  <div className={styles.planBadge}>
                    {detail.effectiveAccess.packageCode}
                  </div>
                  <dl>
                    <div>
                      <dt>Chás ativos</dt>
                      <dd>{detail.effectiveAccess.usage.activeEvents}</dd>
                    </div>
                    <div>
                      <dt>Limite</dt>
                      <dd>
                        {detail.effectiveAccess.limits["event.active_limit"]}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section className={styles.sectionCard}>
                  <div className={styles.sectionTitle}>
                    <div>
                      <h3>Demo comercial</h3>
                      <p>
                        O acesso expira automaticamente no término informado.
                      </p>
                    </div>
                  </div>
                  {activeDemo && !editing && (
                    <article className={styles.demoCard}>
                      <div>
                        <strong>
                          {demoProfileLabels[activeDemo.packageCode]} ·{" "}
                          {activeDemo.status}
                        </strong>
                        <p>
                          {displayDate(activeDemo.startsAt)} →{" "}
                          {displayDate(activeDemo.expiresAt)}
                        </p>
                        <small>{activeDemo.reason}</small>
                      </div>
                      <div>
                        <button
                          className={styles.secondaryButton}
                          onClick={() => {
                            setEditing(activeDemo);
                            setDemoProfile(activeDemo.packageCode);
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className={styles.dangerButton}
                          onClick={() => revoke(activeDemo)}
                        >
                          Revogar
                        </button>
                      </div>
                    </article>
                  )}
                  {(!activeDemo || editing) && (
                    <form className={styles.demoForm} onSubmit={saveDemo}>
                      <label>
                        Perfil temporário
                        <select
                          name="packageCode"
                          value={demoProfile}
                          onChange={(event) =>
                            setDemoProfile(
                              event.target.value as Demo["packageCode"],
                            )
                          }
                          required
                        >
                          <option value="DEMO">Demo personalizada</option>
                          <option value="STANDARD">Standard</option>
                          <option value="PRO">Pro</option>
                        </select>
                      </label>
                      <div className={styles.twoColumns}>
                        <label>
                          Início
                          <input
                            name="startsAt"
                            type="datetime-local"
                            defaultValue={localDateTime(
                              formDemo?.startsAt || defaultDemoWindow.startsAt,
                            )}
                            required
                          />
                        </label>
                        <label>
                          Término
                          <input
                            name="expiresAt"
                            type="datetime-local"
                            defaultValue={localDateTime(
                              formDemo?.expiresAt ||
                                defaultDemoWindow.expiresAt,
                            )}
                            required
                          />
                        </label>
                      </div>
                      <label>
                        Motivo
                        <input
                          name="reason"
                          defaultValue={
                            formDemo?.reason || "Demonstração comercial"
                          }
                          minLength={3}
                          required
                        />
                      </label>
                      <label>
                        Observações
                        <textarea
                          name="notes"
                          defaultValue={formDemo?.notes || ""}
                          rows={3}
                        />
                      </label>
                      {demoProfile === "DEMO" && (
                        <>
                          <fieldset>
                            <legend>Exceções adicionais ao perfil</legend>
                            {booleanOverrides.map(([key, label]) => (
                              <label className={styles.checkbox} key={key}>
                                <input
                                  name={key}
                                  type="checkbox"
                                  defaultChecked={formDemo?.overrides.some(
                                    (item) =>
                                      item.capability === key &&
                                      item.enabled === true,
                                  )}
                                />
                                {label}
                              </label>
                            ))}
                          </fieldset>
                          <div className={styles.threeColumns}>
                            <label>
                              Pessoas convidadas
                              <input
                                name="guest.limit_per_event"
                                type="number"
                                min="0"
                                placeholder="20"
                                defaultValue={
                                  formDemo?.overrides.find(
                                    (item) =>
                                      item.capability ===
                                      "guest.limit_per_event",
                                  )?.limitValue ?? ""
                                }
                              />
                            </label>
                            <label>
                              Presentes
                              <input
                                name="gift.limit_per_event"
                                type="number"
                                min="0"
                                placeholder="20"
                                defaultValue={
                                  formDemo?.overrides.find(
                                    (item) =>
                                      item.capability ===
                                      "gift.limit_per_event",
                                  )?.limitValue ?? ""
                                }
                              />
                            </label>
                            <label>
                              Lotes sugeridos
                              <input
                                name="gift.suggestion_batch_limit"
                                type="number"
                                min="0"
                                placeholder="1"
                                defaultValue={
                                  formDemo?.overrides.find(
                                    (item) =>
                                      item.capability ===
                                      "gift.suggestion_batch_limit",
                                  )?.limitValue ?? ""
                                }
                              />
                            </label>
                          </div>
                          <fieldset>
                            <legend>Piloto de equipe profissional</legend>
                            <p className={styles.fieldHint}>
                              Use este acesso individual durante o piloto. O
                              convite e o limite precisam ser concedidos juntos;
                              a expiração da demo encerra novas autorizações sem
                              apagar a auditoria.
                            </p>
                            <label>
                              Máximo de vínculos profissionais
                              <input
                                name="care.professional_relationship_limit"
                                type="number"
                                min="1"
                                max="50"
                                placeholder="Ex.: 4"
                                defaultValue={
                                  formDemo?.overrides.find(
                                    (item) =>
                                      item.capability ===
                                      "care.professional_relationship_limit",
                                  )?.limitValue ?? ""
                                }
                              />
                            </label>
                          </fieldset>
                        </>
                      )}
                      <div className={styles.actions}>
                        {editing && (
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={() => setEditing(null)}
                          >
                            Cancelar
                          </button>
                        )}
                        <button className={styles.primaryButton}>
                          {editing ? "Salvar demo" : "Liberar demo"}
                        </button>
                      </div>
                    </form>
                  )}
                </section>

                <section className={styles.sectionCard}>
                  <h3>Histórico de auditoria</h3>
                  {detail.user.accessAuditLogsTarget.length === 0 ? (
                    <p>Nenhuma alteração registrada.</p>
                  ) : (
                    <ul className={styles.auditList}>
                      {detail.user.accessAuditLogsTarget.map((item) => (
                        <li key={item.id}>
                          <strong>{item.action}</strong>
                          <span>{item.reason || "Sem observação"}</span>
                          <time>{displayDate(item.createdAt)}</time>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
          </main>
        </div>
      )}
    </div>
  );
}

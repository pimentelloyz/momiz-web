export async function adminApi(path: string, init?: RequestInit) {
  const response = await fetch(`/admin/api/access/${path}`, init);
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) throw new Error("SESSION_EXPIRED");
  if (!response.ok) {
    throw new Error(
      data.message || data.error?.message || "Não foi possível concluir a operação.",
    );
  }
  return data;
}

export function jsonRequest(method: "POST" | "PUT" | "PATCH", body: unknown) {
  return {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  } satisfies RequestInit;
}

import type { EventDetails } from "./event-details.ts";

export type EventDetailsLoadFailure = {
  kind: "not_found" | "rate_limited" | "upstream" | "network" | "invalid_response";
  status?: number;
};

export type EventDetailsLoadResult =
  | { ok: true; data: EventDetails }
  | { ok: false; error: EventDetailsLoadFailure };

type LoadEventDetailsOptions = {
  apiBaseUrl: string;
  fetchImpl?: typeof fetch;
  onFailure?: (failure: EventDetailsLoadFailure) => void;
};

function isEventDetails(value: unknown): value is EventDetails {
  if (!value || typeof value !== "object") return false;

  const event = (value as { event?: unknown }).event;
  if (!event || typeof event !== "object") return false;

  const candidate = event as { title?: unknown; eventDateTime?: unknown };
  return typeof candidate.title === "string" && typeof candidate.eventDateTime === "string";
}

function failure(
  error: EventDetailsLoadFailure,
  onFailure?: LoadEventDetailsOptions["onFailure"],
): EventDetailsLoadResult {
  onFailure?.(error);
  return { ok: false, error };
}

export async function loadEventDetails(
  slug: string,
  guest: string | undefined,
  { apiBaseUrl, fetchImpl = fetch, onFailure }: LoadEventDetailsOptions,
): Promise<EventDetailsLoadResult> {
  const query = guest ? `?guestId=${encodeURIComponent(guest)}` : "";
  const endpoint =
    `${apiBaseUrl}/api/events/by-slug/${encodeURIComponent(slug)}/details${query}`;

  let response: Response;
  try {
    response = await fetchImpl(endpoint, { next: { revalidate: 60 } });
  } catch {
    return failure({ kind: "network" }, onFailure);
  }

  if (response.status === 404) {
    return failure({ kind: "not_found", status: response.status }, onFailure);
  }
  if (response.status === 429) {
    return failure({ kind: "rate_limited", status: response.status }, onFailure);
  }
  if (!response.ok) {
    return failure({ kind: "upstream", status: response.status }, onFailure);
  }

  try {
    const data: unknown = await response.json();
    return isEventDetails(data)
      ? { ok: true, data }
      : failure({ kind: "invalid_response", status: response.status }, onFailure);
  } catch {
    return failure({ kind: "invalid_response", status: response.status }, onFailure);
  }
}

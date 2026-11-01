import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "../../../lib/site-config";
import { isOpaqueHandoffToken, type DeferredPlatform } from "../../../lib/deferred-deep-link";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  let input: { slug?: unknown; guestId?: unknown; platform?: unknown };
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
  }

  const slug = typeof input.slug === "string" ? input.slug.trim().toLowerCase() : "";
  const guestId = typeof input.guestId === "string" ? input.guestId.trim() : undefined;
  const platform = input.platform as DeferredPlatform;
  if (
    !slug || slug.length > 120 || !SLUG_PATTERN.test(slug) ||
    (guestId !== undefined && !UUID_PATTERN.test(guestId)) ||
    (platform !== "ANDROID" && platform !== "IOS")
  ) {
    return NextResponse.json({ message: "Dados inválidos" }, { status: 400 });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/public/deep-link-handoffs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        target: { type: "EVENT_INVITE", slug, ...(guestId ? { guestId } : {}) },
        platformHint: platform,
      }),
      cache: "no-store",
    });
    const data = await response.json().catch(() => null) as { token?: unknown; expiresAt?: unknown } | null;
    if (!response.ok || !isOpaqueHandoffToken(data?.token)) {
      return NextResponse.json({ message: "Não foi possível preparar a instalação" }, { status: 502 });
    }
    return NextResponse.json(
      { token: data.token, expiresAt: typeof data.expiresAt === "string" ? data.expiresAt : undefined },
      { headers: { "cache-control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json({ message: "Não foi possível preparar a instalação" }, { status: 502 });
  }
}

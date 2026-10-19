export function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

const API_HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function safeColor(
  value: string | null | undefined,
  fallback?: string,
) {
  return value && API_HEX_COLOR.test(value) ? value.toLowerCase() : fallback;
}

export function formatEventDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

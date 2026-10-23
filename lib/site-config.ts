import "server-only";
export { LEGAL_LINKS } from "./public-site-config";

const defaultSiteUrl = "https://momiz.com.br";
const defaultApiBaseUrl =
  process.env.NODE_ENV === "production"
    ? "https://api.momiz.com.br"
    : "http://localhost:3020";

export const SITE_URL = (process.env.SITE_URL || defaultSiteUrl).replace(/\/+$/, "");
export const API_BASE_URL = (process.env.API_BASE_URL || defaultApiBaseUrl).replace(/\/+$/, "");

export const siteConfig = {
  supportEmail: process.env.SUPPORT_EMAIL || "suporte@momiz.com.br",
  description:
    "Organize seu chá, acompanhe participações presenciais e de longe e compartilhe presentes com Pix ou entrega física.",
} as const;

export const LEGAL_VERSION = "12 de outubro de 2026";

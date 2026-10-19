import type { MetadataRoute } from "next";
import { LEGAL_LINKS, SITE_URL } from "../lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", ...LEGAL_LINKS.map(({ href }) => href)].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path ? "yearly" : "weekly",
    priority: path ? 0.5 : 1,
  }));
}

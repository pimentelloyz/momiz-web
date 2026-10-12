import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/suporte", "/termos", "/privacidade", "/excluir-conta"].map((path) => ({
    url: `https://momiz.com.br${path}`,
    lastModified: new Date(),
    changeFrequency: path ? "yearly" : "weekly",
    priority: path ? 0.5 : 1,
  }));
}

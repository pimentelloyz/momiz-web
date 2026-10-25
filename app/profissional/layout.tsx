import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal profissional",
  robots: { index: false, follow: false },
};

export default function ProfessionalLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Produkte verwalten" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

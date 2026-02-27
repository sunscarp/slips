import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bestell-Übersicht" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

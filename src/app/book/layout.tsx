import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bestellung" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

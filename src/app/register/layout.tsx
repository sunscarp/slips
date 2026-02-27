import type { Metadata } from "next";

export const metadata: Metadata = { title: "Registrieren" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

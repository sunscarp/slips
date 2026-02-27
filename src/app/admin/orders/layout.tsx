import type { Metadata } from "next";

export const metadata: Metadata = { title: "Anfragen" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

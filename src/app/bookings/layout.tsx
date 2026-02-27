import type { Metadata } from "next";

export const metadata: Metadata = { title: "Meine Anfragen" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

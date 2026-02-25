"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProductsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.push('/admin/services');
  }, [router]);
  return null;
}

import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Kontakt" };

export default function KontaktPage() {
  return (
    <main className="min-h-screen bg-gray-50 font-sans px-4 py-8">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-[#F48FB1] mb-4">Kontakt</h1>
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">So erreichen Sie uns</h2>
          <p className="text-black text-sm">
            Bei Fragen, Anliegen oder rechtlichen Themen können Sie uns jederzeit kontaktieren:
          </p>
          <ul className="text-black text-sm mt-2 mb-2 list-disc pl-5">
            <li>E-Mail: <a href="mailto:hello@bookme.com" className="text-[#F48FB1] underline">hello@bookme.com</a></li>
            <li>Adresse: Musterstraße 1, 12345 Musterstadt, Deutschland</li>
          </ul>
        </section>
        <div className="mt-8 text-xs text-gray-500 text-center">
          Stand: {new Date().toLocaleDateString("de-DE")}
        </div>
      </div>
    </main>
  );
}
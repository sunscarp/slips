import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "AGB" };

export default function AgbPage() {
  return (
    <main className="min-h-screen bg-gray-50 font-sans px-4 py-8">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-[#F48FB1] mb-4">Allgemeine Geschäftsbedingungen (AGB)</h1>
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">1. Geltungsbereich</h2>
          <p className="text-black text-sm">
            Diese Allgemeinen Geschäftsbedingungen gelten für alle Bestellungen und Produkte, die über die Plattform tastyslips angeboten werden.
          </p>
        </section>
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">2. Vertragspartner</h2>
          <p className="text-black text-sm">
            Vertragspartner sind die jeweiligen Verkäufer und die Käufer, die über tastyslips bestellen. Tastyslips tritt als Vermittler auf.
          </p>
        </section>
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">3. Bestellung und Zahlung</h2>
          <p className="text-black text-sm">
            Die Bestellung erfolgt verbindlich über die Plattform. Die Zahlung erfolgt nach Annahme der Anfrage durch den Verkäufer gemäß dessen Zahlungsinformationen.
          </p>
        </section>
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">4. Stornierung und Widerruf</h2>
          <p className="text-black text-sm">
            Stornierungen sind gemäß den jeweiligen Verkäuferbedingungen möglich. Ein Widerrufsrecht besteht nach den gesetzlichen Vorgaben.
          </p>
        </section>
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">5. Haftung</h2>
          <p className="text-black text-sm">
            Tastyslips haftet nicht für die Qualität der Produkte der Verkäufer. Ansprüche sind direkt an den Verkäufer zu richten.
          </p>
        </section>
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">6. Datenschutz</h2>
          <p className="text-black text-sm">
            Informationen zum Datenschutz finden Sie in unserer <a href="/datenschutz" className="text-[#F48FB1] underline">Datenschutzerklärung</a>.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold mb-2 text-gray-700">7. Schlussbestimmungen</h2>
          <p className="text-black text-sm">
            Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist der Sitz von bookme.
          </p>
        </section>
        <div className="mt-8 text-xs text-gray-500 text-center">
          Stand: {new Date().toLocaleDateString("de-DE")}
        </div>
      </div>
    </main>
  );
}

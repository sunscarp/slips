"use client";
import React from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const COLORS = {
  primary: "#F48FB1",
  accent: "#E4DED5",
  text: "#1F1F1F",
  highlight: "#F48FB1",
};

const faqs = [
  {
    question: "Was ist escortcheap?",
    answer:
      "escortcheap ist ein diskreter Online-Marktplatz, auf dem Verkäuferinnen und Verkäufer exklusive Artikel wie Socken, Unterwäsche, Sportbekleidung und mehr anbieten können. Käufer können Produkte entdecken, Anfragen stellen und direkt mit Verkäufern in Kontakt treten.",
  },
  {
    question: "Muss ich mich als Käufer registrieren?",
    answer:
      "Nein! Als Käufer brauchst du kein Konto. Du kannst Produkte ansehen, eine Kaufanfrage stellen und den Status deiner Bestellung mit deiner E-Mail-Adresse verfolgen.",
  },
  {
    question: "Wie funktioniert der Kaufprozess?",
    answer:
      "1. Wähle einen Verkäufer und entdecke dessen Produkte.\n2. Stelle eine Kaufanfrage mit deinem Namen, E-Mail und optionalen Sonderwünschen.\n3. Der Verkäufer prüft und nimmt deine Anfrage an.\n4. Du erhältst per E-Mail die Zahlungsinformationen.\n5. Nach Zahlungseingang wird dein Artikel versendet.",
  },
  {
    question: "Wie verfolge ich meine Bestellung?",
    answer:
      'Gehe auf die Seite "Meine Anfragen" und gib deine E-Mail-Adresse ein. Dort siehst du alle deine Anfragen mit dem aktuellen Status.',
  },
  {
    question: "Wie kann ich Verkäufer werden?",
    answer:
      "Registriere dich über die Verkäufer-Registrierung mit deinen Daten. Nach der Registrierung wird dein Profil von unserem Team verifiziert. Sobald du verifiziert bist, kannst du deine Produkte einstellen und Anfragen entgegennehmen.",
  },
  {
    question: "Ist die Plattform diskret?",
    answer:
      "Ja, Diskretion hat bei uns höchste Priorität. Alle Transaktionen und Kommunikation erfolgen vertraulich. Deine persönlichen Daten werden gemäß unserer Datenschutzerklärung geschützt.",
  },
  {
    question: "Welche Zahlungsmethoden werden akzeptiert?",
    answer:
      "Die Zahlungsmethoden werden vom jeweiligen Verkäufer festgelegt. Nach Annahme deiner Anfrage erhältst du die individuellen Zahlungsinformationen des Verkäufers.",
  },
  {
    question: "Kann ich Bewertungen abgeben?",
    answer:
      "Ja! Nachdem deine Bestellung abgeschlossen wurde, kannst du eine Bewertung \u00fcber die Seite \u201eMeine Anfragen\u201c abgeben.",
  },
  {
    question: "Was passiert, wenn ich ein Problem mit einer Bestellung habe?",
    answer:
      "Bitte kontaktiere zunächst den Verkäufer direkt. Wenn das Problem nicht gelöst werden kann, erreichst du unser Support-Team über die Kontaktseite.",
  },
];

export default function FaqPage() {
  return (
    <>
      <Navbar user={undefined} />
      <main className="min-h-screen bg-gray-50 font-sans">
        <div className="max-w-3xl mx-auto py-12 px-4">
          <h1
            className="text-3xl font-bold mb-2 text-center"
            style={{ color: COLORS.primary }}
          >
            Häufig gestellte Fragen
          </h1>
          <p className="text-gray-600 text-center mb-10">
            Alles, was du über escortcheap wissen musst
          </p>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <details
                key={idx}
                className="bg-white rounded-lg shadow-sm border border-gray-100 group"
              >
                <summary
                  className="flex items-center justify-between cursor-pointer px-6 py-4 font-semibold text-gray-900 hover:text-[#F48FB1] transition-colors select-none"
                  style={{ listStyle: "none" }}
                >
                  <span>{faq.question}</span>
                  <svg
                    className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="px-6 pb-4 text-gray-700 text-sm whitespace-pre-line leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>

          <div
            className="mt-12 text-center bg-white rounded-lg shadow-sm p-8"
            style={{ borderTop: `3px solid ${COLORS.highlight}` }}
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Noch Fragen?
            </h2>
            <p className="text-gray-600 mb-4">
              Wir helfen dir gerne weiter.
            </p>
            <a
              href="/kontakt"
              className="inline-block text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              style={{ backgroundColor: COLORS.primary }}
            >
              Kontakt aufnehmen
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

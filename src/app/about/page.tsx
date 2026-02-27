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

export default function AboutPage() {
  return (
    <>
      <Navbar user={undefined} />
      <main className="min-h-screen bg-gray-50 font-sans">
        <div className="max-w-3xl mx-auto py-12 px-4">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1
              className="text-4xl font-bold mb-4"
              style={{ color: COLORS.primary }}
            >
              Über tastyslips
            </h1>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Dein diskreter Marktplatz für exklusive Artikel – sicher, anonym
              und unkompliziert.
            </p>
          </div>

          {/* Mission */}
          <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h2
              className="text-2xl font-semibold mb-4"
              style={{ color: COLORS.primary }}
            >
              Unsere Mission
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              tastyslips verbindet Verkäufer und Käufer auf einer diskreten
              Plattform. Wir schaffen einen sicheren Raum, in dem exklusive
              Artikel wie Socken, Unterwäsche, Sportbekleidung und mehr
              gehandelt werden können – ohne Umwege und mit maximaler
              Privatsphäre.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Unser Ziel ist es, eine vertrauenswürdige Community aufzubauen,
              in der Qualität und Diskretion an erster Stelle stehen.
            </p>
          </section>

          {/* How it works */}
          <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h2
              className="text-2xl font-semibold mb-6"
              style={{ color: COLORS.primary }}
            >
              So funktioniert&apos;s
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: "1",
                  title: "Entdecken",
                  desc: "Stöbere durch verifizierte Verkäuferprofile und entdecke exklusive Artikel.",
                },
                {
                  step: "2",
                  title: "Anfragen",
                  desc: "Stelle eine Kaufanfrage – ganz ohne Registrierung. Nur Name und E-Mail genügen.",
                },
                {
                  step: "3",
                  title: "Erhalten",
                  desc: "Nach Zahlung wird dein Artikel diskret versendet. Einfach und sicher.",
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold mx-auto mb-3"
                    style={{ backgroundColor: COLORS.highlight }}
                  >
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Values */}
          <section className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h2
              className="text-2xl font-semibold mb-6"
              style={{ color: COLORS.primary }}
            >
              Unsere Werte
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  icon: "🔒",
                  title: "Diskretion",
                  desc: "Alle Transaktionen sind vertraulich. Deine Privatsphäre ist uns wichtig.",
                },
                {
                  icon: "✅",
                  title: "Vertrauen",
                  desc: "Alle Verkäufer werden von unserem Team verifiziert.",
                },
                {
                  icon: "⭐",
                  title: "Qualität",
                  desc: "Bewertungen und Feedback sorgen für hohe Standards.",
                },
                {
                  icon: "🤝",
                  title: "Community",
                  desc: "Eine respektvolle und sichere Plattform für alle.",
                },
              ].map((value) => (
                <div
                  key={value.title}
                  className="flex items-start gap-4 p-4 rounded-lg"
                  style={{ backgroundColor: `${COLORS.accent}40` }}
                >
                  <span className="text-2xl">{value.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {value.title}
                    </h3>
                    <p className="text-sm text-gray-600">{value.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div
            className="text-center bg-white rounded-lg shadow-sm p-8"
            style={{ borderTop: `3px solid ${COLORS.highlight}` }}
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Bereit loszulegen?
            </h2>
            <p className="text-gray-600 mb-6">
              Entdecke den Marktplatz oder werde selbst Verkäufer.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/salons"
                className="inline-block text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                style={{ backgroundColor: COLORS.primary }}
              >
                Marktplatz entdecken
              </a>
              <a
                href="/register"
                className="inline-block font-semibold px-6 py-3 rounded-lg border-2 transition-colors"
                style={{
                  borderColor: COLORS.primary,
                  color: COLORS.primary,
                }}
              >
                Verkäufer werden
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

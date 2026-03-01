"use client";
import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Footer from "../components/footer";
import Navbar from "../components/navbar";
import ChatWidget from "../components/ChatWidget";
import { FiMapPin, FiPhone, FiStar } from "react-icons/fi";
import { GiUnderwear } from "react-icons/gi";

// --- Styles ---
const COLORS = {
  primary: "#F48FB1",
  accent: "#E4DED5",
  text: "#1F1F1F",
  highlight: "#F48FB1",
};

// --- Components ---
function HeroSection({ onSearch }: { onSearch: (query: { name: string; treatment: string; date: string }) => void }) {
  const [input, setInput] = useState("");
  const [treatment, setTreatment] = useState("");
  const [date, setDate] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <section
      style={{
        background: COLORS.accent,
        color: COLORS.text,
        padding: isMobile ? "2rem 1rem 3rem" : "3.5rem 1.5rem 5rem",
        position: "relative",
        borderBottom: `1px solid ${COLORS.primary}20`,
        minHeight: isMobile ? "auto" : 420,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? "2rem" : "3rem",
          width: "100%",
          maxWidth: 1100,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Search - Moves to top on mobile */}
        <div
          style={{
            flex: 1,
            background: "white",
            borderRadius: 16,
            padding: isMobile ? "1.5rem 1rem" : "2.5rem 2rem",
            boxShadow: `0 8px 24px ${COLORS.primary}10`,
            border: `1px solid ${COLORS.primary}10`,
            minWidth: isMobile ? "100%" : 320,
            maxWidth: isMobile ? "100%" : 420,
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            order: isMobile ? 1 : 0,
          }}
        >
          <div
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              fontSize: isMobile ? "1.2rem" : "1.4rem",
              marginBottom: "0.5rem",
              color: COLORS.primary,
              textAlign: "left",
            }}
          >
            Marketplace
          </div>
          <input
            type="text"
            placeholder="Verkäufer oder Standort"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              padding: "0.8rem 1rem",
              borderRadius: 10,
              border: `1px solid ${COLORS.primary}30`,
              fontSize: "1rem",
              fontFamily: "'Roboto', sans-serif",
              background: "#f9fafb",
              transition: "all 0.2s",
              marginBottom: 0,
            }}
          />
          <input
            type="text"
            placeholder="Produkt (z.B. Socken, Dessous)"
            value={treatment}
            onChange={(e) => setTreatment(e.target.value)}
            style={{
              padding: "0.8rem 1rem",
              borderRadius: 10,
              border: `1px solid ${COLORS.primary}30`,
              fontSize: "1rem",
              fontFamily: "'Roboto', sans-serif",
              background: "#f9fafb",
              transition: "all 0.2s",
              marginBottom: 0,
            }}
          />
          <button
            onClick={() =>
              onSearch({
                name: input.trim(),
                treatment: treatment.trim(),
                date: "",
              })
            }
            style={{
              background: COLORS.highlight,
              color: COLORS.text,
              border: "none",
              borderRadius: 10,
              padding: "0.8rem 0",
              fontWeight: 600,
              fontFamily: "'Poppins', sans-serif",
              cursor: "pointer",
              fontSize: "1rem",
              marginTop: "0.5rem",
              transition: "all 0.2s",
              boxShadow: `0 3px 8px ${COLORS.primary}10`,
              width: "100%",
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 6px 16px ${COLORS.primary}20`)}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 3px 8px ${COLORS.primary}10`)}
          >
            Suchen
          </button>
        </div>
        {/* Branding - Moves below search on mobile */}
        <div
          style={{
            flex: 1,
            minWidth: isMobile ? "100%" : 320,
            display: "flex",
            flexDirection: "column",
            alignItems: isMobile ? "center" : "flex-end",
            justifyContent: "center",
            textAlign: isMobile ? "center" : "right",
            gap: isMobile ? "1.5rem" : "2.2rem",
            paddingRight: isMobile ? "0" : "2.5rem",
          }}
        >
          <div
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 700,
              fontSize: isMobile ? "3rem" : "4.2rem",
              letterSpacing: "-1px",
              color: COLORS.primary,
              marginBottom: isMobile ? "0.5rem" : "0.7rem",
              lineHeight: 1.08,
            }}
          >
            escortcheap
          </div>
          <div
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 500,
              fontSize: isMobile ? "1.4rem" : "1.7rem",
              color: COLORS.text,
              maxWidth: isMobile ? "100%" : "440px",
              lineHeight: 1.45,
              opacity: 0.95,
              marginBottom: isMobile ? "0.5rem" : "0.7rem",
              padding: isMobile ? "0 1rem" : "0",
            }}
          >
            Dein diskreter Marktplatz für exklusive Artikel.
          </div>
          <div
            style={{
              fontFamily: "'Roboto', sans-serif",
              fontSize: isMobile ? "1rem" : "1.18rem",
              color: COLORS.primary,
              maxWidth: isMobile ? "100%" : "440px",
              lineHeight: 1.7,
              opacity: 0.85,
              padding: isMobile ? "0 1rem" : "0",
            }}
          >
            Entdecke Verkäufer in deiner Nähe – Privatsphäre und Diskretion sind unsere oberste Priorität.
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const steps = [
    {
      title: "Finde deinen Verkäufer",
      description: "Durchstöbere unseren Marktplatz und entdecke exklusive Artikel in deiner Nähe",
    },
    {
      title: "Sende eine Kaufanfrage",
      description: "Wähle deine gewünschten Artikel und sende eine unverbindliche Anfrage",
    },
    {
      title: "Erhalte deine Bestellung",
      description: "Nach Bezahlung wird deine Bestellung diskret und sicher versendet",
    },
  ];
  return (
    <section
      style={{
        padding: isMobile ? "3rem 1rem" : "5rem 1.5rem",
        maxWidth: "1280px",
        margin: "0 auto",
        borderBottom: `1px solid ${COLORS.primary}20`,
      }}
    >
      <h2
        style={{
          fontFamily: "'Poppins', sans-serif",
          textAlign: "center",
          color: COLORS.primary,
          fontWeight: 600,
          marginBottom: isMobile ? 40 : 56,
          fontSize: isMobile ? "1.5rem" : "1.75rem",
          letterSpacing: 0.3,
        }}
      >
        So funktioniert's
      </h2>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: isMobile ? 24 : 32,
          flexWrap: "wrap",
        }}
      >
        {steps.map((step, idx) => (
          <div
            key={step.title}
            style={{
              background: "white",
              borderRadius: 16,
              padding: isMobile ? "1.5rem 1rem" : "2.5rem 2rem",
              width: isMobile ? "100%" : "300px",
              maxWidth: isMobile ? "350px" : "none",
              textAlign: "center",
              border: `1px solid ${COLORS.primary}15`,
              boxShadow: `0 4px 14px ${COLORS.primary}10`,
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = `0 6px 18px ${COLORS.primary}15`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = `0 4px 14px ${COLORS.primary}10`;
            }}
          >
            <div
              style={{
                fontSize: isMobile ? "2rem" : "2.5rem",
                marginBottom: isMobile ? 12 : 20,
                lineHeight: 1,
                color: COLORS.highlight,
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              {idx + 1}
            </div>
            <h3
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: isMobile ? "1.1rem" : "1.3rem",
                marginBottom: isMobile ? 8 : 12,
                color: COLORS.primary,
              }}
            >
              {step.title}
            </h3>
            <p
              style={{
                fontFamily: "'Roboto', sans-serif",
                color: COLORS.text,
                opacity: 0.85,
                lineHeight: 1.6,
                fontSize: isMobile ? "0.9rem" : "1rem",
              }}
            >
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// --- Hauptseite ---
export default function HomePage() {
  const router = useRouter();
  const [searchError, setSearchError] = useState<string | null>(null);
  const [user, setUser] = useState<{ uid?: string; email: string | null; username?: string | null } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [salons, setSalons] = useState<any[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [salonsLoading, setSalonsLoading] = useState(true);

  function slugify(text: string) {
    return text
      .toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(u => {
        if (!u) { setUser(null); return; }
        if (u.role === "salon") {
          router.push("/admin/dashboard");
          return;
        }
        if (u.role === "admin") {
          router.push("/system/admin");
          return;
        }
        setUser({ uid: u.uid, email: u.email, username: u.username });
      })
      .catch(() => setUser(null));
  }, [router]);

  // Fetch salons for the sellers list
  useEffect(() => {
    setSalonsLoading(true);
    fetch("/api/salons")
      .then(r => r.ok ? r.json() : { salons: [] })
      .then(data => {
        const s = (data.salons || []).filter((salon: any) => typeof salon.name === "string" && salon.name.length > 0);
        setSalons(s);
        // Fetch ratings
        fetch("/api/reviews")
          .then(r => r.ok ? r.json() : { reviews: [] })
          .then(rData => {
            const reviews = rData.reviews || [];
            const ratingsMap: Record<string, { sum: number; count: number }> = {};
            reviews.forEach((rev: any) => {
              const uid = rev.salonUid || rev.sellerUid;
              if (uid) {
                if (!ratingsMap[uid]) ratingsMap[uid] = { sum: 0, count: 0 };
                ratingsMap[uid].sum += rev.rating || 0;
                ratingsMap[uid].count += 1;
              }
            });
            const avg: Record<string, number> = {};
            Object.entries(ratingsMap).forEach(([uid, v]) => { avg[uid] = v.sum / v.count; });
            setRatings(avg);
          })
          .catch(() => {});
      })
      .catch(() => {})
      .finally(() => setSalonsLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    localStorage.removeItem("bookme_user");
    localStorage.removeItem("userEmail");
    window.location.reload();
  };

  function handleSearch(query: { name: string; treatment: string; date: string }) {
    if (!query.name && !query.treatment) {
      setSearchError("Bitte gib mindestens ein Suchkriterium ein.");
      return;
    }
    // Redirect to /sellers (marketplace) with query params
    const params = new URLSearchParams();
    if (query.name) params.append("name", query.name);
    if (query.treatment) params.append("treatment", query.treatment);
    router.push(`/sellers?${params.toString()}`);
  }

  return (
    <main
      style={{
        fontFamily: "'Roboto', -apple-system, sans-serif",
        background: "#fafafa",
        minHeight: "100vh",
        lineHeight: 1.6,
      }}
    >
      {/* Pass user and logout handler to Navbar */}
      <Navbar user={user ? { email: user.email, username: user.username } : undefined} onLogout={handleLogout} />
      <link
        href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&family=Poppins:wght@500;600;700&display=swap"
        rel="stylesheet"
      />
      <HeroSection onSearch={handleSearch} />
      {searchError && (
        <div
          style={{
            fontFamily: "'Roboto', sans-serif",
            color: "#b00",
            textAlign: "center",
            padding: isMobile ? "1rem" : "1.25rem",
            fontWeight: 500,
            background: "#ffebee",
            maxWidth: isMobile ? "90%" : "600px",
            margin: "0 auto 2rem",
            borderRadius: 10,
            border: `1px solid #b0030`,
            boxShadow: `0 3px 6px ${COLORS.primary}10`,
            fontSize: isMobile ? "0.9rem" : "1rem",
          }}
        >
          {searchError}
        </div>
      )}
      <HowItWorks />

      {/* Sellers List Section */}
      <section
        style={{
          padding: isMobile ? "3rem 1rem" : "5rem 1.5rem",
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        <h2
          style={{
            fontFamily: "'Poppins', sans-serif",
            textAlign: "center",
            color: COLORS.primary,
            fontWeight: 600,
            marginBottom: isMobile ? 32 : 48,
            fontSize: isMobile ? "1.5rem" : "1.75rem",
            letterSpacing: 0.3,
          }}
        >
          Unsere Verkäufer
        </h2>
        {salonsLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isMobile ? 16 : 24 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: "#fff", borderRadius: 12, height: 280, border: "1px solid #E4DED5" }} className="animate-pulse" />
            ))}
          </div>
        ) : salons.length === 0 ? (
          <p style={{ textAlign: "center", color: "#999", fontFamily: "'Roboto', sans-serif" }}>
            Noch keine Verkäufer registriert.
          </p>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: isMobile ? 16 : 24 }}>
              {salons.slice(0, 6).map((salon) => {
                const slug = slugify(salon.name);
                return (
                  <div
                    key={salon._id}
                    style={{
                      background: "#fff",
                      borderRadius: 12,
                      border: "1px solid #E4DED5",
                      overflow: "hidden",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      cursor: "pointer",
                    }}
                    onClick={() => router.push(`/seller/${slug}`)}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.1)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    {salon.imageUrls && salon.imageUrls.length > 0 && (
                      <img
                        src={salon.imageUrls[0]}
                        alt={salon.name}
                        style={{ width: "100%", height: 180, objectFit: "cover", background: COLORS.accent }}
                        loading="lazy"
                      />
                    )}
                    <div style={{ padding: isMobile ? "1rem" : "1.25rem" }}>
                      <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: "1.1rem", color: COLORS.text, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                        <GiUnderwear style={{ color: COLORS.primary, flexShrink: 0 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{salon.name}</span>
                      </h3>
                      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            style={{
                              width: 16, height: 16,
                              color: i < Math.round(ratings[salon.uid] || 0) ? COLORS.primary : "#d1d5db",
                              fill: i < Math.round(ratings[salon.uid] || 0) ? COLORS.primary : "none",
                            }}
                          />
                        ))}
                        <span style={{ marginLeft: 8, color: COLORS.text, fontWeight: 500, fontSize: "0.9rem" }}>
                          {typeof ratings[salon.uid] === "number" ? ratings[salon.uid].toFixed(1) : "0.0"}
                        </span>
                      </div>
                      {salon.description && (
                        <p style={{ fontFamily: "'Roboto', sans-serif", color: "#6b7280", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {salon.description}
                        </p>
                      )}
                      {salon.location && (
                        <div style={{ display: "flex", alignItems: "center", color: "#6b7280", fontSize: "0.8rem", gap: 4 }}>
                          <FiMapPin style={{ color: COLORS.primary, flexShrink: 0 }} />
                          <span>{salon.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {salons.length > 6 && (
              <div style={{ textAlign: "center", marginTop: isMobile ? 24 : 36 }}>
                <button
                  onClick={() => router.push("/sellers")}
                  style={{
                    background: COLORS.primary,
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "0.75rem 2rem",
                    fontWeight: 600,
                    fontFamily: "'Poppins', sans-serif",
                    cursor: "pointer",
                    fontSize: "1rem",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#EC407A")}
                  onMouseLeave={e => (e.currentTarget.style.background = COLORS.primary)}
                >
                  Alle Verkäufer anzeigen
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />

      {/* Chat Widget for logged-in buyers */}
      {user?.uid && (
        <ChatWidget
          userUid={user.uid}
          userName={user.username || user.email || "Käufer"}
          userRole="buyer"
        />
      )}
    </main>
  );
}
"use client";
import React, { useState } from "react";

const COLORS = {
  primary: "#F48FB1",
  accent: "#E4DED5",
  text: "#1F1F1F",
  highlight: "#F48FB1",
};

type AccountType = "user" | "salon";

export default function RegisterPage() {
  const [accountType, setAccountType] = useState<AccountType>("user");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (accountType === "user") {
      if (!username.trim() || username.trim().length < 3) {
        setError("Benutzername muss mindestens 3 Zeichen lang sein");
        return;
      }
      if (/[^a-zA-Z0-9_.\-]/.test(username.trim())) {
        setError("Benutzername darf nur Buchstaben, Zahlen, _, . und - enthalten");
        return;
      }
    }

    if (accountType === "salon") {
      if (!email.trim()) {
        setError("E-Mail-Adresse ist erforderlich für Salon-Konten");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError("Bitte gib eine gültige E-Mail-Adresse ein");
        return;
      }
      if (!name.trim() || name.trim().length < 2) {
        setError("Salon-Name muss mindestens 2 Zeichen lang sein");
        return;
      }
    }

    if (password !== confirm) {
      setError("Passwörter stimmen nicht überein");
      return;
    }

    if (password.length < 6) {
      setError("Passwort muss mindestens 6 Zeichen lang sein");
      return;
    }

    try {
      setLoading(true);

      const body: Record<string, string> =
        accountType === "user"
          ? {
              username: username.trim().toLowerCase(),
              password,
              name: username.trim(),
              role: "buyer",
            }
          : {
              email: email.trim().toLowerCase(),
              password,
              name: name.trim(),
              role: "salon",
            };

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError(
            accountType === "user"
              ? "Dieser Benutzername ist bereits vergeben."
              : "Diese E-Mail-Adresse ist bereits registriert."
          );
        } else {
          setError(data.error || "Registrierung fehlgeschlagen.");
        }
        return;
      }

      window.location.href = "/login";
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ein unbekannter Fehler ist aufgetreten.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    marginTop: 6,
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: 8,
    border: `1px solid ${COLORS.primary}30`,
    fontSize: "1rem",
    marginBottom: 8,
    background: "#fafafa",
    color: COLORS.text,
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: COLORS.accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Roboto', sans-serif",
      }}
    >
      <form
        style={{
          background: "#fff",
          padding: "2.5rem 2rem",
          borderRadius: 14,
          boxShadow: `0 4px 16px ${COLORS.primary}15`,
          minWidth: 380,
          maxWidth: 440,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
        onSubmit={handleSubmit}
      >
        <div
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            fontSize: "2rem",
            color: COLORS.primary,
            textAlign: "center",
            marginBottom: 4,
            letterSpacing: -1,
          }}
        >
          tastyslips
        </div>
        <div
          style={{
            fontWeight: 500,
            fontSize: "1.1rem",
            color: COLORS.text,
            textAlign: "center",
            marginBottom: 4,
          }}
        >
          Konto erstellen
        </div>

        {/* Account type toggle */}
        <div
          style={{
            display: "flex",
            borderRadius: 8,
            overflow: "hidden",
            border: `1px solid ${COLORS.primary}40`,
          }}
        >
          <button
            type="button"
            onClick={() => { setAccountType("user"); setError(""); }}
            style={{
              flex: 1,
              padding: "0.6rem 0",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.9rem",
              transition: "all 0.2s",
              background: accountType === "user" ? COLORS.primary : "#fff",
              color: accountType === "user" ? "#fff" : COLORS.text,
            }}
          >
            Benutzer
          </button>
          <button
            type="button"
            onClick={() => { setAccountType("salon"); setError(""); }}
            style={{
              flex: 1,
              padding: "0.6rem 0",
              border: "none",
              borderLeft: `1px solid ${COLORS.primary}40`,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.9rem",
              transition: "all 0.2s",
              background: accountType === "salon" ? COLORS.primary : "#fff",
              color: accountType === "salon" ? "#fff" : COLORS.text,
            }}
          >
            Salon
          </button>
        </div>

        <div
          style={{
            fontSize: "0.85rem",
            color: COLORS.primary,
            textAlign: "center",
            marginBottom: 4,
            opacity: 0.8,
          }}
        >
          {accountType === "user"
            ? "Erstelle ein Konto, um Produkte zu kaufen und Bestellungen zu verfolgen."
            : "Registriere deinen Salon, um Produkte zu verkaufen und Bestellungen zu verwalten."}
        </div>
        
        {error && (
          <div style={{
            color: "#d32f2f",
            backgroundColor: "#fdecea",
            padding: "12px 16px",
            borderRadius: 8,
            fontSize: "0.9rem",
          }}>
            {error}
          </div>
        )}

        {accountType === "user" && (
          <label style={{ color: COLORS.text, fontWeight: 500, fontSize: "1rem" }}>
            Benutzername
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Dein Benutzername"
              style={inputStyle}
              required
              minLength={3}
            />
          </label>
        )}

        {accountType === "salon" && (
          <>
            <label style={{ color: COLORS.text, fontWeight: 500, fontSize: "1rem" }}>
              Salon-Name
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Name deines Salons"
                style={inputStyle}
                required
                minLength={2}
              />
            </label>
            <label style={{ color: COLORS.text, fontWeight: 500, fontSize: "1rem" }}>
              E-Mail-Adresse <span style={{ color: COLORS.primary }}>*</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="salon@example.com"
                style={inputStyle}
                required
              />
            </label>
          </>
        )}

        <label style={{ color: COLORS.text, fontWeight: 500, fontSize: "1rem" }}>
          Passwort
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mindestens 6 Zeichen"
            style={inputStyle}
            required
            minLength={6}
          />
        </label>
        <label style={{ color: COLORS.text, fontWeight: 500, fontSize: "1rem" }}>
          Passwort bestätigen
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Passwort wiederholen"
            style={inputStyle}
            required
            minLength={6}
          />
        </label>
        <button
          type="submit"
          style={{
            background: COLORS.primary,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "0.75rem 0",
            fontWeight: 600,
            fontSize: "1rem",
            cursor: "pointer",
            marginTop: 8,
            transition: "background 0.2s",
            opacity: loading ? 0.7 : 1,
            pointerEvents: loading ? "none" : "auto",
          }}
          disabled={loading}
        >
          {loading ? "Verarbeitung..." : accountType === "user" ? "Registrieren" : "Salon registrieren"}
        </button>
        <div style={{ textAlign: "center", marginTop: 8, fontSize: "0.98rem", color: COLORS.text }}>
          Bereits ein Konto?{" "}
          <a
            href="/login"
            style={{
              color: COLORS.primary,
              textDecoration: "underline",
              fontWeight: 500,
            }}
          >
            Zum Login
          </a>
        </div>
      </form>
    </main>
  );
}
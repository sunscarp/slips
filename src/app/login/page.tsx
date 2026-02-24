"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const COLORS = {
  primary: "#5C6F68",
  accent: "#E4DED5",
  text: "#1F1F1F",
  highlight: "#9DBE8D",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login fehlgeschlagen.");
        return;
      }

      localStorage.setItem("userEmail", data.email ?? "");

      if (data.role === "admin") {
        window.location.href = "/system/admin";
      } else if (data.role === "salon") {
        window.location.href = "/admin/dashboard";
      } else {
        const redirectUrl = localStorage.getItem("bookme_redirect_after_login");
        if (redirectUrl) {
          localStorage.removeItem("bookme_redirect_after_login");
          window.location.href = redirectUrl;
        } else {
          router.push("/");
        }
      }
    } catch (err) {
      setError("Ein unbekannter Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
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
          minWidth: 420,
          maxWidth: 490,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 20,
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
            marginBottom: 8,
            letterSpacing: -1,
          }}
        >
          bookme
        </div>
        <div
          style={{
            fontWeight: 500,
            fontSize: "1.1rem",
            color: COLORS.text,
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          Login
        </div>
        {error && (
          <div
            style={{
              color: "#d32f2f",
              backgroundColor: "#fdecea",
              padding: "12px 16px",
              borderRadius: 8,
              fontSize: "0.9rem",
            }}
          >
            {error}
          </div>
        )}
        <label style={{ color: COLORS.text, fontWeight: 500, fontSize: "1rem" }}>
          E-Mail
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Ihre E-Mail"
            style={{
              marginTop: 6,
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: 8,
              border: `1px solid ${COLORS.primary}30`,
              fontSize: "1rem",
              marginBottom: 8,
              background: "#fafafa",
            }}
            required
          />
        </label>
        <label style={{ color: COLORS.text, fontWeight: 500, fontSize: "1rem" }}>
          Passwort
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Ihr Passwort"
            style={{
              marginTop: 6,
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: 8,
              border: `1px solid ${COLORS.primary}30`,
              fontSize: "1rem",
              marginBottom: 8,
              background: "#fafafa",
            }}
            required
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
          {loading ? "Login" : "Login"}
        </button>
        <div
          style={{
            textAlign: "center",
            marginTop: 8,
            fontSize: "0.98rem",
            color: COLORS.text,
          }}
        >
          Noch kein Konto?{" "}
          <a
            href="/register"
            style={{
              color: COLORS.primary,
              textDecoration: "underline",
              fontWeight: 500,
            }}
          >
            Jetzt registrieren
          </a>
        </div>
      </form>
    </main>
  );
}

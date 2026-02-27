import React from "react";

const COLORS = {
  primary: "#F48FB1",
  accent: "#E4DED5",
};

export default function Footer() {
  return (
    <footer
      style={{
        background: "#fff",
        color: COLORS.primary,
        padding: "3rem 1rem 2rem 1rem",
        marginTop: "0rem",
        textAlign: "center",
        borderTop: "1px solid #f0f0f0",
        boxShadow: "0 -2px 8px rgba(0,0,0,0.03)",
      }}
    >
      {/* Brand Name */}
      <div
        style={{
          color: COLORS.primary,
          fontWeight: 600,
          fontSize: "1.3rem",
          margin: "0 auto 2rem auto",
          letterSpacing: 1,
        }}
      >
        TastySlips
      </div>
      {/* Legal Links Section */}
      <div style={{ 
        display: "flex",
        justifyContent: "center",
        gap: "16px",
        marginBottom: "24px",
        flexWrap: "wrap",
        fontSize: "0.85rem"
      }}>
        <a
          href="/agb"
          style={{
            color: COLORS.primary,
            textDecoration: "none",
            opacity: 0.85,
            whiteSpace: "nowrap"
          }}
        >
          AGB
        </a>
        <span style={{ color: COLORS.primary, opacity: 0.4 }}>|</span>
        <a
          href="/datenschutz"
          style={{
            color: COLORS.primary,
            textDecoration: "none",
            opacity: 0.85,
            whiteSpace: "nowrap"
          }}
        >
          Datenschutz
        </a>
        <span style={{ color: COLORS.primary, opacity: 0.4 }}>|</span>
        <a
          href="/kontakt"
          style={{
            color: COLORS.primary,
            textDecoration: "none",
            opacity: 0.85,
            whiteSpace: "nowrap"
          }}
        >
          Kontakt
        </a>
        <span style={{ color: COLORS.primary, opacity: 0.4 }}>|</span>
        <a
          href="/impressum"
          style={{
            color: COLORS.primary,
            textDecoration: "none",
            opacity: 0.85,
            whiteSpace: "nowrap"
          }}
        >
          Impressum
        </a>
        <span style={{ color: COLORS.primary, opacity: 0.4 }}>|</span>
        <a
          href="/widerrufsbelehrung"
          style={{
            color: COLORS.primary,
            textDecoration: "none",
            opacity: 0.85,
            whiteSpace: "nowrap"
          }}
        >
          Widerrufsbelehrung
        </a>
        <span style={{ color: COLORS.primary, opacity: 0.4 }}>|</span>
        <a
          href="/faq"
          style={{
            color: COLORS.primary,
            textDecoration: "none",
            opacity: 0.85,
            whiteSpace: "nowrap"
          }}
        >
          FAQ
        </a>
        <span style={{ color: COLORS.primary, opacity: 0.4 }}>|</span>
        <a
          href="/about"
          style={{
            color: COLORS.primary,
            textDecoration: "none",
            opacity: 0.85,
            whiteSpace: "nowrap"
          }}
        >
          Über uns
        </a>
      </div>
      
      <div style={{ 
        color: COLORS.primary,
        opacity: 0.7,
        fontSize: "0.95rem",
        marginBottom: "8px"
      }}>
        hello@tastyslips.com
      </div>
      <div style={{ 
        fontSize: "0.9rem", 
        color: COLORS.primary,
        opacity: 0.5,
        letterSpacing: 0.5
      }}>
        © {new Date().getFullYear()} tastyslips. All rights reserved.
      </div>
    </footer>
  );
}
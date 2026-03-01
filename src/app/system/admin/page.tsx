"use client";
import React, { useState, useEffect } from "react";


const COLORS = {
  primary: "#F48FB1",
  accent: "#E4DED5",
  text: "#1F1F1F",
  highlight: "#F48FB1",
};

function slugify(str: string): string {
  return str
    .normalize("NFKD")
    .replace(/[\u0300-\u036F]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}



export default function AdminDashboard() {
  const [salonName, setSalonName] = useState("");
  const [salonLocation, setSalonLocation] = useState("");
  const [salonEmail, setSalonEmail] = useState("");
  const [salonPassword, setSalonPassword] = useState("");
  const [salons, setSalons] = useState([]);
  const [users, setUsers] = useState<{ email: string; role: string; uid: string }[]>([]);
  const [createStatus, setCreateStatus] = useState<string | null>(null);
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);
  const [salonSearch, setSalonSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [showSalonList, setShowSalonList] = useState(false);
  const [allSalons, setAllSalons] = useState<any[]>([]);
  const [showAllBookings, setShowAllBookings] = useState(false);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [bookingFilter, setBookingFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [userBookingStats, setUserBookingStats] = useState<{[uid: string]: {completed: number, cancelled: number, noShow: number, total: number, rating: number}}>({});
  const [showUserHistoryModal, setShowUserHistoryModal] = useState(false);
  const [historyUser, setHistoryUser] = useState<{ email: string; uid: string } | null>(null);
  
  // Ticket management state
  const [showTickets, setShowTickets] = useState(false);
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketReply, setTicketReply] = useState("");
  const [ticketStatusUpdate, setTicketStatusUpdate] = useState("");

  useEffect(() => {
    const email = typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;
    setCurrentEmail(email);
    setIsAllowed(email === "system@gmail.com");
    
    // Fetch salons and users data
    if (email === "system@gmail.com") {
      fetchSalonsAndUsers();
    }
  }, []);

  const fetchSalonsAndUsers = async () => {
    try {
      // Fetch salons
      const salonsRes = await fetch("/api/salons");
      if (salonsRes.ok) {
        const salonsData = await salonsRes.json();
        setSalons(salonsData.salons || []);
        setAllSalons(salonsData.salons || []);
      } else {
        setSalons([]);
        setAllSalons([]);
      }
      
      // Fetch users
      const usersRes = await fetch("/api/register");
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
        
        // Fetch booking stats for customer rating
        if (usersData.users && usersData.users.length > 0) {
          await fetchUserBookingStats(usersData.users);
        }
      } else {
        setUsers([]);
      }
    } catch (error) {
      setSalons([]);
      setAllSalons([]);
      setUsers([]);
      console.error("Error fetching data:", error);
    }
  };

  const fetchUserBookingStats = async (usersList: any[]) => {
    try {
      const stats: {[uid: string]: {completed: number, cancelled: number, noShow: number, total: number, rating: number}} = {};
      
      // Fetch all bookings to analyze user behavior
      const bookingsRes = await fetch("/api/bookings?systemAdmin=true");
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        const allBookings = bookingsData.bookings || [];
        
        // Calculate stats for each user
        usersList.forEach(user => {
          // Only consider completed, cancelled, and no-show for stats
          const userBookings = allBookings.filter((b: any) =>
            b.customerUid === user.uid &&
            (b.status === 'completed' || b.status === 'cancelled' || b.status === 'rejected')
          );
          
          const completed = userBookings.filter((b: any) => b.status === 'completed').length;
          const cancelled = userBookings.filter((b: any) => b.status === 'cancelled').length;
          const noShow = userBookings.filter((b: any) => b.status === 'rejected').length;
          const total = userBookings.length;
          
          // New rating system: completed = 5 stars, cancelled/no-show = 1 star, average
          let rating = 5;
          if (total > 0) {
            let totalStars = 0;
            userBookings.forEach((b: any) => {
              if (b.status === 'completed') totalStars += 5;
              else if (b.status === 'cancelled' || b.status === 'rejected') totalStars += 1;
            });
            rating = Math.round(totalStars / total);
            rating = Math.max(1, Math.min(5, rating));
          }
          
          stats[user.uid] = {
            completed,
            cancelled,
            noShow,
            total,
            rating
          };
        });
        
        setUserBookingStats(stats);
      }
    } catch (error) {
      console.error("Error fetching user booking stats:", error);
    }
  };

  const getRatingStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return '#22c55e'; // Green
    if (rating >= 3) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getRatingLabel = (rating: number) => {
    return `${rating}/5 Sterne`;
  };

  const fetchAllBookings = async () => {
    try {
      const bookingsRes = await fetch("/api/bookings?systemAdmin=true");
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setAllBookings(bookingsData.bookings || []);
      } else {
        setAllBookings([]);
      }
    } catch (error) {
      setAllBookings([]);
      console.error("Error fetching bookings:", error);
    }
  };

  const handleDeleteSalon = async (email: string) => {
    if (!confirm(`Verkäufer mit E-Mail ${email} wirklich löschen?`)) return;
    setDeleteStatus(null);
    try {
      const res = await fetch("/api/salons", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setDeleteStatus("Verkäufer erfolgreich gelöscht.");
        fetchSalonsAndUsers();
      } else {
        const errMsg = await res.text();
        setDeleteStatus(`Fehler beim Löschen des Verkäufers. ${errMsg}`);
      }
    } catch (error: any) {
      setDeleteStatus(`Fehler beim Löschen des Verkäufers. ${error?.message || ""}`);
    }
  };

  const handleDeleteUser = async (uid: string, email: string) => {
    if (!confirm(`Benutzer ${email} wirklich löschen?`)) return;
    setDeleteStatus(null);
    try {
      const res = await fetch("/api/register", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });
      if (res.ok) {
        setDeleteStatus("Benutzer erfolgreich gelöscht.");
        fetchSalonsAndUsers();
      } else {
        const errMsg = await res.text();
        setDeleteStatus(`Fehler beim Löschen des Benutzers. ${errMsg}`);
      }
    } catch (error: any) {
      setDeleteStatus(`Fehler beim Löschen des Benutzers. ${error?.message || ""}`);
    }
  };

  // Placeholder for creating a salon user in a new collection
  const handleCreateSalonUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateStatus(null);
    if (!salonEmail || !salonPassword) {
      setCreateStatus("Bitte E-Mail und Passwort eingeben.");
      return;
    }
    try {
      // 1. Create user in MongoDB via /api/register
      const userRes = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: salonEmail,
          password: salonPassword,
          role: "salon",
          createdAt: new Date().toISOString(),
        }),
      });
      if (!userRes.ok) {
        if (userRes.status === 409) {
          throw new Error("Ein Benutzer mit dieser E-Mail existiert bereits.");
        }
        if (userRes.status === 404) {
          throw new Error("API endpoint /api/register nicht gefunden.");
        }
        const errMsg = await userRes.text();
        throw new Error(errMsg || "Fehler beim Erstellen des Benutzers.");
      }

      // 2. Create salon in /api/salons
      const salonRes = await fetch("/api/salons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: salonEmail
        }),
      });
      if (!salonRes.ok) {
        if (salonRes.status === 404) {
          throw new Error("API endpoint /api/salons nicht gefunden.");
        }
        const errMsg = await salonRes.text();
        throw new Error(errMsg || "Fehler beim Erstellen des Verkäufers.");
      }

      setCreateStatus("Verkäufer-Account erfolgreich erstellt.");
      setSalonEmail("");
      setSalonPassword("");
    } catch (err: any) {
      let msg = "Fehler beim Erstellen des Verkäufer-Accounts.";
      if (err?.message?.includes("Salon already exists")) {
        // Treat as success if salon already exists
        msg = "Verkäufer-Account erfolgreich erstellt.";
      } else if (err?.message) {
        msg = err.message;
      }
      setCreateStatus(msg);
    }
  };

  const handleBookingStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          status: newStatus
        })
      });
      
      if (res.ok) {
        setDeleteStatus(`Bestellstatus zu "${newStatus}" geändert.`);
        fetchAllBookings(); // Refresh bookings list
      } else {
        setDeleteStatus("Fehler beim Ändern des Bestellstatus.");
      }
    } catch (error) {
      setDeleteStatus("Fehler beim Ändern des Bestellstatus.");
    }
  };

  const filteredBookings = allBookings.filter(booking => {
    const matchesFilter = !bookingFilter || 
      booking.customerName?.toLowerCase().includes(bookingFilter.toLowerCase()) ||
      booking.customerPhone?.includes(bookingFilter) ||
      booking.salonInfo?.name?.toLowerCase().includes(bookingFilter.toLowerCase()) ||
      booking.salonInfo?.email?.toLowerCase().includes(bookingFilter.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    
    return matchesFilter && matchesStatus;
  });

  // Helper to get bookings for a user (by UID, or legacy by email as name)
  const getUserBookings = (user: { uid: string; email: string }) => {
    // Match by customerUid (main), customerEmail, and also by customerName == user.email (legacy)
    return allBookings.filter((b: any) => {
      // Primary match: by UID
      if (b.customerUid === user.uid) return true;
      
      // Secondary match: by email stored in customerEmail field
      if (b.customerEmail && b.customerEmail.toLowerCase() === user.email?.toLowerCase()) return true;
      
      // Legacy match: by customerName being the email
      if (b.customerName && b.customerName.toLowerCase() === user.email?.toLowerCase()) return true;
      
      // Additional match: check if customerInfo object exists with email
      if (b.customerInfo && b.customerInfo.email && b.customerInfo.email.toLowerCase() === user.email?.toLowerCase()) return true;
      
      return false;
    });
  };



  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/tickets?systemAdmin=true");
      if (res.ok) {
        const data = await res.json();
        setAllTickets(data.tickets || []);
      } else {
        setAllTickets([]);
      }
    } catch (error) {
      setAllTickets([]);
      console.error("Error fetching tickets:", error);
    }
  };

  const handleTicketReply = async (ticketId: string) => {
    if (!ticketReply.trim()) return;
    try {
      const res = await fetch("/api/tickets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          message: {
            senderName: "Admin",
            senderRole: "admin",
            text: ticketReply.trim()
          }
        })
      });
      if (res.ok) {
        setTicketReply("");
        // Refresh ticket
        const ticketRes = await fetch(`/api/tickets?ticketId=${ticketId}`);
        if (ticketRes.ok) {
          const data = await ticketRes.json();
          if (data.tickets?.[0]) {
            setSelectedTicket(data.tickets[0]);
            setAllTickets(prev => prev.map(t => t._id === ticketId ? data.tickets[0] : t));
          }
        }
      }
    } catch (error) {
      console.error("Error replying to ticket:", error);
    }
  };

  const handleTicketStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/tickets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          status: newStatus
        })
      });
      if (res.ok) {
        setAllTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status: newStatus } : t));
        if (selectedTicket?._id === ticketId) {
          setSelectedTicket((prev: any) => prev ? { ...prev, status: newStatus } : prev);
        }
      }
    } catch (error) {
      console.error("Error updating ticket status:", error);
    }
  };

  // --- New: Stat cards for dashboard look ---
  const statCards = [
    {
      id: "salons",
      title: "Verkäufer",
      value: salons.length,
      icon: (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-2a4 4 0 014-4h10a4 4 0 014 4v2M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75" />
        </svg>
      ),
    },
    {
      id: "users",
      title: "Benutzer",
      value: users.filter(u => u.role === "buyer" || !u.role).length,
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M16 7a4 4 0 11-8 0 4 4 0 018 0zm6 13v-2a4 4 0 00-3-3.87M6 7a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      ),
    },
    {
      id: "bookings",
      title: "Bestellungen",
      value: allBookings.length,
      icon: (
        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F3F4F6", // match dashboard bg
        fontFamily: "'Roboto', sans-serif",
        padding: "2rem 0",
        color: "#000",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 4px 24px #F48FB115",
          padding: "2.5rem 2rem",
          color: "#000",
        }}
      >
        {/* --- Header --- */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 700,
              fontSize: "2.2rem",
              color: "#222",
              marginBottom: 6,
              letterSpacing: -1,
            }}
          >
            Willkommen, System-Admin
          </h1>
          <p style={{ color: "#666", fontSize: "1.05rem" }}>
            Übersicht & Verwaltung aller Verkäufer, Benutzer, Bestellungen und Pläne
          </p>
        </div>

        {/* --- Stat Cards --- */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 24,
            marginBottom: 36,
          }}
        >
          {statCards.map(card => (
            <div
              key={card.id}
              style={{
                background: "#f9fafb",
                borderRadius: 12,
                padding: "1.5rem 1.2rem",
                boxShadow: "0 1px 4px #F48FB110",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div style={{
                background: "#fff",
                borderRadius: "50%",
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 4px #F48FB110",
              }}>
                {card.icon}
              </div>
              <div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#222" }}>{card.value}</div>
                <div style={{ fontSize: "1rem", color: "#666", fontWeight: 500 }}>{card.title}</div>
              </div>
            </div>
          ))}
        </div>

        {/* --- Section: Create Salon --- */}
        <h2
          style={{
            fontWeight: 600,
            fontSize: "1.2rem",
            color: "#222",
            marginBottom: 16,
            marginTop: 24,
            letterSpacing: -0.5,
          }}
        >
          Neuen Verkäufer-Account anlegen
        </h2>
        <form
          onSubmit={handleCreateSalonUser}
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 18,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            type="email"
            placeholder="Verkäufer E-Mail"
            value={salonEmail}
            onChange={(e) => setSalonEmail(e.target.value)}
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              borderRadius: 8,
              border: "1px solid #CBD5E1",
              fontSize: "1rem",
              background: "#f8fafc",
              color: "#000",
              minWidth: 180,
            }}
            required
          />
          <input
            type="password"
            placeholder="Passwort"
            value={salonPassword}
            onChange={(e) => setSalonPassword(e.target.value)}
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              borderRadius: 8,
              border: "1px solid #CBD5E1",
              fontSize: "1rem",
              background: "#f8fafc",
              color: "#000",
              minWidth: 180,
            }}
            required
          />
          <button
            type="submit"
            style={{
              background: COLORS.highlight,
              color: "#000",
              border: "none",
              borderRadius: 8,
              padding: "0.75rem 1.5rem",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: "pointer",
              transition: "background 0.2s",
              boxShadow: "0 1px 4px #F48FB110",
            }}
          >
            Verkäufer-Account erstellen
          </button>
        </form>
        {createStatus && (
          <div
            style={{
              color: createStatus.startsWith("Fehler") ? "#d32f2f" : "#000",
              background: "#f5f5f5",
              borderRadius: 8,
              padding: "0.6rem 1rem",
              marginBottom: 18,
              fontSize: "0.98rem",
            }}
          >
            {createStatus}
          </div>
        )}
        {deleteStatus && (
          <div
            style={{
              color: deleteStatus.startsWith("Fehler") ? "#d32f2f" : "#000",
              background: "#f5f5f5",
              borderRadius: 8,
              padding: "0.6rem 1rem",
              marginBottom: 18,
              fontSize: "0.98rem",
            }}
          >
            {deleteStatus}
          </div>
        )}

        {/* --- Section: Salon Management --- */}
        <h2
          style={{
            fontWeight: 600,
            fontSize: "1.2rem",
            color: "#222",
            marginBottom: 16,
            marginTop: 32,
            letterSpacing: -0.5,
          }}
        >
          Verkäufer-Verwaltung
        </h2>
        <button
          onClick={() => setShowSalonList(!showSalonList)}
          style={{
            background: COLORS.primary,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "0.75rem 1.5rem",
            fontWeight: 600,
            fontSize: "1rem",
            cursor: "pointer",
            marginBottom: 16,
            transition: "background 0.2s",
            boxShadow: "0 1px 4px #F48FB110",
          }}
          onMouseOver={(e) => e.currentTarget.style.background = "#EC407A"}
          onMouseOut={(e) => e.currentTarget.style.background = COLORS.primary}
        >
          {showSalonList ? "Verkäufer-Liste verstecken" : "Alle Verkäufer anzeigen"}
        </button>

        {showSalonList && (
          <div style={{
            background: "#f8f9fa",
            borderRadius: 8,
            padding: "1rem",
            marginBottom: 24,
            border: `1px solid ${COLORS.primary}20`,
          }}>
            <h3 style={{
              fontWeight: 600,
              fontSize: "1.1rem",
              color: "#000",
              marginBottom: 16,
            }}>
              Registrierte Verkäufer ({allSalons.length})
            </h3>
            {/* Salon search input */}
            <div style={{ display: "flex", gap: "8px", marginBottom: 16, flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Suche nach Name oder E-Mail..."
                value={salonSearch}
                onChange={e => {
                  setSalonSearch(e.target.value);
                  const val = e.target.value;
                  if (!val) {
                    setAllSalons(salons);
                  } else {
                    setAllSalons(
                      salons.filter(
                        (s: any) =>
                          (s.name && s.name.toLowerCase().includes(val.toLowerCase())) ||
                          (s.email && s.email.toLowerCase().includes(val.toLowerCase()))
                      )
                    );
                  }
                }}
                style={{
                  flex: 1,
                  padding: "0.5rem 1rem",
                  borderRadius: 6,
                  border: `1px solid ${COLORS.primary}30`,
                  fontSize: "0.9rem",
                  color: "#000",
                  background: "#fff",
                  minWidth: "180px",
                }}
              />
            </div>
            {allSalons.length === 0 ? (
              <p style={{ color: "#666", fontStyle: "italic" }}>Keine Verkäufer gefunden.</p>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {allSalons.map((salon, idx) => (
                  <div
                    key={salon._id || idx}
                    style={{
                      background: "#fff",
                      borderRadius: 8,
                      padding: "1rem",
                      border: `1px solid ${COLORS.primary}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <h4 style={{
                        fontWeight: 600,
                        color: "#000",
                        marginBottom: 4,
                        fontSize: "1rem",
                      }}>
                        {salon.name || "Unbekannter Verkäufer"}
                        {salon.verified ? (
                          <span style={{
                            marginLeft: 8,
                            padding: "2px 8px",
                            borderRadius: 12,
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            background: "#dcfce7",
                            color: "#166534",
                          }}>✓ Verifiziert</span>
                        ) : (
                          <span style={{
                            marginLeft: 8,
                            padding: "2px 8px",
                            borderRadius: 12,
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            background: "#fed7aa",
                            color: "#9a3412",
                          }}>Nicht verifiziert</span>
                        )}
                      </h4>
                      <p style={{
                        color: "#666",
                        fontSize: "0.9rem",
                        marginBottom: 2,
                      }}>
                        📧 {salon.email || "Keine E-Mail"}
                      </p>
                      <p style={{
                        color: "#666",
                        fontSize: "0.9rem",
                        marginBottom: 2,
                      }}>
                        📍 {salon.location || "Kein Standort"}
                      </p>
                      <p style={{
                        color: "#666",
                        fontSize: "0.9rem",
                      }}>
                        📞 {salon.contact || "Kein Kontakt"}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        onClick={() => window.open(`/seller/${slugify(salon.name || "")}`, '_blank')}
                        style={{
                          background: COLORS.primary,
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          padding: "0.5rem 1rem",
                          fontWeight: 500,
                          fontSize: "0.9rem",
                          cursor: "pointer",
                          transition: "background 0.2s",
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = "#EC407A"}
                        onMouseOut={(e) => e.currentTarget.style.background = COLORS.primary}
                        disabled={!salon.name}
                        title="Verkäufer-Seite anzeigen"
                      >
                        👁️ Ansehen
                      </button>
                      <button
                        onClick={() => handleDeleteSalon(salon.email)}
                        style={{
                          background: "#ef4444",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          padding: "0.5rem 1rem",
                          fontWeight: 500,
                          fontSize: "0.9rem",
                          cursor: "pointer",
                          transition: "background 0.2s",
                        }}
                        title="Verkäufer löschen"
                      >
                        🗑️ Löschen
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/salons", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ email: salon.email, verified: !salon.verified })
                            });
                            if (res.ok) {
                              setDeleteStatus(salon.verified ? "Verifizierung entfernt." : "Verkäufer verifiziert.");
                              fetchSalonsAndUsers();
                            } else {
                              setDeleteStatus("Fehler beim Ändern des Verifizierungsstatus.");
                            }
                          } catch (error) {
                            setDeleteStatus("Fehler beim Ändern des Verifizierungsstatus.");
                          }
                        }}
                        style={{
                          background: salon.verified ? "#f59e0b" : "#22c55e",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          padding: "0.5rem 1rem",
                          fontWeight: 500,
                          fontSize: "0.9rem",
                          cursor: "pointer",
                          transition: "background 0.2s",
                        }}
                        title={salon.verified ? "Verifizierung entfernen" : "Verkäufer verifizieren"}
                      >
                        {salon.verified ? "✘ Verifizierung entfernen" : "✔ Verifizieren"}
                      </button>
                    </div>
                  </div>
                ))}

              </div>
            )}
          </div>
        )}

        {/* --- Section: User Management --- */}
        <h2
          style={{
            fontWeight: 600,
            fontSize: "1.2rem",
            color: "#222",
            marginBottom: 16,
            marginTop: 32,
            letterSpacing: -0.5,
          }}
        >
          Benutzer-Verwaltung
        </h2>
        <button
          onClick={() => {
            setShowUserList(!showUserList);
            if (!showUserList && users.length === 0) {
              fetchSalonsAndUsers();
            }
          }}
          style={{
            background: COLORS.primary,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "0.75rem 1.5rem",
            fontWeight: 600,
            fontSize: "1rem",
            cursor: "pointer",
            marginBottom: 16,
            transition: "background 0.2s",
            boxShadow: "0 1px 4px #F48FB110",
          }}
          onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = "#EC407A")}
          onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = COLORS.primary)}
        >
          {showUserList ? "Benutzer-Liste verstecken" : "Alle Benutzer anzeigen"}
        </button>

        {showUserList && (
          <div style={{
            background: "#f8f9fa",
            borderRadius: 8,
            padding: "1rem",
            marginBottom: 24,
            border: `1px solid ${COLORS.primary}20`,
          }}>
            <h3 style={{
              fontWeight: 600,
              fontSize: "1.1rem",
              color: "#000",
              marginBottom: 16,
            }}>
              Registrierte Käufer ({users.filter(u => (u.role === "buyer" || !u.role) && (!userSearch || u.email?.toLowerCase().includes(userSearch.toLowerCase()))).length})
            </h3>
            {/* User search input */}
            <div style={{ display: "flex", gap: "8px", marginBottom: 16, flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Suche nach E-Mail..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                style={{
                  flex: 1,
                  padding: "0.5rem 1rem",
                  borderRadius: 6,
                  border: `1px solid ${COLORS.primary}30`,
                  fontSize: "0.9rem",
                  color: "#000",
                  background: "#fff",
                  minWidth: "180px",
                }}
              />
            </div>
            {users.filter(u => (u.role === "buyer" || !u.role) && (!userSearch || u.email?.toLowerCase().includes(userSearch.toLowerCase()))).length === 0 ? (
              <p style={{ color: "#666", fontStyle: "italic" }}>Keine Käufer gefunden.</p>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {users
                  .filter(user => (user.role === "buyer" || !user.role) && (!userSearch || user.email?.toLowerCase().includes(userSearch.toLowerCase())))
                  .sort((a, b) => {
                    const aStats = userBookingStats[a.uid] || { rating: 5, total: 0 };
                    const bStats = userBookingStats[b.uid] || { rating: 5, total: 0 };
                    if (aStats.rating !== bStats.rating) {
                      return bStats.rating - aStats.rating;
                    }
                    return bStats.total - aStats.total;
                  })
                  .map((user, idx) => {
                    const stats = userBookingStats[user.uid] || { completed: 0, cancelled: 0, noShow: 0, total: 0, rating: 5 };
                    return (
                      <div
                        key={user.uid || idx}
                        style={{
                          background: "#fff",
                          borderRadius: 8,
                          padding: "1rem",
                          border: `2px solid ${stats.rating >= 4 ? '#22c55e' : stats.rating >= 3 ? '#f59e0b' : '#ef4444'}20`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "12px",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: "200px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: 4 }}>
                            <h4 style={{
                              fontWeight: 600,
                              color: "#000",
                              fontSize: "1rem",
                              margin: 0,
                            }}>
                              {user.email || "Unbekannter Käufer"}
                            </h4>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button
                            onClick={() => handleDeleteUser(user.uid, user.email)}
                            style={{
                              background: "#ef4444",
                              color: "#fff",
                              border: "none",
                              borderRadius: 6,
                              padding: "0.5rem 1rem",
                              fontWeight: 500,
                              fontSize: "0.9rem",
                              cursor: "pointer",
                              transition: "background 0.2s",
                            }}
                            title="Benutzer löschen"
                          >
                            🗑️ Löschen
                          </button>
                          <button
                            onClick={async () => {
                              setHistoryUser({ email: user.email, uid: user.uid });
                              // Fetch bookings if not already loaded
                              if (allBookings.length === 0) {
                                await fetchAllBookings();
                              }
                              setShowUserHistoryModal(true);
                            }}
                            style={{
                              background: "#F48FB1",
                              color: "#fff",
                              border: "none",
                              borderRadius: 6,
                              padding: "0.5rem 1rem",
                              fontWeight: 500,
                              fontSize: "0.9rem",
                              cursor: "pointer",
                              transition: "background 0.2s",
                            }}
                            title="Bestellhistorie anzeigen"
                          >
                            📖 Bestellhistorie
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* User Booking History Modal */}
        {showUserHistoryModal && historyUser && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}>
            <div style={{
              background: "#fff",
              borderRadius: 12,
              padding: "24px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#000", margin: 0 }}>
                  Bestellhistorie für {historyUser.email}
                </h3>
                <button
                  onClick={() => setShowUserHistoryModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    color: "#666",
                  }}
                >
                  ×
                </button>
              </div>
              
              <div style={{ display: "grid", gap: "16px" }}>
                {allBookings.length === 0 ? (
                  <div style={{
                    textAlign: "center",
                    padding: "2rem",
                    color: "#666",
                    fontStyle: "italic"
                  }}>
                    <div>Lade Bestellungen...</div>
                    <button
                      onClick={fetchAllBookings}
                      style={{
                        marginTop: 16,
                        background: "#F48FB1",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "8px 16px",
                        cursor: "pointer",
                      }}
                    >
                      Bestellungen laden
                    </button>
                  </div>
                ) : getUserBookings(historyUser).length === 0 ? (
                  <div style={{ color: "#666", fontStyle: "italic", marginBottom: 16 }}>
                    Keine Bestellungen für diesen Käufer gefunden.
                  </div>
                ) : (
                  getUserBookings(historyUser)
                    .sort((a: any, b: any) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())
                    .map((booking: any, idx: number) => (
                    <div key={booking._id || idx} style={{
                      background: "#f8f9fa",
                      borderRadius: 8,
                      padding: "12px",
                      border: "1px solid #eee",
                      marginBottom: "8px"
                    }}>
                      <div style={{ fontWeight: 600, color: "#000" }}>
                        {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('de-DE') : booking.date}
                      </div>
                      <div style={{ fontSize: "0.95rem", color: "#333" }}>
                        Verkäufer: {booking.salonInfo?.name || booking.salonName || "Unbekannt"}
                      </div>
                      <div style={{ fontSize: "0.95rem", color: "#333" }}>
                        Produkte: {booking.services?.map((s: any) => s.name).join(', ') || booking.service || 'Keine Produkte'}
                      </div>
                      <div style={{ fontSize: "0.95rem", color: "#333" }}>
                        Status: <span style={{
                          padding: "2px 6px",
                          borderRadius: 3,
                          fontSize: "0.8rem",
                          background: booking.status === 'completed' ? '#dcfce7' : 
                                     booking.status === 'accepted' ? '#dbeafe' :
                                     booking.status === 'cancelled' ? '#fee2e2' :
                                     booking.status === 'rejected' ? '#fef3c7' :
                                     booking.status === 'pending' ? '#f3f4f6' :
                                     booking.status === 'payment_pending' ? '#fef9c3' :
                                     booking.status === 'shipped' ? '#e0e7ff' : '#f3f4f6',
                          color: booking.status === 'completed' ? '#166534' : 
                                 booking.status === 'accepted' ? '#1e40af' :
                                 booking.status === 'cancelled' ? '#dc2626' :
                                 booking.status === 'rejected' ? '#d97706' :
                                 booking.status === 'pending' ? '#374151' :
                                 booking.status === 'payment_pending' ? '#92400e' :
                                 booking.status === 'shipped' ? '#3730a3' : '#374151',
                        }}>
                          {booking.status === 'completed' ? 'Abgeschlossen' :
                           booking.status === 'accepted' ? 'Angenommen' :
                           booking.status === 'cancelled' ? 'Storniert' :
                           booking.status === 'rejected' ? 'Abgelehnt' :
                           booking.status === 'pending' ? 'Ausstehend' :
                           booking.status === 'payment_pending' ? 'Zahlung ausstehend' :
                           booking.status === 'shipped' ? 'Versendet' : booking.status}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.95rem", color: "#333" }}>
                        Gesamt: €{booking.total || booking.price || 0}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#666", marginTop: 4 }}>
                        Bestellt am: {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('de-DE') : 'Unbekannt'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <h2
          style={{
            fontWeight: 600,
            fontSize: "1.2rem",
            color: "#222",
            marginBottom: 16,
            marginTop: 32,
            letterSpacing: -0.5,
          }}
        >
          Bestell-Überwachung
        </h2>
        <button
          onClick={() => {
            setShowAllBookings(!showAllBookings);
            if (!showAllBookings) {
              fetchAllBookings();
            }
          }}
          style={{
            background: COLORS.primary,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "0.75rem 1.5rem",
            fontWeight: 600,
            fontSize: "1rem",
            cursor: "pointer",
            marginBottom: 16,
            transition: "background 0.2s",
            boxShadow: "0 1px 4px #F48FB110",
          }}
          onMouseOver={(e) => e.currentTarget.style.background = "#EC407A"}
          onMouseOut={(e) => e.currentTarget.style.background = COLORS.primary}
        >
          {showAllBookings ? "Bestellungen verstecken" : "Alle Bestellungen anzeigen"}
        </button>

        {showAllBookings && (
          <div style={{
            background: "#f8f9fa",
            borderRadius: 8,
            padding: "1rem",
            marginBottom: 24,
            border: `1px solid ${COLORS.primary}20`,
          }}>
            <h3 style={{
              fontWeight: 600,
              fontSize: "1.1rem",
              color: "#000",
              marginBottom: 16,
            }}>
              Alle Bestellungen ({filteredBookings.length})
            </h3>
            
            {/* Filters */}
            <div style={{
              display: "flex",
              gap: "12px",
              marginBottom: 16,
              flexWrap: "wrap",
            }}>
              <input
                type="text"
                placeholder="Suche nach Käufer oder Verkäufer..."
                value={bookingFilter}
                onChange={e => setBookingFilter(e.target.value)}
                style={{
                  flex: 1,
                  padding: "0.5rem 1rem",
                  borderRadius: 6,
                  border: `1px solid ${COLORS.primary}30`,
                  fontSize: "0.9rem",
                  color: "#000",
                  background: "#fff",
                  minWidth: "200px",
                }}
              />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: 6,
                  border: `1px solid ${COLORS.primary}30`,
                  fontSize: "0.9rem",
                  color: "#000",
                  background: "#fff",
                }}
              >
                <option value="all">Alle Status</option>
                <option value="pending">Ausstehend</option>
                <option value="accepted">Angenommen</option>
                <option value="payment_pending">Zahlung ausstehend</option>
                <option value="shipped">Versendet</option>
                <option value="completed">Abgeschlossen</option>
                <option value="rejected">Abgelehnt</option>
                <option value="cancelled">Storniert</option>
              </select>
            </div>

            {filteredBookings.length === 0 ? (
              <p style={{ color: "#666", fontStyle: "italic" }}>Keine Bestellungen gefunden.</p>
            ) : (
              <div style={{
                maxHeight: "600px",
                overflowY: "auto",
                background: "#fff",
                borderRadius: 8,
                border: `1px solid ${COLORS.primary}15`,
              }}>
                <table style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.85rem",
                }}>
                  <thead style={{ background: "#f1f5f9", position: "sticky", top: 0 }}>
                    <tr>
                      <th style={{ padding: "12px 8px", textAlign: "left", color: "#000", fontWeight: 600 }}>Datum/Zeit</th>
                      <th style={{ padding: "12px 8px", textAlign: "left", color: "#000", fontWeight: 600 }}>Käufer</th>
                      <th style={{ padding: "12px 8px", textAlign: "left", color: "#000", fontWeight: 600 }}>Verkäufer</th>
                      <th style={{ padding: "12px 8px", textAlign: "left", color: "#000", fontWeight: 600 }}>Produkte</th>
                      <th style={{ padding: "12px 8px", textAlign: "left", color: "#000", fontWeight: 600 }}>Status</th>
                      <th style={{ padding: "12px 8px", textAlign: "left", color: "#000", fontWeight: 600 }}>Total</th>
                      <th style={{ padding: "12px 8px", textAlign: "center", color: "#000", fontWeight: 600 }}>Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking, idx) => (
                      <tr key={booking._id || idx} style={{
                        borderBottom: `1px solid ${COLORS.primary}10`,
                        backgroundColor: idx % 2 === 0 ? "#fff" : "#f9fafb",
                      }}>
                        <td style={{ padding: "8px", color: "#000" }}>
                          <div style={{ fontWeight: 500 }}>{booking.date}</div>
                          <div style={{ fontSize: "0.75rem", color: "#666" }}>{booking.time}</div>
                        </td>
                        <td style={{ padding: "8px", color: "#000" }}>
                          <div style={{ fontWeight: 500 }}>{booking.customerName}</div>
                          <div style={{ fontSize: "0.75rem", color: "#666" }}>{booking.customerPhone}</div>
                        </td>
                        <td style={{ padding: "8px", color: "#000" }}>
                          <div style={{ fontWeight: 500 }}>{booking.salonInfo?.name || 'Unbekannt'}</div>
                          <div style={{ fontSize: "0.75rem", color: "#666" }}>{booking.salonInfo?.email}</div>
                        </td>
                        <td style={{ padding: "8px", color: "#000" }}>
                          {booking.services?.map((s: any) => s.name).join(', ') || 'Keine Produkte'}
                        </td>
                        <td style={{ padding: "8px" }}>
                          <span style={{
                            padding: "4px 8px",
                            borderRadius: 4,
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            background: booking.status === 'completed' ? '#dcfce7' : 
                                       booking.status === 'accepted' ? '#dbeafe' :
                                       booking.status === 'cancelled' ? '#fee2e2' :
                                       booking.status === 'rejected' ? '#fef3c7' :
                                       booking.status === 'pending' ? '#f3f4f6' :
                                       booking.status === 'payment_pending' ? '#fef9c3' :
                                       booking.status === 'shipped' ? '#e0e7ff' : '#f3f4f6',
                            color: booking.status === 'completed' ? '#166534' : 
                                   booking.status === 'accepted' ? '#1e40af' :
                                   booking.status === 'cancelled' ? '#dc2626' :
                                   booking.status === 'rejected' ? '#d97706' :
                                   booking.status === 'pending' ? '#374151' :
                                   booking.status === 'payment_pending' ? '#92400e' :
                                   booking.status === 'shipped' ? '#3730a3' : '#374151',
                          }}>
                            {booking.status === 'completed' ? 'Abgeschlossen' :
                             booking.status === 'accepted' ? 'Angenommen' :
                             booking.status === 'cancelled' ? 'Storniert' :
                             booking.status === 'rejected' ? 'Abgelehnt' :
                             booking.status === 'pending' ? 'Ausstehend' :
                             booking.status === 'payment_pending' ? 'Zahlung ausstehend' :
                             booking.status === 'shipped' ? 'Versendet' : booking.status}
                          </span>
                        </td>
                        <td style={{ padding: "8px", color: "#000", fontWeight: 500 }}>
                          €{booking.total || 0}
                        </td>
                        <td style={{ padding: "8px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "4px", justifyContent: "center", flexWrap: "wrap" }}>
                            <button
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowBookingModal(true);
                              }}
                              style={{
                                background: COLORS.highlight,
                                color: "#000",
                                border: "none",
                                borderRadius: 4,
                                padding: "4px 8px",
                                fontSize: "0.75rem",
                                cursor: "pointer",
                                fontWeight: 500,
                              }}
                            >
                              Details
                            </button>
                            {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                              <>
                                <button
                                  onClick={() => handleBookingStatusChange(booking._id, 'completed')}
                                  style={{
                                    background: "#22c55e",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 4,
                                    padding: "4px 8px",
                                    fontSize: "0.75rem",
                                    cursor: "pointer",
                                    fontWeight: 500,
                                  }}
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => handleBookingStatusChange(booking._id, 'rejected')}
                                  style={{
                                    background: "#f59e0b",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 4,
                                    padding: "4px 8px",
                                    fontSize: "0.75rem",
                                    cursor: "pointer",
                                    fontWeight: 500,
                                  }}
                                >
                                  ✗
                                </button>
                                <button
                                  onClick={() => handleBookingStatusChange(booking._id, 'shipped')}
                                  style={{
                                    background: "#6366f1",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 4,
                                    padding: "4px 8px",
                                    fontSize: "0.75rem",
                                    cursor: "pointer",
                                    fontWeight: 500,
                                  }}
                                >
                                  📦
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Booking Details Modal */}
        {showBookingModal && selectedBooking && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}>
            <div style={{
              background: "#fff",
              borderRadius: 12,
              padding: "24px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#000", margin: 0 }}>
                  Bestelldetails
                </h3>
                <button
                  onClick={() => setShowBookingModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    color: "#666",
                  }}
                >
                  ×
                </button>
              </div>
              
              <div style={{ display: "grid", gap: "16px" }}>
                <div>
                  <strong style={{ color: "#000" }}>Käufer:</strong>
                  <div>{selectedBooking.customerName}</div>
                  <div style={{ fontSize: "0.9rem", color: "#666" }}>{selectedBooking.customerPhone}</div>
                </div>
                
                <div>
                  <strong style={{ color: "#000" }}>Verkäufer:</strong>
                  <div>{selectedBooking.salonInfo?.name}</div>
                  <div style={{ fontSize: "0.9rem", color: "#666" }}>{selectedBooking.salonInfo?.email}</div>
                </div>
                
                <div>
                  <strong style={{ color: "#000" }}>Datum & Zeit:</strong>
                  <div>{selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleDateString('de-DE') : selectedBooking.date}</div>
                </div>
                
                <div>
                  <strong style={{ color: "#000" }}>Produkte:</strong>
                  {selectedBooking.services?.map((service: any, idx: number) => (
                    <div key={idx} style={{ marginLeft: "8px", marginTop: "4px" }}>
                      • {service.name} - €{service.price} ({service.employee || 'Nicht zugewiesen'})
                    </div>
                  ))}
                </div>
                
                <div>
                  <strong style={{ color: "#000" }}>Gesamtpreis:</strong>
                  <div>€{selectedBooking.total}</div>
                </div>
                
                <div>
                  <strong style={{ color: "#000" }}>Status:</strong>
                  <div>{selectedBooking.status}</div>
                </div>
                
                <div>
                  <strong style={{ color: "#000" }}>Erstellt am:</strong>
                  <div>{new Date(selectedBooking.createdAt).toLocaleString('de-DE')}</div>
                </div>
                
                {selectedBooking.updatedAt && (
                  <div>
                    <strong style={{ color: "#000" }}>Zuletzt aktualisiert:</strong>
                    <div>{new Date(selectedBooking.updatedAt).toLocaleString('de-DE')}</div>
                  </div>
                )}
              </div>
              
              <div style={{
                marginTop: 20,
                paddingTop: 20,
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
              }}>
                <button
                  onClick={() => handleBookingStatusChange(selectedBooking._id, 'accepted')}
                  style={{
                    background: "#3b82f6",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 16px",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Als angenommen markieren
                </button>
                <button
                  onClick={() => handleBookingStatusChange(selectedBooking._id, 'completed')}
                  style={{
                    background: "#22c55e",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 16px",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Als abgeschlossen markieren
                </button>
                <button
                  onClick={() => handleBookingStatusChange(selectedBooking._id, 'rejected')}
                  style={{
                    background: "#f59e0b",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 16px",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Ablehnen
                </button>
                <button
                  onClick={() => handleBookingStatusChange(selectedBooking._id, 'shipped')}
                  style={{
                    background: "#6366f1",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 16px",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Als versendet markieren
                </button>
                <button
                  onClick={() => handleBookingStatusChange(selectedBooking._id, 'cancelled')}
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 16px",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Stornieren
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================== TICKETS SECTION =================== */}
        <h2
          style={{
            color: COLORS.text,
            fontWeight: 800,
            fontSize: "1.3rem",
            marginBottom: 16,
            marginTop: 32,
            letterSpacing: -0.5,
          }}
        >
          Support-Tickets
        </h2>
        <button
          onClick={() => {
            setShowTickets(!showTickets);
            if (!showTickets) {
              fetchTickets();
            }
          }}
          style={{
            background: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "0.75rem 1.5rem",
            fontWeight: 600,
            fontSize: "1rem",
            cursor: "pointer",
            marginBottom: 16,
            transition: "background 0.2s",
            boxShadow: "0 1px 4px #ef444410",
          }}
          onMouseOver={(e) => e.currentTarget.style.background = "#dc2626"}
          onMouseOut={(e) => e.currentTarget.style.background = "#ef4444"}
        >
          {showTickets ? "Tickets verstecken" : "Alle Tickets anzeigen"}
        </button>

        {showTickets && (
          <div style={{
            background: "#f8f9fa",
            borderRadius: 8,
            padding: "1rem",
            marginBottom: 24,
            border: "1px solid #ef444420",
          }}>
            {allTickets.length === 0 ? (
              <p style={{ color: "#888", textAlign: "center", padding: "2rem 0" }}>Keine Tickets vorhanden</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {allTickets.map((ticket: any) => (
                  <div
                    key={ticket._id}
                    onClick={() => setSelectedTicket(ticket)}
                    style={{
                      background: "#fff",
                      borderRadius: 8,
                      padding: "12px 16px",
                      border: `1px solid ${selectedTicket?._id === ticket._id ? '#ef4444' : '#e5e7eb'}`,
                      cursor: "pointer",
                      transition: "border-color 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <strong style={{ color: "#000", fontSize: "0.95rem" }}>{ticket.subject}</strong>
                      <span style={{
                        background: ticket.status === 'open' ? '#fef3c7' : ticket.status === 'in_progress' ? '#dbeafe' : ticket.status === 'resolved' ? '#d1fae5' : '#f3f4f6',
                        color: ticket.status === 'open' ? '#92400e' : ticket.status === 'in_progress' ? '#1e40af' : ticket.status === 'resolved' ? '#065f46' : '#374151',
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}>
                        {ticket.status === 'open' ? 'Offen' : ticket.status === 'in_progress' ? 'In Bearbeitung' : ticket.status === 'resolved' ? 'Gelöst' : 'Geschlossen'}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 16, fontSize: "0.8rem", color: "#666" }}>
                      <span>Von: {ticket.raisedByName} ({ticket.raisedByRole === 'buyer' ? 'Käufer' : 'Verkäufer'})</span>
                      <span>{new Date(ticket.createdAt).toLocaleDateString('de-DE')}</span>
                    </div>
                    {ticket.bookingId && (
                      <div style={{ fontSize: "0.75rem", color: "#888", marginTop: 2 }}>
                        Bestellung: {ticket.bookingId}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ticket Detail Modal */}
        {selectedTicket && (
          <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.3)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 16,
          }}
            onClick={() => setSelectedTicket(null)}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: 24,
                maxWidth: 600,
                width: "100%",
                maxHeight: "80vh",
                overflowY: "auto",
                boxShadow: "0 8px 24px #00000020",
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, color: "#000", fontSize: "1.2rem" }}>{selectedTicket.subject}</h3>
                  <div style={{ fontSize: "0.85rem", color: "#666", marginTop: 4 }}>
                    Von: {selectedTicket.raisedByName} ({selectedTicket.raisedByRole === 'buyer' ? 'Käufer' : 'Verkäufer'}) · {selectedTicket.raisedByEmail}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#888", marginTop: 2 }}>
                    Erstellt: {new Date(selectedTicket.createdAt).toLocaleString('de-DE')}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#888" }}
                >×</button>
              </div>

              {/* Description */}
              <div style={{ background: "#f8f9fa", borderRadius: 8, padding: 12, marginBottom: 16, color: "#000" }}>
                <strong>Beschreibung:</strong>
                <p style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{selectedTicket.description}</p>
              </div>

              {selectedTicket.bookingId && (
                <div style={{ background: "#eff6ff", borderRadius: 8, padding: 8, marginBottom: 16, fontSize: "0.85rem", color: "#1e40af" }}>
                  Bestellung: {selectedTicket.bookingId}
                </div>
              )}

              {/* Status Change */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                  <button
                    key={s}
                    onClick={() => handleTicketStatusChange(selectedTicket._id, s)}
                    style={{
                      background: selectedTicket.status === s ? '#F48FB1' : '#e5e7eb',
                      color: selectedTicket.status === s ? '#fff' : '#374151',
                      border: "none",
                      borderRadius: 6,
                      padding: "6px 12px",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {s === 'open' ? 'Offen' : s === 'in_progress' ? 'In Bearbeitung' : s === 'resolved' ? 'Gelöst' : 'Geschlossen'}
                  </button>
                ))}
              </div>

              {/* Messages */}
              <div style={{ marginBottom: 16 }}>
                <strong style={{ color: "#000" }}>Nachrichten:</strong>
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                  {(!selectedTicket.messages || selectedTicket.messages.length === 0) ? (
                    <p style={{ color: "#888", fontSize: "0.85rem" }}>Noch keine Nachrichten</p>
                  ) : (
                    selectedTicket.messages.map((msg: any, idx: number) => (
                      <div key={idx} style={{
                        background: msg.senderRole === 'admin' ? '#eff6ff' : '#f3f4f6',
                        borderRadius: 8,
                        padding: "8px 12px",
                        borderLeft: msg.senderRole === 'admin' ? '3px solid #3b82f6' : '3px solid #9ca3af',
                      }}>
                        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: msg.senderRole === 'admin' ? '#1e40af' : '#374151' }}>
                          {msg.senderName} ({msg.senderRole === 'admin' ? 'Admin' : msg.senderRole === 'buyer' ? 'Käufer' : 'Verkäufer'})
                        </div>
                        <p style={{ margin: "4px 0 0", fontSize: "0.9rem", color: "#000", whiteSpace: "pre-wrap" }}>{msg.text}</p>
                        <div style={{ fontSize: "0.7rem", color: "#888", marginTop: 2 }}>
                          {new Date(msg.createdAt).toLocaleString('de-DE')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Reply */}
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={ticketReply}
                  onChange={e => setTicketReply(e.target.value)}
                  placeholder="Antwort schreiben..."
                  onKeyDown={e => { if (e.key === 'Enter') handleTicketReply(selectedTicket._id); }}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: "0.9rem",
                    color: "#000",
                  }}
                />
                <button
                  onClick={() => handleTicketReply(selectedTicket._id)}
                  disabled={!ticketReply.trim()}
                  style={{
                    background: "#3b82f6",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 16px",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    fontWeight: 500,
                    opacity: ticketReply.trim() ? 1 : 0.5,
                  }}
                >
                  Antworten
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
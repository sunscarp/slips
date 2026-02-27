"use client";
import React, { useEffect, useState, useRef } from "react";
import Navbar from "../../../components/adminnavbar";
import Footer from "@/components/footer";
import ChatWidget from "../../../components/ChatWidget";
import { FiCalendar, FiUser, FiScissors, FiFilter, FiSearch, FiMessageSquare, FiSend, FiAlertTriangle } from "react-icons/fi";

// Constants
const COLORS = {
  primary: "#5C6F68",
  accent: "#E4DED5",
  text: "#1F1F1F",
  highlight: "#9DBE8D",
  background: "#FAFAFA",
  success: "#9DBE8D",
  warning: "#f2bd6eff",
  error: "#f36a60ff",
};

// Types
type Booking = {
  _id: string;
  salonId: string;
  salonUid: string;
  sellerUid?: string;
  buyerName?: string;
  customerName?: string;
  buyerEmail?: string;
  customerUid?: string;
  services: {
    id: string;
    name: string;
    price: number;
    duration?: number;
    employee?: string;
  }[];
  items?: {
    id: string;
    name: string;
    price: number;
  }[];
  date?: string;
  time?: string;
  total: number;
  customerPhone?: string;
  status: string;
  specialNeeds?: string;
  createdAt: string;
  updatedAt: string;
  customerAddress?: {
    street: string;
    number: string;
    zip: string;
    country: string;
  };
  shippingAddress?: {
    street: string;
    number: string;
    zip: string;
    city: string;
    country: string;
  };
};

type Activity = {
  id: string;
  action: string;
  timestamp: string;
  user?: string;
};

type Message = {
  _id?: string;
  bookingId: string;
  senderUid: string;
  senderName: string;
  senderRole: 'buyer' | 'seller';
  text: string;
  type: 'text' | 'payment_info' | 'payment_confirmed' | 'system';
  createdAt: string;
};

export default function AdminBookingsPage() {
  const [user, setUser] = useState<any>(null);
  const [salon, setSalon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent"); // Default to most recent
  const [showHistory, setShowHistory] = useState(false);
  const [viewingSalonUid, setViewingSalonUid] = useState<string | null>(null);
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showActivities, setShowActivities] = useState(false);
  
  // Chat state
  const [chatBookingId, setChatBookingId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [paymentInput, setPaymentInput] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Ticket state
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketBookingId, setTicketBookingId] = useState<string | null>(null);
  const [ticketSubmitting, setTicketSubmitting] = useState(false);

  // Get current user and fetch salon info and role
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) { window.location.href = '/login'; return; }
        const currentUser = await res.json();
        setUser(currentUser);
        if (currentUser?.email) {
          setLoading(true);
          try {
            // Check if this is system admin viewing another salon's bookings
            const urlParams = new URLSearchParams(window.location.search);
            const salonUidParam = urlParams.get('salonUid');
            const isSystemUser = currentUser.email === "system@gmail.com";
            setIsSystemAdmin(isSystemUser);
            
            if (salonUidParam && isSystemUser) {
              // System admin viewing specific salon bookings
              setViewingSalonUid(salonUidParam);
              setUserRole("system");
              
              // Fetch the specific salon data
              const salonRes = await fetch(`/api/salons?uid=${encodeURIComponent(salonUidParam)}`);
              if (salonRes.ok) {
                const salonData = await salonRes.json();
                setSalon(salonData.salon);
                
                if (salonData.salon?.uid) {
                  await fetchAllBookings(salonData.salon.uid);
                }
              }
            } else {
              // Normal salon user
              // Fetch user role
              const userRes = await fetch(`/api/users?email=${encodeURIComponent(currentUser.email)}`);
              if (userRes.ok) {
                const userData = await userRes.json();
                const role = typeof userData.role === "string"
                  ? userData.role.trim().toLowerCase()
                  : null;
                setUserRole(role);
              } else {
                setUserRole(null);
              }
              
              // Fetch salon info
              const salonFetchRes = await fetch(`/api/salons?email=${encodeURIComponent(currentUser.email)}`);
              if (!salonFetchRes.ok) throw new Error("Salon not found");
              const data = await salonFetchRes.json();
              
              const salonData = data.salon || data;
              setSalon(salonData);
              
              if (salonData?.uid) {
                await fetchAllBookings(salonData.uid);
              }
            }
            
          } catch (err) {
            console.error("Error fetching salon data:", err);
          } finally {
            setLoading(false);
          }
        }
      } catch {
        window.location.href = '/login';
      }
    };
    init();
  }, []);

  const fetchAllBookings = async (salonUid: string) => {
    try {
      const res = await fetch(`/api/bookings?salonUid=${encodeURIComponent(salonUid)}`);
      const data = await res.json();
      
      if (data.bookings) {
        // Sort bookings by createdAt (most recent first)
        const sortedBookings = data.bookings.sort((a: Booking, b: Booking) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        setBookings(sortedBookings);
        setFilteredBookings(sortedBookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  // Filter bookings based on search term, status, and date
  useEffect(() => {
    let filtered = bookings;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(booking => {
        const name = (booking.buyerName || booking.customerName || '').toLowerCase();
        const email = (booking.buyerEmail || '').toLowerCase();
        const items = booking.items || booking.services || [];
        return name.includes(term) ||
          email.includes(term) ||
          items.some(item => item.name.toLowerCase().includes(term));
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      switch (dateFilter) {
        case "today":
          filtered = filtered.filter(booking => (booking.createdAt || '').slice(0, 10) === todayStr);
          break;
        case "week": {
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(booking => new Date(booking.createdAt) >= weekAgo);
          break;
        }
        case "month": {
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(booking => new Date(booking.createdAt) >= monthAgo);
          break;
        }
      }
    }

    setFilteredBookings(filtered);
  }, [bookings, searchTerm, statusFilter, dateFilter]);

  // Sort bookings by selected sort option
  useEffect(() => {
    let sorted = [...bookings];
    if (sortBy === "next") {
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === "recent") {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "customer") {
      sorted.sort((a, b) => (a.buyerName || a.customerName || '').localeCompare(b.buyerName || b.customerName || ''));
    }
    setFilteredBookings(sorted);
  }, [bookings, sortBy]);

  const handleBookingAction = async (id: string, action: 'pending' | 'accepted' | 'payment_pending' | 'shipped' | 'completed' | 'rejected' | 'cancelled') => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: id,
          status: action
        })
      });

      if (res.ok) {
        // Update local state
        setBookings(prev => 
          prev.map(booking => 
            booking._id === id ? { ...booking, status: action } : booking
          )
        );
        
        // Only move to history when fully completed, rejected, or cancelled 
        // (NOT shipped — shipped stays in active view until marked completed)
        if (['completed', 'rejected', 'cancelled'].includes(action)) {
          if (!showHistory) {
            setFilteredBookings(prev => prev.filter(booking => booking._id !== id));
          }
        }
        
        // If action changes status, send a system message in chat
        const statusLabels: {[k:string]: string} = {
          accepted: 'Anfrage wurde angenommen',
          payment_pending: 'Zahlung ausstehend',
          shipped: 'Bestellung wurde als versendet markiert',
          completed: 'Bestellung wurde als abgeschlossen markiert',
          rejected: 'Anfrage wurde abgelehnt',
          cancelled: 'Bestellung wurde storniert',
        };
        if (statusLabels[action] && salon) {
          await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId: id,
              senderUid: salon.uid,
              senderName: salon.name || 'Verkäufer',
              senderRole: 'seller',
              text: statusLabels[action],
              type: 'system'
            })
          }).catch(console.error);
        }
      }
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  // Chat functions
  const openChat = async (bookingId: string) => {
    setChatBookingId(bookingId);
    setChatLoading(true);
    try {
      const res = await fetch(`/api/messages?bookingId=${encodeURIComponent(bookingId)}`);
      const data = await res.json();
      setChatMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setChatMessages([]);
    } finally {
      setChatLoading(false);
    }
  };

  const sendMessage = async (text: string, type: string = 'text') => {
    if (!chatBookingId || !text.trim() || !salon) return;
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: chatBookingId,
          senderUid: salon.uid,
          senderName: salon.name || 'Verkäufer',
          senderRole: 'seller',
          text: text.trim(),
          type
        })
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, data.message]);
        setChatInput("");
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const sendPaymentInfo = async () => {
    if (!paymentInput.trim() || !chatBookingId) return;
    await sendMessage(paymentInput.trim(), 'payment_info');
    setPaymentInput("");
    setShowPaymentForm(false);
    
    // Also update booking status to payment_pending and save payment instructions
    await fetch('/api/bookings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: chatBookingId,
        status: 'payment_pending',
        paymentInstructions: paymentInput.trim()
      })
    });
    
    // Update local state
    setBookings(prev => prev.map(b => b._id === chatBookingId ? { ...b, status: 'payment_pending' } : b));
  };

  const confirmPaymentReceived = async () => {
    if (!chatBookingId) return;
    await sendMessage('Zahlung erhalten ✓', 'payment_confirmed');
    
    // Update booking status to accepted (payment done, ready to ship)
    await fetch('/api/bookings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: chatBookingId,
        status: 'accepted'
      })
    });
    
    setBookings(prev => prev.map(b => b._id === chatBookingId ? { ...b, status: 'accepted' } : b));
  };

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Ticket functions
  const submitTicket = async (bookingId?: string) => {
    if (!ticketSubject.trim() || !ticketDescription.trim() || !salon) return;
    setTicketSubmitting(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raisedByUid: salon.uid,
          raisedByName: salon.name || 'Verkäufer',
          raisedByEmail: salon.email || '',
          raisedByRole: 'seller',
          subject: ticketSubject.trim(),
          description: ticketDescription.trim(),
          bookingId: bookingId || ticketBookingId || null
        })
      });
      if (res.ok) {
        setShowTicketForm(false);
        setTicketSubject("");
        setTicketDescription("");
        setTicketBookingId(null);
        alert('Ticket wurde erfolgreich erstellt!');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Fehler beim Erstellen des Tickets');
    } finally {
      setTicketSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'accepted': return '#9DBE8D';
      case 'payment_pending': return '#3b82f6';
      case 'shipped': return '#8b5cf6';
      case 'completed': return '#22c55e';
      case 'rejected': return '#ef4444';
      case 'cancelled': return '#6b7280';
      case 'confirmed': return '#9DBE8D';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Ausstehend';
      case 'accepted': return 'Angenommen';
      case 'payment_pending': return 'Zahlung ausstehend';
      case 'shipped': return 'Versendet';
      case 'completed': return 'Abgeschlossen';
      case 'rejected': return 'Abgelehnt';
      case 'cancelled': return 'Storniert';
      case 'confirmed': return 'Angenommen';
      default: return status;
    }
  };

  // Fetch activities (recent bookings) for popup
  const fetchActivities = async (salonUid: string) => {
    try {
      const res = await fetch(`/api/bookings?salonUid=${encodeURIComponent(salonUid)}`);
      const data = await res.json();
      if (data.bookings) {
        const recentBookings = data.bookings
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 6);
        const recentActivities = recentBookings.map((booking: any) => {
          const timeAgo = getTimeAgo(new Date(booking.createdAt));
          const serviceName = (booking.items || booking.services)?.[0]?.name || 'Produkt';
          return {
            id: booking._id,
            action: `hat ${serviceName} angefragt`,
            timestamp: timeAgo,
            user: booking.customerName
          };
        });
        setActivities(recentActivities);
      }
    } catch (error) {
      setActivities([]);
    }
  };

  // Helper for "vor X Tagen"
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays > 0) {
      return `${diffInDays} Tag${diffInDays > 1 ? 'e' : ''} zuvor`;
    } else if (diffInHours > 0) {
      return `${diffInHours} Stunde${diffInHours > 1 ? 'n' : ''} zuvor`;
    } else {
      return 'Gerade eben';
    }
  };

  // Fetch activities when modal is opened
  useEffect(() => {
    if (showActivities && salon?.uid) {
      fetchActivities(salon.uid);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showActivities, salon?.uid]);

  // Export booking history as CSV
  const exportHistoryCSV = () => {
    if (!historyBookings.length) return;
    const headers = [
      "Datum", "Käufer", "E-Mail", "Produkte", "Status", "Gesamt"
    ];
    const rows = historyBookings.map(b => {
      const items = b.items || b.services || [];
      return [
        new Date(b.createdAt).toLocaleDateString('de-DE'),
        b.buyerName || b.customerName || '',
        b.buyerEmail || '',
        items.map(s => s.name).join(", "),
        b.status,
        b.total
      ];
    });
    const csvContent =
      [headers, ...rows]
        .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
        .join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "anfragen_historie.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Only show booking history if not disabled in salon settings
  const bookingHistoryDisabled = salon?.disableBookingHistory === true;

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthPrompt />;
  }

  if (userRole && userRole !== "salon" && !isSystemAdmin) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
        <div className="text-center p-6 bg-white rounded-lg shadow-sm max-w-md mx-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You do not have permission to access this page.</p>
        </div>
      </main>
    );
  }

  // Split bookings into upcoming and history
  // Shipped stays in upcoming until marked as completed
  const upcomingBookings = filteredBookings.filter(
    b => ['pending', 'accepted', 'payment_pending', 'shipped'].includes(b.status)
  );
  const historyBookings = filteredBookings.filter(
    b => ['completed', 'rejected', 'cancelled'].includes(b.status)
  );

  return (
    <>
      <Navbar
        user={user}
        currentPath="/admin/bookings"
        viewingSalonUid={viewingSalonUid}
        salonName={salon?.name}
        salon={salon} // <-- Pass salon object here
      />
      <main className="min-h-screen bg-gray-50 font-sans p-0">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                  <FiCalendar className="mr-3 text-[#5C6F68]" /> Alle Anfragen
                  {viewingSalonUid && isSystemAdmin && (
                    <span className="text-lg text-gray-600 block mt-1 ml-0">(System-Ansicht für {salon?.name})</span>
                  )}
                </h1>
                <p className="text-gray-600">
                  Verwalten Sie alle Kaufanfragen
                </p>
              </div>
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#E4DED5] text-[#5C6F68] font-medium shadow-sm hover:bg-[#d7d2c7] transition"
                  onClick={() => setShowActivities(true)}
                  type="button"
                >
                  <FiUser className="w-4 h-4" />
                  Letzte Aktivitäten
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-50 text-red-700 font-medium shadow-sm hover:bg-red-100 transition"
                  onClick={() => { setShowTicketForm(true); setTicketBookingId(null); }}
                  type="button"
                >
                  <FiAlertTriangle className="w-4 h-4" />
                  Ticket erstellen
                </button>
              </div>
            </div>
          </div>

          {/* Letzte Aktivitäten Modal */}
          {showActivities && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
              <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
                  onClick={() => setShowActivities(false)}
                  aria-label="Schließen"
                  type="button"
                >
                  ×
                </button>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FiUser className="mr-2" /> Letzte Aktivitäten
                </h2>
                <div className="space-y-4">
                  {activities.length > 0 ? activities.map((activity) => (
                    <div key={activity.id} className="flex items-start">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-[#E4DED5] flex items-center justify-center text-[#5C6F68]">
                        <FiScissors size={16} />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-700">
                          {activity.user && (
                            <span className="font-medium text-[#5C6F68]">{activity.user}</span>
                          )}{' '}
                          {activity.action}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-gray-500 text-sm">Keine aktuellen Aktivitäten</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Filters and Sort */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Suche Käufer oder Produkte..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C6F68] focus:border-transparent"
                  style={{ color: "#000" }}
                />
              </div>
              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C6F68] focus:border-transparent"
                  style={{ color: "#000" }}
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
              {/* Date Filter */}
              <div>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C6F68] focus:border-transparent"
                  style={{ color: "#000" }}
                >
                  <option value="all">Gesamte Zeit</option>
                  <option value="today">Heute</option>
                  <option value="week">Diese Woche</option>
                  <option value="month">Diesen Monat</option>
                </select>
              </div>
              {/* Sort By */}
              <div>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C6F68] focus:border-transparent"
                  style={{ color: "#000" }}
                >
                  <option value="next">Sortieren nach neuester Anfrage</option>
                  <option value="recent">Sortieren nach zuletzt</option>
                  <option value="customer">Sortieren nach Kundenname</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${showHistory ? "bg-[#5C6F68] text-white" : "bg-gray-200 text-gray-700"}`}
                onClick={() => setShowHistory(v => !v)}
              >
                {showHistory ? "Zeige offene Anfragen" : "Zeige Anfrage-Historie"}
              </button>
            </div>
          </div>

          {/* Bookings List */}
          <div className="space-y-4">
            {/* Upcoming Bookings */}
            {!showHistory && (
              upcomingBookings.length > 0 ? (
                upcomingBookings.map((booking) => {
                  const items = booking.items || booking.services || [];
                  return (
                  <div key={booking._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-base font-semibold text-gray-900 flex items-center">
                            <FiUser className="w-4 h-4 mr-2 text-[#5C6F68]" />
                            {booking.buyerName || booking.customerName}
                          </h3>
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: getStatusColor(booking.status) }}
                          >
                            {getStatusLabel(booking.status)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                          <div className="flex items-center">
                            <FiCalendar className="w-4 h-4 mr-1 text-[#5C6F68]" />
                            {formatDate(booking.createdAt)}
                          </div>
                          {booking.buyerEmail && (
                            <div className="flex items-center">
                              <FiUser className="w-4 h-4 mr-1 text-[#5C6F68]" />
                              {booking.buyerEmail}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Special needs */}
                    {booking.specialNeeds && (
                      <div className="bg-gray-50 rounded-lg p-2 mb-2 text-xs text-gray-700">
                        <span className="font-medium">Besondere Wünsche:</span> {booking.specialNeeds}
                      </div>
                    )}

                    {/* Shipping address */}
                    {booking.shippingAddress && (
                      <div className="bg-blue-50 rounded-lg p-2 mb-2 text-xs text-gray-700">
                        <span className="font-medium">Lieferadresse:</span> {booking.shippingAddress.street} {booking.shippingAddress.number}, {booking.shippingAddress.zip} {booking.shippingAddress.city}, {booking.shippingAddress.country}
                      </div>
                    )}

                    {/* Products */}
                    <div className="border-t border-gray-200 pt-2 mb-2">
                      <h4 className="font-medium text-gray-900 mb-1 flex items-center text-sm">
                        <FiScissors className="w-4 h-4 mr-1 text-[#9DBE8D]" />
                        Produkte
                      </h4>
                      <div className={items.length > 1 ? "flex flex-col gap-1" : "grid grid-cols-1 md:grid-cols-2 gap-1"}>
                        {items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                            <span className="font-medium text-gray-900 text-sm">{item.name}</span>
                            <span className="font-medium text-[#5C6F68] text-sm">€{item.price}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                        <span className="font-medium text-gray-900 text-sm">Gesamt</span>
                        <span className="text-base font-bold text-[#5C6F68]">€{booking.total}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-1 items-center">
                      {/* Chat button - always visible */}
                      <button
                        onClick={() => openChat(booking._id)}
                        className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-0.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1"
                      >
                        <FiMessageSquare className="w-3 h-3" /> Chat
                      </button>
                      
                      {/* Ticket button */}
                      <button
                        onClick={() => { setShowTicketForm(true); setTicketBookingId(booking._id); }}
                        className="bg-orange-50 text-orange-700 hover:bg-orange-100 px-2 py-0.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1"
                      >
                        <FiAlertTriangle className="w-3 h-3" /> Ticket
                      </button>

                      {booking.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleBookingAction(booking._id, 'accepted')}
                            className="bg-green-50 text-green-700 hover:bg-green-100 px-2 py-0.5 rounded-md text-xs font-medium transition-colors"
                          >
                            Annehmen
                          </button>
                          <button
                            onClick={() => handleBookingAction(booking._id, 'rejected')}
                            className="bg-red-50 text-red-700 hover:bg-red-100 px-2 py-0.5 rounded-md text-xs font-medium transition-colors"
                          >
                            Ablehnen
                          </button>
                        </>
                      )}
                      {booking.status === 'accepted' && (
                        <>
                          <button
                            onClick={() => handleBookingAction(booking._id, 'shipped')}
                            className="bg-purple-50 text-purple-700 hover:bg-purple-100 px-2 py-0.5 rounded-md text-xs font-medium transition-colors"
                          >
                            Als versendet markieren
                          </button>
                          <button
                            onClick={() => handleBookingAction(booking._id, 'cancelled')}
                            className="bg-red-50 text-red-700 hover:bg-red-100 px-2 py-0.5 rounded-md text-xs font-medium transition-colors"
                          >
                            Stornieren
                          </button>
                        </>
                      )}
                      {booking.status === 'payment_pending' && (
                        <>
                          <button
                            onClick={() => handleBookingAction(booking._id, 'accepted')}
                            className="bg-green-50 text-green-700 hover:bg-green-100 px-2 py-0.5 rounded-md text-xs font-medium transition-colors"
                          >
                            Zahlung erhalten
                          </button>
                          <button
                            onClick={() => handleBookingAction(booking._id, 'cancelled')}
                            className="bg-red-50 text-red-700 hover:bg-red-100 px-2 py-0.5 rounded-md text-xs font-medium transition-colors"
                          >
                            Stornieren
                          </button>
                        </>
                      )}
                      {booking.status === 'shipped' && (
                        <button
                          onClick={() => handleBookingAction(booking._id, 'completed')}
                          className="bg-green-50 text-green-700 hover:bg-green-100 px-2 py-0.5 rounded-md text-xs font-medium transition-colors"
                        >
                          Als abgeschlossen markieren
                        </button>
                      )}
                    </div>
                  </div>
                  );
                })
              ) : (
                <div className="text-center py-16 bg-white rounded-lg">
                  <FiCalendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Keine offenen Anfragen</h3>
                  <p className="text-gray-600">
                    {searchTerm || statusFilter !== "all" || dateFilter !== "all" 
                      ? "Versuchen Sie, Ihre Filter anzupassen, um mehr Buchungen zu sehen."
                      : "Sie haben noch keine bevorstehenden Buchungen."
                    }
                  </p>
                </div>
              )
            )}

            {/* Booking History */}
            {showHistory && (
              bookingHistoryDisabled ? (
                <div className="text-center py-16 bg-white rounded-lg">
                  <FiCalendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Anfrage-Historie deaktiviert</h3>
                  <p className="text-gray-600">
                    Die Anzeige der Buchungshistorie ist für diesen Salon deaktiviert.
                  </p>
                </div>
              ) : historyBookings.length > 0 ? (
                <>
                  <div className="flex justify-end gap-2 mb-2">
                    <button
                      onClick={exportHistoryCSV}
                      className="bg-[#5C6F68] text-white px-3 py-1 rounded-md text-xs font-medium hover:bg-[#4a5a54] transition"
                      type="button"
                    >
                      CSV Export
                    </button>
                  </div>
                  {historyBookings.map((booking) => {
                    const items = booking.items || booking.services || [];
                    return (
                    <div key={booking._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-base font-semibold text-gray-900 flex items-center">
                              <FiUser className="w-4 h-4 mr-2 text-[#5C6F68]" />
                              {booking.buyerName || booking.customerName}
                            </h3>
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: getStatusColor(booking.status) }}
                            >
                              {getStatusLabel(booking.status)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                            <div className="flex items-center">
                              <FiCalendar className="w-4 h-4 mr-1 text-[#5C6F68]" />
                              {formatDate(booking.createdAt)}
                            </div>
                            {booking.buyerEmail && (
                              <div className="flex items-center">
                                <FiUser className="w-4 h-4 mr-1 text-[#5C6F68]" />
                                {booking.buyerEmail}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Special needs */}
                      {booking.specialNeeds && (
                        <div className="bg-gray-50 rounded-lg p-2 mb-2 text-xs text-gray-700">
                          <span className="font-medium">Besondere Wünsche:</span> {booking.specialNeeds}
                        </div>
                      )}

                      {/* Shipping address */}
                      {booking.shippingAddress && (
                        <div className="bg-blue-50 rounded-lg p-2 mb-2 text-xs text-gray-700">
                          <span className="font-medium">Lieferadresse:</span> {booking.shippingAddress.street} {booking.shippingAddress.number}, {booking.shippingAddress.zip} {booking.shippingAddress.city}, {booking.shippingAddress.country}
                        </div>
                      )}

                      {/* Products */}
                      <div className="border-t border-gray-200 pt-2 mb-2">
                        <h4 className="font-medium text-gray-900 mb-1 flex items-center text-sm">
                          <FiScissors className="w-4 h-4 mr-1 text-[#9DBE8D]" />
                          Produkte
                        </h4>
                        <div className={items.length > 1 ? "flex flex-col gap-1" : "grid grid-cols-1 md:grid-cols-2 gap-1"}>
                          {items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                              <span className="font-medium text-gray-900 text-sm">{item.name}</span>
                              <span className="font-medium text-[#5C6F68] text-sm">€{item.price}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                          <span className="font-medium text-gray-900 text-sm">Gesamt</span>
                          <span className="text-base font-bold text-[#5C6F68]">€{booking.total}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-1 items-center">
                        {/* Chat button - always visible */}
                        <button
                          onClick={() => openChat(booking._id)}
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-0.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1"
                        >
                          <FiMessageSquare className="w-3 h-3" /> Chat
                        </button>
                        {/* Ticket button */}
                        <button
                          onClick={() => { setShowTicketForm(true); setTicketBookingId(booking._id); }}
                          className="bg-orange-50 text-orange-700 hover:bg-orange-100 px-2 py-0.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1"
                        >
                          <FiAlertTriangle className="w-3 h-3" /> Ticket
                        </button>
                        {(booking.status === 'rejected' || booking.status === 'cancelled') && (
                          <button
                            onClick={() => handleBookingAction(booking._id, 'pending')}
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-0.5 rounded-md text-xs font-medium transition-colors"
                          >
                            Wiederherstellen
                          </button>
                        )}
                        {booking.status === 'shipped' && (
                          <button
                            onClick={() => handleBookingAction(booking._id, 'completed')}
                            className="bg-green-50 text-green-700 hover:bg-green-100 px-2 py-0.5 rounded-md text-xs font-medium transition-colors"
                          >
                            Als abgeschlossen markieren
                          </button>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </>
              ) : (
                <div className="text-center py-16 bg-white rounded-lg">
                  <FiCalendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Keine Anfrage-Historie gefunden</h3>
                  <p className="text-gray-600">
                    {searchTerm || statusFilter !== "all" || dateFilter !== "all" 
                      ? "Versuchen Sie, Ihre Filter anzupassen, um mehr Buchungen zu sehen."
                      : "Keine vorherigen Buchungen gefunden."
                    }
                  </p>
                </div>
              )
            )}
          </div>



          {/* Ticket Modal */}
          {showTicketForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FiAlertTriangle className="text-red-500" />
                    Ticket an Admin erstellen
                  </h3>
                  <button
                    onClick={() => { setShowTicketForm(false); setTicketSubject(""); setTicketDescription(""); setTicketBookingId(null); }}
                    className="text-gray-400 hover:text-gray-700 text-xl"
                  >×</button>
                </div>
                {ticketBookingId && (
                  <p className="text-xs text-gray-500 mb-3">Bezogen auf Anfrage: {ticketBookingId}</p>
                )}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Betreff</label>
                    <input
                      type="text"
                      value={ticketSubject}
                      onChange={e => setTicketSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5C6F68]"
                      placeholder="Kurze Beschreibung des Problems"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
                    <textarea
                      value={ticketDescription}
                      onChange={e => setTicketDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5C6F68]"
                      rows={4}
                      placeholder="Beschreiben Sie das Problem im Detail..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => submitTicket()}
                      disabled={ticketSubmitting || !ticketSubject.trim() || !ticketDescription.trim()}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
                    >
                      {ticketSubmitting ? 'Wird gesendet...' : 'Ticket senden'}
                    </button>
                    <button
                      onClick={() => { setShowTicketForm(false); setTicketSubject(""); setTicketDescription(""); setTicketBookingId(null); }}
                      className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
      {/* Floating Chat Widget */}
      {salon && (
        <ChatWidget
          userUid={salon.uid}
          userName={user?.name || user?.username || salon.name || 'Verkäufer'}
          userRole="seller"
          salonUid={salon.uid}
          openBookingId={chatBookingId}
          onExternalClose={() => setChatBookingId(null)}
        />
      )}
    </>
  );
}

// Loading screen component
const LoadingScreen = () => (
  <main className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5C6F68] mx-auto mb-4"></div>
      <p className="text-[#5C6F68] text-lg">Anfragen werden geladen...</p>
    </div>
  </main>
);

const AuthPrompt = () => (
  <main className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
    <div className="text-center p-6 bg-white rounded-lg shadow-sm max-w-md mx-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Zugriff eingeschränkt</h2>
      <p className="text-gray-600 mb-4">Bitte melden Sie sich an, um die Anfragen zu sehen</p>
      <button className="bg-[#5C6F68] hover:bg-[#4a5a54] text-white font-medium py-2 px-4 rounded-md">
        Anmelden
      </button>
    </div>
  </main>
);
  